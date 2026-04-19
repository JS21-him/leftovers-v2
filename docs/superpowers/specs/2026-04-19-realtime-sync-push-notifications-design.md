# Real-time Sync + Push Notifications — Design Spec

**Date:** 2026-04-19
**Status:** Approved

---

## Overview

Two features shipped together:

1. **Real-time sync** — Fridge and shopping list update instantly across all household members without manual refresh.
2. **Push notifications** — Daily server-side push at 8am UTC notifying users of items expiring the next day.

---

## Feature 1: Real-time Sync

### Goal
When any household member adds or deletes a fridge item, or checks/unchecks a shopping item, all other members see the change immediately — no pull-to-refresh required.

### Implementation

**`useFridge`** — after initial fetch, subscribe to `postgres_changes` on `fridge_items` filtered by `household_id`:
- `INSERT` → append new item to state (maintain expiry sort order)
- `DELETE` → remove item from state by id

**`useShopping`** — after initial fetch, subscribe to `postgres_changes` on `shopping_list_items` filtered by `household_id`:
- `INSERT` → append to state
- `DELETE` → remove from state by id
- `UPDATE` → replace item in state (handles check/uncheck from another member)

**Cleanup:** Each `useEffect` returns an unsubscribe call to remove the Realtime channel when the hook unmounts.

### Constraints
- No new packages required — Supabase Realtime is already available via `@supabase/supabase-js`
- Realtime must be enabled for `fridge_items` and `shopping_list_items` tables in the Supabase dashboard
- Subscription is filtered by `household_id` so users only receive events for their own household

---

## Feature 2: Push Notifications

### Goal
Users receive a push notification at 8am UTC on the day before any fridge item expires: `"🧊 Heads up! Milk, Eggs expire tomorrow."`

This fires server-side so it reaches users who haven't opened the app recently — the primary audience for this feature.

### Notification Trigger
- **Timing:** Daily at 8:00am UTC via pg_cron
- **Condition:** `fridge_items.expiry_date = today + 1 day`
- **Lead time:** 1 day in advance

### Data Change
- Add `push_token` column (text, nullable) to `profiles` table
- Tokens are upserted on app launch; null if user denies permission or is on Expo Go

### App Side

**New hook: `useNotifications`**
- Requests notification permission via `expo-notifications`
- Fetches the Expo push token
- Upserts token to `profiles.push_token` for the current user
- Called once from `_layout.tsx` after session is confirmed

**Expo Go behaviour:** `expo-notifications` returns a null token in Expo Go (not a dev build). The hook detects this and exits early — no errors, no side effects. Feature silently no-ops until a dev build is installed.

### Backend

**New Edge Function: `send-expiry-notifications`**
- No auth header required (called by cron, not by users)
- Queries `fridge_items` where `expiry_date = CURRENT_DATE + 1`
- Groups items by `household_id`
- For each household, fetches push tokens of all members from `profiles`
- Skips members with null tokens
- Batches push messages and sends to Expo Push API (`https://exp.host/--/api/v2/push/send`)
- Uses Expo's free push service — no additional account or API key needed

**Cron job (pg_cron):**
```sql
select cron.schedule(
  'expiry-notifications',
  '0 8 * * *',
  $$
    select net.http_post(
      url := '<SUPABASE_URL>/functions/v1/send-expiry-notifications',
      headers := '{"Authorization": "Bearer <SERVICE_ROLE_KEY>"}'::jsonb
    )
  $$
);
```
Set up once in the Supabase SQL editor. Uses `pg_net` (pre-installed on Supabase) to make the HTTP call.

### Notification Format
```
Title: 🧊 Leftovers
Body:  Heads up! Milk, Eggs expire tomorrow.
```
If more than 3 items: `"Milk, Eggs, Cheese and 2 more expire tomorrow."`

---

## What's Not In Scope
- Notification preferences / opt-out UI (future)
- Notifications for items expiring in 2+ days (future)
- Push notifications for shopping list changes (future)
- Receipt/fridge scan notifications (future)

---

## Deployment Note
Push notification delivery requires an Expo dev build. The code is safe to ship to Expo Go — tokens will be null and no notifications will be sent. No errors or crashes.
