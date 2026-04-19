# Leftovers v2 — Project Handoff Document

## Overview

Leftovers v2 is an AI-powered kitchen assistant app built with Expo SDK 54, React Native, TypeScript, and Supabase. Users scan their fridge or receipts, get AI recipe suggestions, build smart shopping lists, and share a household fridge with family members.

**GitHub:** `https://github.com/JS21-him/leftovers-v2`
**Supabase project ref:** `noykaaacbqfubspubjhl`
**Stack:** Expo SDK 54, React Native, TypeScript, expo-router, Supabase (auth + DB + Edge Functions), Claude API (claude-sonnet-4-6), RevenueCat

---

## What the App Does

### Screens & Features

**Onboarding (5 steps):**
- Welcome screen with app pitch
- Feature highlights (scan, recipes, shopping, family sharing)
- Dietary preferences (Vegetarian, Vegan, Gluten-Free, Dairy-Free, Nut-Free, Pescatarian)
- Household size selector (1–6+)
- Personalised "Your plan is ready" summary screen before account creation

**Auth:**
- Email/password signup and login via Supabase auth
- Auto-redirect based on session state in `_layout.tsx`
- Profile created automatically on signup (dietary prefs + household size)

**Fridge Tab:**
- View all fridge items sorted by expiry date
- Items split into "EXPIRES SOON" (≤5 days) and "ALL ITEMS" sections
- Expiry color coding: red (≤2 days), orange (≤5 days), grey (safe)
- Scan fridge photo with AI (free for all users)
- Scan grocery receipt with AI (free for all users)
- Add items manually via modal (name, quantity, unit, expiry date)
- Delete items with confirmation dialog
- Loading spinner on initial fetch

**Recipes Tab:**
- AI generates 10 recipes from fridge contents
- Free users see 5, premium users see 10
- Top recipe shown as highlighted banner (orange gradient) if items are expiring soon
- Each recipe card shows: emoji, title, cook time, difficulty, missing ingredient count
- Green "1 away" badge on recipes where only 1 ingredient is missing
- "You have everything!" label when user has all ingredients
- Tap recipe → full detail screen with ingredient checklist (✓/○) and numbered steps

**Shopping Tab:**
- Manual item entry with add button
- AI builds full weekly shopping list (premium feature)
- Items auto-grouped by category: 🥩 Meat & Fish, 🥦 Produce, 🥛 Dairy, 🍞 Bakery, 🥫 Pantry, 🥤 Drinks, ❄️ Frozen, 🧴 Other
- Check/uncheck items
- Clear all checked items
- Order via Instacart or Walmart deeplinks (premium)

**Settings:**
- Household invite code (6-character, displayed large)
- Share invite code via native share sheet
- Join another household by entering their code
- Refresh invite code (owner only)
- Members list
- Premium upgrade / restore purchases
- Sign out

---

## Architecture

### Frontend
- `app/` — expo-router file-based routing
- `app/_layout.tsx` — root layout, auth redirect guard, RevenueCat init
- `app/index.tsx` — root redirect to `/(tabs)/fridge`
- `app/(auth)/` — onboarding, login
- `app/(tabs)/` — fridge, recipes, shopping
- `app/recipe/[id].tsx` — recipe detail
- `app/settings.tsx` — settings modal
- `components/` — UI components (Button, Header, EmptyState, PremiumGate, FridgeItem, RecipeCard, etc.)
- `hooks/` — useFridge, useRecipes, useShopping, useHousehold, useAuth, useSubscription
- `lib/` — supabase.ts, claude.ts, purchases.ts, deeplinks.ts
- `constants/` — theme.ts (colors, spacing, typography), config.ts (env vars)

### Backend (Supabase)
- **Edge Functions (Deno):** scan-fridge, scan-receipt, generate-recipes, build-shopping-list
- All functions: CORS headers, auth header check (401 if missing), input validation, startup ANTHROPIC_API_KEY guard
- Claude model: `claude-sonnet-4-6`

### Database Schema
```
profiles          — user preferences (dietary_preferences[], household_size)
households        — id, name, owner_id, invite_code (6-char auto-generated), created_at
household_members — household_id, user_id, joined_at (composite PK)
fridge_items      — id, user_id, household_id, name, quantity, unit, expiry_date, created_at
shopping_list_items — id, user_id, household_id, name, quantity, unit, checked, created_at
saved_recipes     — id, user_id, title, emoji, ingredients (jsonb), instructions[], cook_time_minutes, difficulty
```

### RLS Policies
- Fridge and shopping items: accessible by all members of the same household
- Households: viewable by members, editable by owner only
- Auto-creates household + membership on user signup via trigger

---

## What Works Well

- **Core loop is correct:** scan → fridge → expiry sorted → recipes → shopping. No competitor does all four reliably.
- **Household sharing:** Real-time shared fridge between family members via invite code. Most competitors don't have this.
- **Free scanning:** Receipt and fridge scanning are free — removes the #1 onboarding friction point.
- **Category-sorted shopping list:** Items grouped by store section (produce, dairy, meat, etc.) — saves real time in-store.
- **"1 ingredient away" badge:** Surfaces near-complete recipes, drives shopping list adds.
- **Onboarding:** 5-step personalised flow with feature showcase and "your plan is ready" summary before paywall — proven conversion pattern.
- **Security:** All Edge Functions require auth headers. Scan functions were hardened.
- **Crash prevention:** `.maybeSingle()` instead of `.single()` in household queries, `try/finally` in login, delete confirmation dialogs.
- **TypeScript:** Clean — zero errors. Supabase functions excluded from tsconfig (Deno files).

---

## What Needs Work (Future Fixes)

### High Priority
1. **Push notifications for expiry** — NoWaste's most-loved feature. Users forget to open the app. Needs `expo-notifications` + a scheduled Supabase Edge Function or cron job to check expiry dates daily.
2. **Offline persistence** — No offline support. All mutations fail silently if network drops. Consider `@react-native-async-storage/async-storage` as a local cache layer.
3. **useHousehold N+1 query** — Fetches each member's profile in a separate query. Needs a Supabase RPC or join to fetch all members in one call.
4. **Member display names** — Currently shows `Member abc123` (first 6 chars of UUID). Needs a `display_name` column on profiles and a way to set it.
5. **Real-time sync** — Changes made by one household member don't appear for others without a manual refresh. Add Supabase Realtime subscriptions to `useFridge` and `useShopping`.

### Medium Priority
6. **Voice dictation for adding items** — Supercook's killer feature. Let users say "milk, eggs, cheese" out loud. Use `expo-speech` or the device keyboard's voice input.
7. **Pantry / Freezer tabs** — Users track more than just the fridge. Add location field to fridge_items and filter by location.
8. **Expiry date auto-detection** — Currently Claude doesn't extract expiry dates from fridge photos. Update the scan-fridge prompt to attempt expiry date extraction.
9. **Settings show loading for subscription** — `useSubscription` loading state not checked in settings UI.
10. **Barcode scanning** — Add `expo-barcode-scanner` for quick item entry. Map barcodes to product names via Open Food Facts API (free).

### Low Priority
11. **Web support** — White screen due to `react-native-purchases` having no web implementation. Metro resolver stub was added but incomplete. Needs full audit of web-incompatible modules.
12. **Recipe saving** — `saved_recipes` table exists in the DB but there's no UI to save or view saved recipes.
13. **Shopping list item confirmation when restocking** — When AI builds list and user buys items, there's no "mark as purchased → add to fridge" flow.
14. **Email validation on login** — Currently only checks non-empty. Should validate email format with regex.
15. **Text overflow in recipe cards** — Long recipe titles can overflow. `numberOfLines={1}` is set on title but no ellipsis truncation style.

---

## Competitor Intelligence

### What Works in Similar Apps

| Pattern | Best Example | Why It Matters |
|---|---|---|
| Photo/receipt scan to auto-populate | NoWaste, Cal AI | Eliminates manual entry — #1 friction point |
| "1 ingredient away" surfacing | Supercook | Creates urgency, drives shopping adds |
| Expiry-date-first sorting | NoWaste | The right priority for waste reduction |
| Personalised onboarding before paywall | Cal AI | High perceived value before asking for money |
| Aisle-sorted grocery lists | Mealime | Saves real time in-store |
| Ultra-low annual pricing ($7/yr) | NoWaste | Removes price objection |
| Family shared fridge | Whisk/Samsung Food | Retention hook — multiple users = stickier |
| Voice dictation pantry input | Supercook | Eyes-free, hands-free — ideal in kitchen |

### What to Avoid

| Anti-Pattern | Why |
|---|---|
| Hiding pricing until end of onboarding | Cal AI backlash — feels deceptive |
| Free tier capped at 3 items | Whisk — destroys trust before conversion |
| No AI correction loop | Cal AI — wrong AI = permanently bad data |
| Abandoning the app | Fridge Pal, Yummly — users lose data and switch |
| All nutrition data behind paywall | Mealime — blocks health-motivated users |

### Pricing Insight
- NoWaste: $7/year — converts well, low cancellation
- Cal AI: $30/year — highest complaints about billing
- Mealime: $50/year — mid-tier complaints
- **Recommended:** Under $10/year or $1.99/month. Never hide the price.

---

## Environment Setup

### .env.local (in project root)
```
EXPO_PUBLIC_SUPABASE_URL=https://noykaaacbqfubspubjhl.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
EXPO_PUBLIC_REVENUECAT_KEY=placeholder
```

### Supabase Secrets (set via CLI)
```
ANTHROPIC_API_KEY=sk-ant-...
```

### Running the App
```bash
npx expo start --clear          # Mobile (scan QR with Expo Go)
npx expo start --tunnel --clear # If not on same WiFi
```

---

## Known Behaviours in Expo Go
- RevenueCat is skipped (`Constants.appOwnership === 'expo'`) — all users appear as premium
- Camera/image picker works in Expo Go
- Supabase auth and Edge Functions work normally
- Push notifications require a dev build (not available in Expo Go)

---

## Superpowers Skills Available
The following skills are installed and should be used for development workflow:
- `brainstorming` — Use before starting any new feature to design it properly
- `writing-plans` — Creates detailed implementation plans with TDD steps
- `subagent-driven-development` — Dispatches fresh subagents per task with two-stage review
- `executing-plans` — Inline plan execution with checkpoints
- `test-driven-development` — TDD workflow for all new code
- `systematic-debugging` — Structured debugging approach
- `requesting-code-review` / `receiving-code-review` — Code review workflow
- `finishing-a-development-branch` — Final checks before merging
- `using-git-worktrees` — Isolated workspace per feature

**Workflow:** For any new feature → brainstorm → write-plan → subagent-driven-development → finishing-a-development-branch

---

## Commit History Summary
All work is on `main` branch. Key commits:
- Initial app scaffold (Tasks 1–9): project setup, theme, Supabase, auth, tabs
- Tasks 10–18: all hooks, components, Edge Functions, screens
- Post-build fixes: RevenueCat Expo Go guard, unmatched route fix, TypeScript cleanup
- Household sharing: DB migration, useHousehold hook, settings UI
- Security fixes: auth headers on all Edge Functions, CORS
- UX improvements: loading spinners, delete confirmation, category shopping, "1 away" badge, onboarding revamp
- Free scanning: removed PremiumGate from ScanButtons
