# Leftovers v2 — Design Spec

**Date:** 2026-04-14
**Status:** Approved

## Overview

A polished React Native mobile app (iOS & Android) that acts as a daily kitchen assistant. Users know what's in their fridge, get smart recipe suggestions, and can build and order their grocery list — all with minimal manual effort thanks to AI.

The app is built fresh from scratch on a new GitHub repo. Same core concept as Leftovers v1, but a clean, well-engineered implementation.

---

## Visual Design

**Style:** Warm & Cozy
- Primary color: Orange (`#f97316`)
- Background: Cream (`#fff8f0`)
- Accents: Deep orange (`#ea580c`), warm brown text (`#7c2d12`)
- Rounded corners throughout, friendly typography
- Feels like a cozy recipe book — inviting and approachable

---

## Navigation

3 tabs (bottom tab bar):

| Tab | Icon | Purpose |
|-----|------|---------|
| Fridge | 🧊 | View and manage fridge contents |
| Recipes | 🍳 | AI-generated recipe suggestions |
| Shopping | 🛒 | Shopping list + grocery ordering |

Settings (profile, subscription, preferences) accessible via gear icon in the top-right corner of any screen.

---

## Screens

### Fridge Tab
- Header with "My Fridge" title and settings gear icon
- **AI Scan Fridge** button (premium) — camera opens, Claude analyzes photo and extracts items
- **Scan Receipt** button (premium) — camera opens, Claude reads receipt and adds groceries
- "Expires Soon" section — items expiring within 5 days, sorted by urgency, expiry shown in red/orange
- "All Items" section — full fridge inventory, each item shows name, quantity, days until expiry
- Manual "Add Item" button (free) — simple form: name, quantity, expiry date
- Swipe to delete items

### Recipes Tab
- AI suggestion banner at the top — proactively suggests a recipe using items expiring soon
- Recipe cards: emoji illustration, name, number of fridge items used, cook time, difficulty
- Tapping a card opens full recipe: ingredients (highlights which ones you have), step-by-step instructions
- Free users: 5 AI-generated recipes per day
- Premium users: unlimited, with dietary preference filters

### Shopping Tab
- **Build My Weekly List** button (premium) — AI analyzes fridge, past usage, and generates a shopping list
- Manual add item (free)
- Checklist of shopping items with checkboxes
- **Order on Instacart** button (premium) — opens Instacart with items pre-filled via affiliate deep link
- **Order on Walmart** button (premium) — opens Walmart with items pre-filled via affiliate deep link

### Onboarding (first launch)
- Welcome screen
- Dietary preferences (vegetarian, vegan, gluten-free, allergies)
- Household size
- Sign up / log in with Supabase Auth (email or Apple/Google)

---

## Architecture

### Frontend
- **Expo SDK 54** with React Native and TypeScript
- **expo-router** for file-based navigation
- **react-native-reanimated** for animations
- **react-native-gesture-handler** for swipe interactions
- **AsyncStorage** for lightweight local caching
- **RevenueCat** (`react-native-purchases`) for subscription management

### Backend
- **Supabase** for auth, database, and file storage
- **Supabase Edge Functions** for all Claude API calls (API key never in the app)

### Database Schema (Supabase)

```
users
  id, email, household_size, dietary_preferences[], created_at

fridge_items
  id, user_id, name, quantity, unit, expiry_date, created_at

shopping_list_items
  id, user_id, name, quantity, unit, checked, created_at

saved_recipes
  id, user_id, title, ingredients[], instructions, cook_time, difficulty, created_at
```

### AI Features (Claude via Supabase Edge Functions)

| Feature | Trigger | Input | Output |
|---------|---------|-------|--------|
| Fridge photo scan | User taps "Scan Fridge" | Base64 image | Array of `{name, quantity, unit}` |
| Receipt scan | User taps "Scan Receipt" | Base64 image | Array of `{name, quantity, unit}` |
| Recipe generation | Recipes tab load | Fridge item list | Array of recipe objects |
| Weekly list builder | User taps "Build My Weekly List" | Fridge items + household size + preferences | Array of shopping items |

### Grocery Ordering (v1)

Instacart and Walmart both support affiliate/search deep links. When the user taps "Order on Instacart" or "Order on Walmart", the app constructs a URL with the shopping list items and opens it in the browser/native app. No official API required for v1 — clean upgrade path to a full cart API later.

---

## Freemium Model

**Free tier:**
- Manual fridge item entry
- 5 AI recipe suggestions per day
- Manual shopping list

**Premium tier (RevenueCat subscription):**
- AI fridge photo scan
- Receipt scanning
- Unlimited AI recipe suggestions
- Dietary preference filters
- AI weekly list builder
- Instacart & Walmart ordering buttons

---

## Error Handling

- AI scan failures show a friendly error with a "Try Again" button — never a raw error message
- Supabase offline: show cached data with a subtle "offline" indicator
- Expired items: automatically flagged, user prompted to remove them
- Empty states: always show a helpful prompt (e.g., "Add your first item to get started")

---

## Out of Scope (v1)

- Real-time cart API integration with Instacart/Walmart (affiliate links used instead)
- Barcode scanning
- Meal planning calendar
- Social/sharing features
- Push notifications (can add post-launch)
