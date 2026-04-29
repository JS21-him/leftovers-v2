# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project: Leftovers v2 (Expo/React Native app)

- Stack: Expo SDK 54, TypeScript, React Native, expo-router, Supabase, RevenueCat
- GitHub repo: `https://github.com/JS21-him/leftovers-v2`
- Always run `npx tsc --noEmit` after edits to verify types
- After changes, commit and push to GitHub (user wants shipped code, not drafts)
- When Expo build errors appear, check `_layout.tsx`, `purchases.ts`, and package versions first

## Starting the App - Correct Command

```powershell
npm start
```

This runs `cross-env NODE_OPTIONS=--dns-result-order=ipv4first expo start --clear`.
The `cross-env` prefix fixes the Node 24 DNS issue that causes `fetch failed` on startup.
The `--clear` flag wipes Metro's cache on every start to prevent stale bundle errors.

### If the app won't load on your phone:
1. Make sure phone and PC are on the same WiFi
2. Or use tunnel mode: `npx expo start --tunnel`
3. If you see `fetch failed` in the terminal: `npm start` already fixes this via `cross-env`

### Startup Checklist
- [ ] `.env.local` exists at project root with all 3 keys (see Environment Variables below)
- [ ] Supabase edge functions are deployed (`supabase functions deploy`)
- [ ] `ANTHROPIC_API_KEY` is set as a Supabase secret
- [ ] Phone and PC on same WiFi (or use `--tunnel`)
- [ ] Expo Go app is installed on phone
- [ ] Scan the QR code in the terminal with the Expo Go app

## Dev Environment Notes

- Slash commands (e.g., /plugin) run inside Claude Code, NOT in a separate terminal
- Assume user is testing on Expo Go unless told otherwise
- Only one terminal needed — no local backend server (AI runs via Supabase Edge Functions)
- If phone can't connect on same WiFi, use tunnel mode: `npx expo start --tunnel`
- The phone and PC must be on the same WiFi, OR use `--tunnel` to bypass network issues
- Node 24 on Windows requires the `--dns-result-order=ipv4first` flag — `npm start` handles this automatically via `cross-env`
- `.npmrc` has `legacy-peer-deps=true` — required because `jest-expo` pins an older jest peer dep

## Workflow Defaults

- After implementing features, always: (1) verify build, (2) git add/commit with descriptive message, (3) push to origin
- Prefer small, verified commits over large unverified ones — sessions get interrupted

## Commands

```bash
npm start          # Start Expo dev server (clears Metro cache automatically)
npm run android    # Run on Android emulator
npm run ios        # Run on iOS simulator
npm run web        # Run in browser
npm test           # Run Jest tests once
npm run test:watch # Run Jest tests in watch mode
```

## Architecture

**Leftovers v2** is an Expo/React Native app for fridge inventory management, recipe suggestions, and AI-powered shopping lists. All AI features run via Supabase Edge Functions (Deno) which call the Claude API server-side.

### Routing

File-based routing via `expo-router`. Three tabs under `app/(tabs)/`:
- `fridge.tsx` — Fridge inventory (manual add, AI scan via image picker)
- `recipes.tsx` — AI recipe suggestions based on current fridge contents
- `shopping.tsx` — Shopping list with AI-powered weekly list builder

Other screens:
- `app/(auth)/onboarding.tsx` — Onboarding/sign-up screen
- `app/(auth)/login.tsx` — Login screen
- `app/recipe/[id].tsx` — Recipe detail (ingredients + step-by-step instructions)
- `app/settings.tsx` — Settings modal

### Backend: Supabase Edge Functions

All AI calls go through Supabase Edge Functions (no local server needed). Functions live in `supabase/functions/`:
- `scan-fridge/` — Fridge photo → list of items
- `scan-receipt/` — Receipt image → list of items
- `generate-recipes/` — Fridge items → recipe suggestions (10 recipes; free users get 5, premium get 10)
- `build-shopping-list/` — Fridge items + preferences → weekly shopping list

Edge Function pattern: startup guard for `ANTHROPIC_API_KEY`, CORS headers, auth header check (401 if missing), input validation, top-level try/catch.

### Environment Variables

`.env.local` (Expo app):
```
EXPO_PUBLIC_SUPABASE_URL=<your supabase url>
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your supabase anon key>
EXPO_PUBLIC_REVENUECAT_KEY=<your revenuecat key>
```

Supabase secrets (set via CLI):
```
ANTHROPIC_API_KEY=<your anthropic key>
```

### State Management

Custom hooks (no global context):
- `useFridge()` — fridge items: fetch, add, delete, expiry helpers
- `useRecipes()` — AI recipe generation; free=5, premium=10
- `useShopping()` — shopping list: fetch, add, toggle, delete, clearChecked
- `useAuth()` — Supabase session management
- `useSubscription()` — RevenueCat premium status

### Key Patterns

- RevenueCat is skipped when running in Expo Go (`Constants.appOwnership === 'expo'`) — premium features will appear as free-tier in Expo Go
- Auth redirect in `_layout.tsx` waits for `segments.length > 0` before redirecting to avoid "unmatched route" on cold start
- `useCallback` with functional state updaters (not raw state) to avoid stale closures in hooks
- Path alias `@/*` maps to root

### Notable Config

- Em dash characters (`—`) in string literals cause Hermes parse errors. Always use plain hyphens `-` in JS/TS string literals
- All `expo start` scripts include `--clear` to avoid Metro cache errors
- `jest.presetup.js` pre-populates `globalThis.structuredClone` to fix Expo SDK 54 + Jest 30 conflict

## Premium Features (Paywalled via PremiumGate component)

- Receipt scanning
- Fridge photo scanning
- Recipe generation (free users see 5, premium sees 10)
- AI weekly shopping list builder
- Instacart / Walmart order deeplinks
