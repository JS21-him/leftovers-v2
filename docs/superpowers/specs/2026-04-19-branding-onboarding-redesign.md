# Branding + Onboarding Redesign

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the emoji logo with a custom fridge-E wordmark and redesign onboarding to lead with value (scan before signup).

**Architecture:** Two independent changes — (1) a reusable `<Logo>` component with the fridge-E SVG mark, used across the app; (2) a new scan-first onboarding flow that uses Supabase anonymous auth to let guests scan before creating an account.

**Tech Stack:** React Native / Expo SDK 54, TypeScript, expo-router, Supabase anonymous auth, SVG via `react-native-svg`

---

## 1. Logo / Branding

### Mark

The wordmark is **LEFTOVERS** in bold system sans-serif, white on dark background. The **E** is replaced by an SVG fridge icon drawn in orange (`#f97316`).

Fridge icon anatomy (SVG, ~32×54px viewBox `0 0 32 54`):
- Outer body: `<rect x="1" y="1" width="26" height="52" rx="3" stroke="#f97316" stroke-width="3" fill="none"/>`
- Freezer divider: horizontal line at y=16
- Shelves: 3 short lines at y=28, y=38, y=47 (slightly indented left, not full width)
- Freezer handle: small filled rect, right side, top section
- Fridge handle: small filled rect, right side, lower section

The icon sits inline with the text, baseline-aligned. `L` and `FTOVERS` are rendered as text nodes. No external font dependency — `fontFamily: 'system-ui'`, `fontWeight: '900'`.

### Component

A `<Logo>` component at `components/Logo.tsx` accepts a `size` prop (`'sm' | 'md' | 'lg'`) and an optional `showTagline` boolean. It renders the full wordmark lockup (wordmark + orange divider line + optional tagline).

Size map:
- `sm` — 28px font, ~28×46px fridge icon (app header use)
- `md` — 42px font, ~32×54px fridge icon (welcome screen)
- `lg` — 52px font, ~38×64px fridge icon (splash / loading)

### Usage

Replace any existing text/emoji logo usages across the app:
- `app/(auth)/onboarding.tsx` — use `<Logo size="lg" showTagline />`
- `app/(auth)/login.tsx` — use `<Logo size="md" />`
- `app/_layout.tsx` header (if shown) — use `<Logo size="sm" />`

---

## 2. Onboarding Redesign — Scan First

### Flow

```
Welcome Screen
    ↓ "Scan My Fridge"
    ↓  (create anonymous Supabase session)
Scan Screen (camera/photo picker)
    ↓  (AI processes image)
Recipe Preview Screen
    ↓
Sign-up Modal
    "Your fridge is ready — save it free"
    ↓ "Create Free Account" (converts anon session)
    ↓ "Skip for now" (stays anonymous, can be prompted again later)
    ↓
Main App (tabs)
```

### Welcome Screen (`app/(auth)/onboarding.tsx`)

Replaces the current sign-up screen. Shows:
- `<Logo size="lg" showTagline />` centered
- One sentence of value prop: *"See what you can cook with what you have."*
- Primary CTA: `Scan My Fridge` button (orange, full width)
- Secondary link: `I already have an account` (navigates to login)
- Fine print: `No account needed to get started`

**No form on this screen.** It is purely the entry point.

### Anonymous Auth

When the user taps "Scan My Fridge":
1. Call `supabase.auth.signInAnonymously()` — creates a guest session
2. Navigate to the scan screen

The `_layout.tsx` auth guard must allow anonymous sessions through to the main app (anonymous users have a valid session). The guard only redirects unauthenticated (no session) users to onboarding.

### Sign-up Modal

Shown automatically after the recipe preview, overlaid as a bottom sheet or full modal. Not blocking — user can dismiss it.

Contents:
- Headline: `Your fridge is ready`
- Sub: `Create a free account to save your items and come back later.`
- Email input
- Password input with helper text: `Must be at least 6 characters`
- Fine print: `Free to use · No credit card required`
- Primary button: `Create Free Account`
- Secondary button: `Skip for now`

On "Create Free Account":
- Call `supabase.auth.updateUser({ email, password })` — this **converts** the anonymous session to a named account (no data loss)
- Dismiss modal, continue in app

On "Skip for now":
- Dismiss modal
- User stays as anonymous — their fridge data is already saved under the anon session
- A gentle re-prompt can appear on next open if they're still anonymous (out of scope for this spec)

### Anonymous Session Handling in Hooks

`useFridge`, `useShopping`, and other hooks already use the Supabase session. No changes needed — anonymous sessions work exactly like named sessions in Supabase. The `household_id` / `user_id` logic is unchanged.

---

## 3. Out of Scope

- Persisting anonymous data after account creation on a different device (Supabase handles this automatically via session continuity)
- Re-prompt logic for anonymous users on subsequent opens
- Any paywall or premium gate changes
- Settings screen logo update (can be done as a follow-up)
