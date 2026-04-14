# Leftovers v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a polished React Native (Expo) kitchen assistant app with AI fridge scanning, recipe suggestions, shopping list management, and Instacart/Walmart grocery ordering.

**Architecture:** Expo + TypeScript frontend with expo-router for navigation. Supabase handles auth, PostgreSQL database, and file storage. All Claude API calls go through Supabase Edge Functions (API key never shipped in the app). RevenueCat manages freemium subscriptions. Grocery ordering uses affiliate deep links to Instacart and Walmart.

**Tech Stack:** Expo SDK 54, React Native, TypeScript, expo-router, @supabase/supabase-js, expo-camera, expo-image-picker, react-native-purchases (RevenueCat), react-native-reanimated, react-native-gesture-handler, Jest + @testing-library/react-native

---

## File Map

### App (expo-router)
- `app/_layout.tsx` — Root layout: auth guard, redirect logic
- `app/(auth)/_layout.tsx` — Auth stack layout
- `app/(auth)/onboarding.tsx` — Onboarding: dietary prefs, household size
- `app/(auth)/login.tsx` — Email sign up / log in
- `app/(tabs)/_layout.tsx` — Bottom tab bar (Fridge, Recipes, Shopping)
- `app/(tabs)/fridge.tsx` — Fridge tab screen
- `app/(tabs)/recipes.tsx` — Recipes tab screen
- `app/(tabs)/shopping.tsx` — Shopping tab screen
- `app/settings.tsx` — Settings modal (subscription, sign out)
- `app/recipe/[id].tsx` — Recipe detail screen

### Components
- `components/ui/Button.tsx` — Themed button (primary, secondary, ghost)
- `components/ui/Card.tsx` — Themed card container
- `components/ui/Header.tsx` — Screen header with title + gear icon
- `components/ui/EmptyState.tsx` — Empty state with icon, message, CTA
- `components/ui/PremiumGate.tsx` — Paywall overlay for premium features
- `components/fridge/FridgeItem.tsx` — Row: name, quantity, expiry badge, delete
- `components/fridge/AddItemModal.tsx` — Modal form: name, qty, unit, expiry
- `components/fridge/ScanButtons.tsx` — Scan Fridge + Scan Receipt buttons
- `components/recipes/RecipeCard.tsx` — Card: emoji, name, cook time, difficulty
- `components/recipes/AISuggestionBanner.tsx` — Top banner: AI pick for expiring items
- `components/shopping/ShoppingItem.tsx` — Checkbox row with name + quantity
- `components/shopping/OrderButtons.tsx` — Instacart + Walmart order buttons

### Lib & Hooks
- `lib/supabase.ts` — Supabase client (SecureStore auth adapter)
- `lib/claude.ts` — Typed wrappers for each Edge Function
- `lib/purchases.ts` — RevenueCat setup, entitlement check, purchase
- `lib/deeplinks.ts` — Build Instacart + Walmart affiliate URLs
- `hooks/useAuth.ts` — Session state, auth listener
- `hooks/useFridge.ts` — Fridge items: fetch, add, delete, expiry helpers
- `hooks/useRecipes.ts` — AI recipe generation
- `hooks/useShopping.ts` — Shopping list: fetch, add, toggle, clear
- `hooks/useSubscription.ts` — Premium entitlement status

### Constants
- `constants/theme.ts` — Colors, spacing, border radius, typography
- `constants/config.ts` — Public env vars (Supabase URL, anon key, RevenueCat key)

### Supabase
- `supabase/migrations/001_initial_schema.sql` — Tables + RLS policies
- `supabase/functions/scan-fridge/index.ts` — Photo → fridge items
- `supabase/functions/scan-receipt/index.ts` — Receipt photo → grocery items
- `supabase/functions/generate-recipes/index.ts` — Fridge items → recipes
- `supabase/functions/build-shopping-list/index.ts` — Context → shopping list

### Tests
- `__tests__/lib/deeplinks.test.ts` — URL builder unit tests
- `__tests__/hooks/useFridge.test.ts` — Hook tests with mocked Supabase

---

## Phase 1: Project Setup & Infrastructure

### Task 1: Initialize project and GitHub repo

**Files:**
- Create: `package.json` (via Expo CLI), `babel.config.js`, `.gitignore`, `app.json`

- [ ] **Step 1: Create GitHub repo and clone**

```bash
gh repo create leftovers-v2 --public --description "AI-powered kitchen assistant" --clone
cd leftovers-v2
```

If `gh` CLI is not installed, create the repo manually at github.com, then:
```bash
git clone https://github.com/YOUR_USERNAME/leftovers-v2.git
cd leftovers-v2
```

- [ ] **Step 2: Initialize Expo project**

```bash
npx create-expo-app@latest . --template blank-typescript
```

Answer "yes" if prompted to overwrite.

- [ ] **Step 3: Install all dependencies**

```bash
npx expo install expo-router expo-camera expo-image-picker expo-secure-store expo-constants expo-linking expo-status-bar react-native-reanimated react-native-gesture-handler react-native-safe-area-context react-native-screens @react-native-async-storage/async-storage react-native-url-polyfill

npm install @supabase/supabase-js react-native-purchases

npm install --save-dev jest @testing-library/react-native @testing-library/jest-native jest-expo @types/jest
```

- [ ] **Step 4: Update `package.json`**

Set `"main": "expo-router/entry"` and add:

```json
{
  "main": "expo-router/entry",
  "scripts": {
    "start": "expo start --clear",
    "android": "expo start --android --clear",
    "ios": "expo start --ios --clear",
    "test": "jest --watchAll=false",
    "test:watch": "jest --watchAll"
  },
  "jest": {
    "preset": "jest-expo",
    "setupFilesAfterFramework": ["@testing-library/jest-native/extend-expect"],
    "transformIgnorePatterns": [
      "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|react-navigation|@react-navigation/.*|@supabase/.*|react-native-purchases)"
    ]
  }
}
```

- [ ] **Step 5: Update `babel.config.js`**

```js
module.exports = function (babel) {
  babel.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-reanimated/plugin'],
  };
};
```

- [ ] **Step 6: Update `app.json`**

Inside the `"expo"` object add:
```json
"scheme": "leftoversv2",
"web": { "bundler": "metro" }
```

- [ ] **Step 7: Add `.superpowers/` and `.env.local` to `.gitignore`**

Append to `.gitignore`:
```
.superpowers/
.env.local
```

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: initialize Expo project with all dependencies"
git push origin main
```

---

### Task 2: Theme and config constants

**Files:**
- Create: `constants/theme.ts`
- Create: `constants/config.ts`
- Create: `.env.local` (not committed)
- Create: `tsconfig.json` (update)

- [ ] **Step 1: Create `constants/theme.ts`**

```typescript
export const Colors = {
  primary: '#f97316',
  primaryDark: '#ea580c',
  background: '#fff8f0',
  surface: '#ffffff',
  surfaceAlt: '#fef3e2',
  border: '#fed7aa',
  textPrimary: '#7c2d12',
  textSecondary: '#9a3412',
  textMuted: '#6b7280',
  danger: '#ef4444',
  warning: '#f97316',
  success: '#22c55e',
  tabActive: '#f97316',
  tabInactive: '#9ca3af',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
} as const;

export const Typography = {
  heading: { fontSize: 20, fontWeight: '700' as const, color: '#7c2d12' },
  subheading: { fontSize: 16, fontWeight: '600' as const, color: '#7c2d12' },
  body: { fontSize: 14, color: '#6b7280' },
  caption: { fontSize: 12, color: '#6b7280' },
  label: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#9a3412',
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
} as const;
```

- [ ] **Step 2: Create `constants/config.ts`**

```typescript
export const Config = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  revenueCatKey: process.env.EXPO_PUBLIC_REVENUECAT_KEY ?? '',
} as const;
```

- [ ] **Step 3: Create `.env.local`**

```
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
EXPO_PUBLIC_REVENUECAT_KEY=YOUR_REVENUECAT_KEY
```

Fill in real values from Supabase and RevenueCat dashboards after Task 3.

- [ ] **Step 4: Update `tsconfig.json` to add path alias**

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add constants/ tsconfig.json
git commit -m "feat: add theme constants and config"
git push origin main
```

---

### Task 3: Supabase project and database schema

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`

- [ ] **Step 1: Create a Supabase project**

Go to https://supabase.com → New project → name it `leftovers-v2`. Copy the **Project URL** and **anon key** into `.env.local`.

- [ ] **Step 2: Install Supabase CLI and link project**

```bash
npm install --save-dev supabase
npx supabase login
npx supabase init
npx supabase link --project-ref YOUR_PROJECT_REF
```

Your project ref is in the Supabase dashboard URL: `supabase.com/dashboard/project/YOUR_PROJECT_REF`.

- [ ] **Step 3: Create `supabase/migrations/001_initial_schema.sql`**

```sql
-- Profile table extends Supabase auth.users
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  household_size int not null default 1,
  dietary_preferences text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- Fridge items
create table public.fridge_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  quantity numeric not null default 1,
  unit text not null default '',
  expiry_date date,
  created_at timestamptz not null default now()
);

-- Shopping list
create table public.shopping_list_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  quantity numeric not null default 1,
  unit text not null default '',
  checked boolean not null default false,
  created_at timestamptz not null default now()
);

-- Saved recipes
create table public.saved_recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  emoji text not null default '🍳',
  ingredients jsonb not null default '[]',
  instructions text[] not null default '{}',
  cook_time_minutes int not null default 0,
  difficulty text not null default 'Easy',
  created_at timestamptz not null default now()
);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.fridge_items enable row level security;
alter table public.shopping_list_items enable row level security;
alter table public.saved_recipes enable row level security;

create policy "Users manage own profile" on public.profiles for all using (auth.uid() = id);
create policy "Users manage own fridge" on public.fridge_items for all using (auth.uid() = user_id);
create policy "Users manage own shopping" on public.shopping_list_items for all using (auth.uid() = user_id);
create policy "Users manage own recipes" on public.saved_recipes for all using (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

- [ ] **Step 4: Apply migration**

```bash
npx supabase db push
```

Expected: no errors, migration applied.

- [ ] **Step 5: Commit**

```bash
git add supabase/
git commit -m "feat: add Supabase schema with RLS policies"
git push origin main
```

---

### Task 4: Supabase client

**Files:**
- Create: `lib/supabase.ts`

- [ ] **Step 1: Create `lib/supabase.ts`**

```typescript
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Config } from '@/constants/config';

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(Config.supabaseUrl, Config.supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add lib/supabase.ts
git commit -m "feat: add Supabase client with SecureStore auth adapter"
git push origin main
```

---

## Phase 2: Core UI Components

### Task 5: Base UI components

**Files:**
- Create: `components/ui/Button.tsx`
- Create: `components/ui/Card.tsx`
- Create: `components/ui/Header.tsx`
- Create: `components/ui/EmptyState.tsx`

- [ ] **Step 1: Create `components/ui/Button.tsx`**

```typescript
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';

type Variant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({ label, onPress, variant = 'primary', loading = false, disabled = false, style }: ButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.base, styles[variant], (disabled || loading) && styles.disabled, style]}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#fff' : Colors.primary} size="small" />
      ) : (
        <Text style={[styles.label, styles[`${variant}Label` as keyof typeof styles]]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm + 4,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: Colors.primary },
  secondary: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  ghost: { backgroundColor: 'transparent' },
  disabled: { opacity: 0.5 },
  label: { ...Typography.subheading },
  primaryLabel: { color: '#fff' },
  secondaryLabel: { color: Colors.primary },
  ghostLabel: { color: Colors.primary },
});
```

- [ ] **Step 2: Create `components/ui/Card.tsx`**

```typescript
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Radius, Spacing } from '@/constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function Card({ children, style }: CardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
});
```

- [ ] **Step 3: Create `components/ui/Header.tsx`**

```typescript
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Typography } from '@/constants/theme';

interface HeaderProps {
  title: string;
  showSettings?: boolean;
}

export function Header({ title, showSettings = true }: HeaderProps) {
  const router = useRouter();
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      {showSettings && (
        <TouchableOpacity onPress={() => router.push('/settings')} hitSlop={8}>
          <Text style={styles.gear}>⚙️</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  title: { ...Typography.heading },
  gear: { fontSize: 22 },
});
```

- [ ] **Step 4: Create `components/ui/EmptyState.tsx`**

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { Button } from './Button';

interface EmptyStateProps {
  icon: string;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction && (
        <Button label={actionLabel} onPress={onAction} style={styles.button} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  icon: { fontSize: 48, marginBottom: Spacing.md },
  title: { ...Typography.subheading, marginBottom: Spacing.sm, textAlign: 'center' },
  message: { ...Typography.body, textAlign: 'center', marginBottom: Spacing.lg, color: Colors.textMuted },
  button: { minWidth: 160 },
});
```

- [ ] **Step 5: Commit**

```bash
git add components/ui/
git commit -m "feat: add base UI components (Button, Card, Header, EmptyState)"
git push origin main
```

---

### Task 6: RevenueCat setup and PremiumGate

**Files:**
- Create: `lib/purchases.ts`
- Create: `hooks/useSubscription.ts`
- Create: `components/ui/PremiumGate.tsx`

- [ ] **Step 1: Create `lib/purchases.ts`**

```typescript
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { Config } from '@/constants/config';

export function initializePurchases() {
  Purchases.setLogLevel(LOG_LEVEL.ERROR);
  Purchases.configure({ apiKey: Config.revenueCatKey });
}

export async function checkPremiumEntitlement(): Promise<boolean> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo.entitlements.active['premium'] !== undefined;
  } catch {
    return false;
  }
}

export async function purchasePremium(): Promise<boolean> {
  try {
    const offerings = await Purchases.getOfferings();
    const pkg = offerings.current?.availablePackages[0];
    if (!pkg) return false;
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return customerInfo.entitlements.active['premium'] !== undefined;
  } catch {
    return false;
  }
}

export async function restorePurchases(): Promise<boolean> {
  try {
    const customerInfo = await Purchases.restorePurchases();
    return customerInfo.entitlements.active['premium'] !== undefined;
  } catch {
    return false;
  }
}
```

- [ ] **Step 2: Create `hooks/useSubscription.ts`**

```typescript
import { useState, useEffect } from 'react';
import { checkPremiumEntitlement } from '@/lib/purchases';

export function useSubscription() {
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkPremiumEntitlement().then((result) => {
      setIsPremium(result);
      setLoading(false);
    });
  }, []);

  return {
    isPremium,
    loading,
    refetch: () => checkPremiumEntitlement().then(setIsPremium),
  };
}
```

- [ ] **Step 3: Create `components/ui/PremiumGate.tsx`**

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { Button } from './Button';
import { purchasePremium } from '@/lib/purchases';
import { useSubscription } from '@/hooks/useSubscription';

interface PremiumGateProps {
  children: React.ReactNode;
  feature: string;
}

export function PremiumGate({ children, feature }: PremiumGateProps) {
  const { isPremium, loading, refetch } = useSubscription();

  if (loading) return null;
  if (isPremium) return <>{children}</>;

  return (
    <View style={styles.gate}>
      <Text style={styles.icon}>✨</Text>
      <Text style={styles.title}>Premium Feature</Text>
      <Text style={styles.message}>{feature} is available with Leftovers Premium.</Text>
      <Button
        label="Upgrade to Premium"
        onPress={() => purchasePremium().then(() => refetch())}
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  gate: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    margin: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  icon: { fontSize: 36, marginBottom: Spacing.sm },
  title: { ...Typography.subheading, marginBottom: Spacing.xs },
  message: { ...Typography.body, textAlign: 'center', marginBottom: Spacing.md },
  button: { minWidth: 200 },
});
```

- [ ] **Step 4: Commit**

```bash
git add lib/purchases.ts hooks/useSubscription.ts components/ui/PremiumGate.tsx
git commit -m "feat: add RevenueCat setup, useSubscription hook, and PremiumGate"
git push origin main
```

---

## Phase 3: Auth & Navigation

### Task 7: Auth hook and root layout

**Files:**
- Create: `hooks/useAuth.ts`
- Create: `app/_layout.tsx`

- [ ] **Step 1: Create `hooks/useAuth.ts`**

```typescript
import { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return { session, loading };
}
```

- [ ] **Step 2: Create `app/_layout.tsx`**

```typescript
import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuth } from '@/hooks/useAuth';
import { initializePurchases } from '@/lib/purchases';
import { Colors } from '@/constants/theme';

export default function RootLayout() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    initializePurchases();
  }, []);

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!session && !inAuthGroup) {
      router.replace('/(auth)/onboarding');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)/fridge');
    }
  }, [session, loading, segments]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.background } }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
        <Stack.Screen name="recipe/[id]" options={{ presentation: 'card' }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add hooks/useAuth.ts app/_layout.tsx
git commit -m "feat: add auth hook and root layout with auth guard"
git push origin main
```

---

### Task 8: Onboarding and login screens

**Files:**
- Create: `app/(auth)/_layout.tsx`
- Create: `app/(auth)/onboarding.tsx`
- Create: `app/(auth)/login.tsx`

- [ ] **Step 1: Create `app/(auth)/_layout.tsx`**

```typescript
import { Stack } from 'expo-router';
import { Colors } from '@/constants/theme';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
      }}
    />
  );
}
```

- [ ] **Step 2: Create `app/(auth)/onboarding.tsx`**

```typescript
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Typography, Radius } from '@/constants/theme';
import { Button } from '@/components/ui/Button';

const DIETARY_OPTIONS = ['Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Nut-Free'];
const HOUSEHOLD_SIZES = [1, 2, 3, 4, 5, 6];

export default function OnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState<'welcome' | 'preferences' | 'household'>('welcome');
  const [dietary, setDietary] = useState<string[]>([]);
  const [householdSize, setHouseholdSize] = useState(2);

  function toggleDietary(option: string) {
    setDietary((prev) =>
      prev.includes(option) ? prev.filter((d) => d !== option) : [...prev, option]
    );
  }

  // Preferences are saved after sign-up when the user has an account.
  // For now, store locally and pass to login screen via router params.
  function finish() {
    router.push({
      pathname: '/(auth)/login',
      params: { dietary: JSON.stringify(dietary), householdSize: String(householdSize) },
    });
  }

  if (step === 'welcome') {
    return (
      <View style={styles.container}>
        <Text style={styles.emoji}>🧊</Text>
        <Text style={styles.title}>Welcome to Leftovers</Text>
        <Text style={styles.subtitle}>
          Your AI-powered kitchen assistant. Know what's in your fridge, get great recipes, and order
          groceries — effortlessly.
        </Text>
        <Button label="Get Started" onPress={() => setStep('preferences')} style={styles.button} />
      </View>
    );
  }

  if (step === 'preferences') {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Any dietary needs?</Text>
        <Text style={styles.subtitle}>We'll tailor recipes and shopping to match.</Text>
        {DIETARY_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt}
            onPress={() => toggleDietary(opt)}
            style={[styles.chip, dietary.includes(opt) && styles.chipSelected]}
          >
            <Text style={[styles.chipText, dietary.includes(opt) && styles.chipTextSelected]}>{opt}</Text>
          </TouchableOpacity>
        ))}
        <Button label="Next" onPress={() => setStep('household')} style={styles.button} />
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Household size?</Text>
      <Text style={styles.subtitle}>Helps us suggest the right portions.</Text>
      <View style={styles.row}>
        {HOUSEHOLD_SIZES.map((n) => (
          <TouchableOpacity
            key={n}
            onPress={() => setHouseholdSize(n)}
            style={[styles.sizeChip, householdSize === n && styles.chipSelected]}
          >
            <Text style={[styles.chipText, householdSize === n && styles.chipTextSelected]}>{n}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Button label="Continue" onPress={finish} style={styles.button} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: Spacing.xl, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 64, marginBottom: Spacing.md },
  title: { ...Typography.heading, fontSize: 26, textAlign: 'center', marginBottom: Spacing.sm },
  subtitle: { ...Typography.body, textAlign: 'center', marginBottom: Spacing.xl, lineHeight: 22 },
  button: { width: '100%', marginTop: Spacing.lg },
  chip: {
    width: '100%',
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  chipSelected: { borderColor: Colors.primary, backgroundColor: Colors.surfaceAlt },
  chipText: { ...Typography.body, textAlign: 'center' },
  chipTextSelected: { color: Colors.primary, fontWeight: '600' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, justifyContent: 'center', marginBottom: Spacing.lg },
  sizeChip: {
    width: 52,
    height: 52,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
});
```

- [ ] **Step 3: Create `app/(auth)/login.tsx`**

```typescript
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';

export default function LoginScreen() {
  const params = useLocalSearchParams<{ dietary?: string; householdSize?: string }>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  async function handleSubmit() {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter your email and password.');
      return;
    }
    setLoading(true);

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) Alert.alert('Error', error.message);
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        Alert.alert('Error', error.message);
      } else if (data.user && params.dietary) {
        // Save onboarding preferences to profile
        await supabase.from('profiles').update({
          dietary_preferences: JSON.parse(params.dietary),
          household_size: parseInt(params.householdSize ?? '2', 10),
        }).eq('id', data.user.id);
      }
    }

    setLoading(false);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.emoji}>🧊</Text>
      <Text style={styles.title}>{mode === 'login' ? 'Welcome back' : 'Create account'}</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholderTextColor={Colors.textMuted}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholderTextColor={Colors.textMuted}
      />
      <Button
        label={mode === 'login' ? 'Log In' : 'Sign Up'}
        onPress={handleSubmit}
        loading={loading}
        style={styles.button}
      />
      <Button
        label={mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
        onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}
        variant="ghost"
        style={{ marginTop: Spacing.sm }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: Spacing.xl, justifyContent: 'center' },
  emoji: { fontSize: 48, textAlign: 'center', marginBottom: Spacing.md },
  title: { ...Typography.heading, fontSize: 24, textAlign: 'center', marginBottom: Spacing.xl },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Typography.body,
    color: Colors.textPrimary,
  },
  button: { marginTop: Spacing.md },
});
```

- [ ] **Step 4: Commit**

```bash
git add app/(auth)/
git commit -m "feat: add onboarding and login screens"
git push origin main
```

---

### Task 9: Tab layout and settings screen

**Files:**
- Create: `app/(tabs)/_layout.tsx`
- Create: `app/(tabs)/fridge.tsx` (placeholder)
- Create: `app/(tabs)/recipes.tsx` (placeholder)
- Create: `app/(tabs)/shopping.tsx` (placeholder)
- Create: `app/settings.tsx`

- [ ] **Step 1: Create `app/(tabs)/_layout.tsx`**

```typescript
import React from 'react';
import { Text } from 'react-native';
import { Tabs } from 'expo-router';
import { Colors } from '@/constants/theme';

function TabIcon({ emoji, active }: { emoji: string; active: boolean }) {
  return <Text style={{ fontSize: 22, opacity: active ? 1 : 0.45 }}>{emoji}</Text>;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.tabActive,
        tabBarInactiveTintColor: Colors.tabInactive,
        tabBarStyle: {
          backgroundColor: Colors.background,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="fridge"
        options={{
          title: 'Fridge',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🧊" active={focused} />,
        }}
      />
      <Tabs.Screen
        name="recipes"
        options={{
          title: 'Recipes',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🍳" active={focused} />,
        }}
      />
      <Tabs.Screen
        name="shopping"
        options={{
          title: 'Shopping',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🛒" active={focused} />,
        }}
      />
    </Tabs>
  );
}
```

- [ ] **Step 2: Create placeholder tab screens**

Create `app/(tabs)/fridge.tsx`:
```typescript
import { View } from 'react-native';
import { Colors } from '@/constants/theme';
export default function FridgeScreen() {
  return <View style={{ flex: 1, backgroundColor: Colors.background }} />;
}
```

Create `app/(tabs)/recipes.tsx`:
```typescript
import { View } from 'react-native';
import { Colors } from '@/constants/theme';
export default function RecipesScreen() {
  return <View style={{ flex: 1, backgroundColor: Colors.background }} />;
}
```

Create `app/(tabs)/shopping.tsx`:
```typescript
import { View } from 'react-native';
import { Colors } from '@/constants/theme';
export default function ShoppingScreen() {
  return <View style={{ flex: 1, backgroundColor: Colors.background }} />;
}
```

- [ ] **Step 3: Create `app/settings.tsx`**

```typescript
import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/ui/Header';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { purchasePremium, restorePurchases } from '@/lib/purchases';
import { useSubscription } from '@/hooks/useSubscription';

export default function SettingsScreen() {
  const router = useRouter();
  const { isPremium, refetch } = useSubscription();

  async function signOut() {
    await supabase.auth.signOut();
    router.replace('/(auth)/login');
  }

  async function handleUpgrade() {
    const success = await purchasePremium();
    if (success) {
      refetch();
      Alert.alert('Welcome to Premium!', 'All features are now unlocked.');
    } else {
      Alert.alert('Purchase cancelled', 'You can upgrade any time from Settings.');
    }
  }

  async function handleRestore() {
    const restored = await restorePurchases();
    if (restored) {
      refetch();
      Alert.alert('Restored', 'Your premium subscription has been restored.');
    } else {
      Alert.alert('Not found', 'No previous purchase found for this account.');
    }
  }

  return (
    <View style={styles.container}>
      <Header title="Settings" showSettings={false} />
      <View style={styles.content}>
        <Text style={styles.sectionLabel}>SUBSCRIPTION</Text>
        <Text style={styles.status}>{isPremium ? '✨ Premium - Active' : 'Free Plan'}</Text>
        {!isPremium && (
          <Button label="Upgrade to Premium" onPress={handleUpgrade} style={styles.item} />
        )}
        <Button label="Restore Purchases" onPress={handleRestore} variant="secondary" style={styles.item} />
        <Text style={[styles.sectionLabel, { marginTop: Spacing.lg }]}>ACCOUNT</Text>
        <Button label="Sign Out" onPress={signOut} variant="secondary" style={styles.item} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md },
  sectionLabel: { ...Typography.label, marginBottom: Spacing.sm },
  status: { ...Typography.body, marginBottom: Spacing.md, color: Colors.textPrimary, fontWeight: '600' },
  item: { marginBottom: Spacing.sm },
});
```

- [ ] **Step 4: Verify the app runs**

```bash
npm start
```

Expected: 3 tabs load, settings modal opens from gear icon, no red screen errors.

- [ ] **Step 5: Commit**

```bash
git add app/(tabs)/ app/settings.tsx
git commit -m "feat: add tab navigation layout and settings screen"
git push origin main
```

---

## Phase 4: Fridge Tab

### Task 10: useFridge hook

**Files:**
- Create: `hooks/useFridge.ts`
- Test: `__tests__/hooks/useFridge.test.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/hooks/useFridge.test.ts`:
```typescript
import { renderHook } from '@testing-library/react-native';
import { useFridge } from '@/hooks/useFridge';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: [], error: null }),
      insert: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: '1', name: 'Eggs', quantity: 6, unit: '', expiry_date: '2026-04-20', created_at: '' },
        error: null,
      }),
      delete: jest.fn().mockReturnThis(),
    })),
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }),
    },
  },
}));

test('starts with loading true', () => {
  const { result } = renderHook(() => useFridge());
  expect(result.current.loading).toBe(true);
});

test('getExpiringSoon returns items expiring within threshold', () => {
  const { result } = renderHook(() => useFridge());
  // With empty items, expiring soon should be empty
  expect(result.current.getExpiringSoon(5)).toEqual([]);
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- --testPathPattern=useFridge
```

Expected: FAIL with "Cannot find module '@/hooks/useFridge'".

- [ ] **Step 3: Create `hooks/useFridge.ts`**

```typescript
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface FridgeItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  expiry_date: string | null;
  created_at: string;
}

export interface NewFridgeItem {
  name: string;
  quantity: number;
  unit: string;
  expiry_date: string | null;
}

export function useFridge() {
  const [items, setItems] = useState<FridgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data, error } = await supabase
      .from('fridge_items')
      .select('*')
      .eq('user_id', user.id)
      .order('expiry_date', { ascending: true, nullsFirst: false });
    if (error) setError(error.message);
    else setItems(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  async function addItem(item: NewFridgeItem): Promise<FridgeItem | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data, error } = await supabase
      .from('fridge_items')
      .insert({ ...item, user_id: user.id })
      .select()
      .single();
    if (error) { setError(error.message); return null; }
    setItems((prev) => [...prev, data]);
    return data;
  }

  async function deleteItem(id: string) {
    const { error } = await supabase.from('fridge_items').delete().eq('id', id);
    if (!error) setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function getExpiringSoon(withinDays = 5): FridgeItem[] {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + withinDays);
    return items.filter((i) => {
      if (!i.expiry_date) return false;
      return new Date(i.expiry_date) <= cutoff;
    });
  }

  return { items, loading, error, addItem, deleteItem, refetch: fetchItems, getExpiringSoon };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- --testPathPattern=useFridge
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add hooks/useFridge.ts __tests__/hooks/useFridge.test.ts
git commit -m "feat: add useFridge hook with add/delete/expiry logic"
git push origin main
```

---

### Task 11: Fridge item components

**Files:**
- Create: `components/fridge/FridgeItem.tsx`
- Create: `components/fridge/AddItemModal.tsx`

- [ ] **Step 1: Create `components/fridge/FridgeItem.tsx`**

```typescript
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import type { FridgeItem as FridgeItemType } from '@/hooks/useFridge';

interface Props {
  item: FridgeItemType;
  onDelete: (id: string) => void;
}

function daysUntil(dateStr: string): number {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function expiryColor(days: number): string {
  if (days <= 2) return Colors.danger;
  if (days <= 5) return Colors.warning;
  return Colors.textMuted;
}

export function FridgeItem({ item, onDelete }: Props) {
  const days = item.expiry_date ? daysUntil(item.expiry_date) : null;

  return (
    <View style={styles.row}>
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        {item.unit ? (
          <Text style={styles.quantity}>{item.quantity} {item.unit}</Text>
        ) : null}
      </View>
      {days !== null && (
        <Text style={[styles.expiry, { color: expiryColor(days) }]}>
          {days <= 0 ? 'Expired' : `${days}d`}
        </Text>
      )}
      <TouchableOpacity onPress={() => onDelete(item.id)} hitSlop={8} style={styles.delete}>
        <Text style={styles.deleteText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.xs,
  },
  info: { flex: 1 },
  name: { ...Typography.body, color: Colors.textPrimary, fontWeight: '600' },
  quantity: { ...Typography.caption, marginTop: 2 },
  expiry: { ...Typography.caption, fontWeight: '700', marginRight: Spacing.sm },
  delete: { padding: 4 },
  deleteText: { color: Colors.textMuted, fontSize: 14 },
});
```

- [ ] **Step 2: Create `components/fridge/AddItemModal.tsx`**

```typescript
import React, { useState } from 'react';
import { Modal, View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import type { NewFridgeItem } from '@/hooks/useFridge';

interface Props {
  visible: boolean;
  onClose: () => void;
  onAdd: (item: NewFridgeItem) => Promise<unknown>;
}

export function AddItemModal({ visible, onClose, onAdd }: Props) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleAdd() {
    if (!name.trim()) return;
    setLoading(true);
    await onAdd({
      name: name.trim(),
      quantity: parseFloat(quantity) || 1,
      unit: unit.trim(),
      expiry_date: expiryDate || null,
    });
    setLoading(false);
    setName(''); setQuantity('1'); setUnit(''); setExpiryDate('');
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Add Item</Text>
          <TouchableOpacity onPress={onClose}><Text style={styles.close}>✕</Text></TouchableOpacity>
        </View>
        <TextInput
          style={styles.input}
          placeholder="Item name (e.g. Eggs)"
          value={name}
          onChangeText={setName}
          placeholderTextColor={Colors.textMuted}
          autoFocus
        />
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.half]}
            placeholder="Qty"
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
            placeholderTextColor={Colors.textMuted}
          />
          <TextInput
            style={[styles.input, styles.half]}
            placeholder="Unit (e.g. kg)"
            value={unit}
            onChangeText={setUnit}
            placeholderTextColor={Colors.textMuted}
          />
        </View>
        <TextInput
          style={styles.input}
          placeholder="Expiry date (YYYY-MM-DD)"
          value={expiryDate}
          onChangeText={setExpiryDate}
          placeholderTextColor={Colors.textMuted}
        />
        <Button label="Add to Fridge" onPress={handleAdd} loading={loading} style={{ marginTop: Spacing.md }} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: Spacing.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  title: { ...Typography.heading },
  close: { fontSize: 20, color: Colors.textMuted },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Typography.body,
    color: Colors.textPrimary,
  },
  row: { flexDirection: 'row', gap: Spacing.sm },
  half: { flex: 1 },
});
```

- [ ] **Step 3: Commit**

```bash
git add components/fridge/
git commit -m "feat: add FridgeItem and AddItemModal components"
git push origin main
```

---

### Task 12: AI scan Edge Functions

**Files:**
- Create: `supabase/functions/scan-fridge/index.ts`
- Create: `supabase/functions/scan-receipt/index.ts`
- Create: `lib/claude.ts`

- [ ] **Step 1: Create `supabase/functions/scan-fridge/index.ts`**

```typescript
import Anthropic from 'npm:@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! });

Deno.serve(async (req) => {
  const { imageBase64 } = await req.json();

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 },
        },
        {
          type: 'text',
          text: 'List all food items visible in this fridge photo. For each item provide a JSON array with objects containing: name (string), quantity (number), unit (string, e.g. "kg", "L", "pack", or "" if unknown). Return only the JSON array.',
        },
      ],
    }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '[]';
  let items = [];
  try {
    items = JSON.parse(text.replace(/```json?|```/g, '').trim());
  } catch {
    items = [];
  }

  return new Response(JSON.stringify({ items }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

- [ ] **Step 2: Create `supabase/functions/scan-receipt/index.ts`**

```typescript
import Anthropic from 'npm:@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! });

Deno.serve(async (req) => {
  const { imageBase64 } = await req.json();

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 },
        },
        {
          type: 'text',
          text: 'This is a grocery receipt. Extract all food items purchased. Return a JSON array with objects containing: name (string), quantity (number), unit (string or ""). Return only the JSON array.',
        },
      ],
    }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '[]';
  let items = [];
  try {
    items = JSON.parse(text.replace(/```json?|```/g, '').trim());
  } catch {
    items = [];
  }

  return new Response(JSON.stringify({ items }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

- [ ] **Step 3: Set Anthropic API key in Supabase**

```bash
npx supabase secrets set ANTHROPIC_API_KEY=YOUR_ANTHROPIC_API_KEY
```

Get your key from https://console.anthropic.com

- [ ] **Step 4: Deploy both Edge Functions**

```bash
npx supabase functions deploy scan-fridge
npx supabase functions deploy scan-receipt
```

Expected: both deploy with no errors.

- [ ] **Step 5: Create `lib/claude.ts`**

```typescript
import { supabase } from '@/lib/supabase';
import type { NewFridgeItem } from '@/hooks/useFridge';

async function invokeFunction<T>(name: string, body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) throw new Error(error.message);
  return data as T;
}

export interface Recipe {
  title: string;
  emoji: string;
  ingredients: { name: string; have: boolean }[];
  instructions: string[];
  cook_time_minutes: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface ShoppingListItem {
  name: string;
  quantity: number;
  unit: string;
}

export async function scanFridge(imageBase64: string): Promise<NewFridgeItem[]> {
  const { items } = await invokeFunction<{ items: NewFridgeItem[] }>('scan-fridge', { imageBase64 });
  return items;
}

export async function scanReceipt(imageBase64: string): Promise<NewFridgeItem[]> {
  const { items } = await invokeFunction<{ items: NewFridgeItem[] }>('scan-receipt', { imageBase64 });
  return items;
}

export async function generateRecipes(fridgeItems: string[], preferences: string[]): Promise<Recipe[]> {
  const { recipes } = await invokeFunction<{ recipes: Recipe[] }>('generate-recipes', { fridgeItems, preferences });
  return recipes;
}

export async function buildShoppingList(
  fridgeItems: string[],
  householdSize: number,
  preferences: string[]
): Promise<ShoppingListItem[]> {
  const { items } = await invokeFunction<{ items: ShoppingListItem[] }>('build-shopping-list', {
    fridgeItems,
    householdSize,
    preferences,
  });
  return items;
}
```

- [ ] **Step 6: Commit**

```bash
git add supabase/functions/scan-fridge/ supabase/functions/scan-receipt/ lib/claude.ts
git commit -m "feat: add AI scan Edge Functions and claude.ts client"
git push origin main
```

---

### Task 13: ScanButtons component and complete fridge screen

**Files:**
- Create: `components/fridge/ScanButtons.tsx`
- Modify: `app/(tabs)/fridge.tsx`

- [ ] **Step 1: Create `components/fridge/ScanButtons.tsx`**

```typescript
import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '@/components/ui/Button';
import { PremiumGate } from '@/components/ui/PremiumGate';
import { scanFridge, scanReceipt } from '@/lib/claude';
import { Spacing } from '@/constants/theme';
import type { NewFridgeItem } from '@/hooks/useFridge';

interface Props {
  onItemsScanned: (items: NewFridgeItem[]) => Promise<void>;
}

async function pickAndEncodeImage(): Promise<string | null> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission needed', 'Camera access is required to scan.');
    return null;
  }
  const result = await ImagePicker.launchCameraAsync({ base64: true, quality: 0.7 });
  if (result.canceled || !result.assets[0]?.base64) return null;
  return result.assets[0].base64;
}

export function ScanButtons({ onItemsScanned }: Props) {
  const [loadingFridge, setLoadingFridge] = useState(false);
  const [loadingReceipt, setLoadingReceipt] = useState(false);

  async function handleScanFridge() {
    const base64 = await pickAndEncodeImage();
    if (!base64) return;
    setLoadingFridge(true);
    try {
      const items = await scanFridge(base64);
      await onItemsScanned(items);
    } catch {
      Alert.alert('Scan failed', 'Could not read the fridge photo. Please try again.');
    } finally {
      setLoadingFridge(false);
    }
  }

  async function handleScanReceipt() {
    const base64 = await pickAndEncodeImage();
    if (!base64) return;
    setLoadingReceipt(true);
    try {
      const items = await scanReceipt(base64);
      await onItemsScanned(items);
    } catch {
      Alert.alert('Scan failed', 'Could not read the receipt. Please try again.');
    } finally {
      setLoadingReceipt(false);
    }
  }

  return (
    <PremiumGate feature="AI fridge and receipt scanning">
      <View style={styles.container}>
        <Button
          label={loadingFridge ? 'Scanning...' : '📷 Scan Fridge with AI'}
          onPress={handleScanFridge}
          loading={loadingFridge}
        />
        <Button
          label={loadingReceipt ? 'Scanning...' : '🧾 Scan Receipt'}
          onPress={handleScanReceipt}
          loading={loadingReceipt}
          variant="secondary"
        />
      </View>
    </PremiumGate>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: Spacing.md, gap: Spacing.sm, marginBottom: Spacing.md },
});
```

- [ ] **Step 2: Replace `app/(tabs)/fridge.tsx` with full implementation**

```typescript
import React, { useState } from 'react';
import { View, Text, SectionList, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { Header } from '@/components/ui/Header';
import { EmptyState } from '@/components/ui/EmptyState';
import { FridgeItem } from '@/components/fridge/FridgeItem';
import { AddItemModal } from '@/components/fridge/AddItemModal';
import { ScanButtons } from '@/components/fridge/ScanButtons';
import { useFridge } from '@/hooks/useFridge';
import { Colors, Spacing, Typography } from '@/constants/theme';
import type { NewFridgeItem } from '@/hooks/useFridge';

export default function FridgeScreen() {
  const { items, loading, addItem, deleteItem, getExpiringSoon } = useFridge();
  const [showAddModal, setShowAddModal] = useState(false);

  const expiringSoon = getExpiringSoon(5);
  const allOther = items.filter((i) => !expiringSoon.find((e) => e.id === i.id));

  const sections = [
    ...(expiringSoon.length > 0 ? [{ title: 'EXPIRES SOON', data: expiringSoon }] : []),
    ...(allOther.length > 0 ? [{ title: 'ALL ITEMS', data: allOther }] : []),
  ];

  async function handleItemsScanned(newItems: NewFridgeItem[]) {
    for (const item of newItems) {
      await addItem(item);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="My Fridge" />
      <ScanButtons onItemsScanned={handleItemsScanned} />
      {items.length === 0 && !loading ? (
        <EmptyState
          icon="🧊"
          title="Your fridge is empty"
          message="Scan your fridge or add items manually to get started."
          actionLabel="Add Item"
          onAction={() => setShowAddModal(true)}
        />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionLabel}>{section.title}</Text>
          )}
          renderItem={({ item }) => (
            <FridgeItem item={item} onDelete={deleteItem} />
          )}
          contentContainerStyle={styles.list}
        />
      )}
      <TouchableOpacity style={styles.fab} onPress={() => setShowAddModal(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
      <AddItemModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={addItem}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  list: { paddingHorizontal: Spacing.md, paddingBottom: 100 },
  sectionLabel: { ...Typography.label, marginTop: Spacing.md, marginBottom: Spacing.sm },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '300', lineHeight: 32 },
});
```

- [ ] **Step 3: Commit**

```bash
git add components/fridge/ScanButtons.tsx app/(tabs)/fridge.tsx
git commit -m "feat: complete fridge tab with scan buttons, item list, and FAB"
git push origin main
```

---

## Phase 5: Recipes Tab

### Task 14: Recipe generation Edge Function and useRecipes hook

**Files:**
- Create: `supabase/functions/generate-recipes/index.ts`
- Create: `hooks/useRecipes.ts`

- [ ] **Step 1: Create `supabase/functions/generate-recipes/index.ts`**

```typescript
import Anthropic from 'npm:@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! });

Deno.serve(async (req) => {
  const { fridgeItems, preferences } = await req.json();
  const prefStr = preferences?.length > 0 ? `Dietary preferences: ${preferences.join(', ')}.` : '';

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: `I have these items in my fridge: ${fridgeItems.join(', ')}. ${prefStr}
Suggest 5 recipes I can make, prioritizing items that should be used soon.
Return a JSON array of recipe objects with these fields:
- title: string
- emoji: string (one emoji representing the dish)
- ingredients: array of { name: string, have: boolean } (have=true if in my fridge list)
- instructions: string[] (step by step, each step a complete sentence)
- cook_time_minutes: number
- difficulty: "Easy" | "Medium" | "Hard"
Return only the JSON array, nothing else.`,
    }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '[]';
  let recipes = [];
  try {
    recipes = JSON.parse(text.replace(/```json?|```/g, '').trim());
  } catch {
    recipes = [];
  }

  return new Response(JSON.stringify({ recipes }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

- [ ] **Step 2: Deploy Edge Function**

```bash
npx supabase functions deploy generate-recipes
```

- [ ] **Step 3: Create `hooks/useRecipes.ts`**

```typescript
import { useState, useCallback } from 'react';
import { generateRecipes, type Recipe } from '@/lib/claude';
import { supabase } from '@/lib/supabase';
import type { FridgeItem } from '@/hooks/useFridge';

const FREE_DAILY_LIMIT = 5;

export function useRecipes(fridgeItems: FridgeItem[], isPremium: boolean) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecipes = useCallback(async () => {
    if (fridgeItems.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('dietary_preferences')
        .eq('id', user?.id ?? '')
        .single();
      const preferences: string[] = profile?.dietary_preferences ?? [];
      const itemNames = fridgeItems.map((i) => `${i.name}${i.unit ? ` (${i.quantity} ${i.unit})` : ''}`);
      const result = await generateRecipes(itemNames, preferences);
      setRecipes(isPremium ? result : result.slice(0, FREE_DAILY_LIMIT));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load recipes. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [fridgeItems, isPremium]);

  return { recipes, loading, error, fetchRecipes };
}
```

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/generate-recipes/ hooks/useRecipes.ts
git commit -m "feat: add recipe generation Edge Function and useRecipes hook"
git push origin main
```

---

### Task 15: Recipe components and complete Recipes screen

**Files:**
- Create: `components/recipes/RecipeCard.tsx`
- Create: `components/recipes/AISuggestionBanner.tsx`
- Create: `app/recipe/[id].tsx`
- Modify: `app/(tabs)/recipes.tsx`

- [ ] **Step 1: Create `components/recipes/RecipeCard.tsx`**

```typescript
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import type { Recipe } from '@/lib/claude';

interface Props {
  recipe: Recipe;
  onPress: () => void;
}

export function RecipeCard({ recipe, onPress }: Props) {
  const itemsYouHave = recipe.ingredients.filter((i) => i.have).length;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.emojiBox}>
        <Text style={styles.emoji}>{recipe.emoji}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.title}>{recipe.title}</Text>
        <Text style={styles.meta}>
          Uses {itemsYouHave}/{recipe.ingredients.length} items you have
        </Text>
        <View style={styles.tags}>
          <Text style={styles.tag}>⏱ {recipe.cook_time_minutes} min</Text>
          <Text style={styles.tag}>{recipe.difficulty}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  emojiBox: {
    width: 80,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 32 },
  info: { flex: 1, padding: Spacing.md },
  title: { ...Typography.subheading, marginBottom: 2 },
  meta: { ...Typography.caption, marginBottom: Spacing.xs },
  tags: { flexDirection: 'row', gap: Spacing.sm },
  tag: { fontSize: 11, color: Colors.primary, fontWeight: '600' },
});
```

- [ ] **Step 2: Create `components/recipes/AISuggestionBanner.tsx`**

```typescript
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Radius, Spacing } from '@/constants/theme';
import type { Recipe } from '@/lib/claude';

interface Props {
  recipe: Recipe;
  onPress: () => void;
}

export function AISuggestionBanner({ recipe, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.banner} onPress={onPress} activeOpacity={0.8}>
      <Text style={styles.label}>🤖 AI SUGGESTION</Text>
      <Text style={styles.title}>{recipe.title}</Text>
      <Text style={styles.sub}>Perfect for your expiring ingredients</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  banner: {
    margin: Spacing.md,
    marginBottom: 0,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    backgroundColor: Colors.primary,
  },
  label: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.8)', letterSpacing: 1, marginBottom: 4 },
  title: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 2 },
  sub: { fontSize: 12, color: 'rgba(255,255,255,0.85)' },
});
```

- [ ] **Step 3: Create `app/recipe/[id].tsx`**

```typescript
import React from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Colors, Spacing, Typography, Radius } from '@/constants/theme';
import { Header } from '@/components/ui/Header';
import type { Recipe } from '@/lib/claude';

export default function RecipeDetailScreen() {
  const { recipe: recipeJson } = useLocalSearchParams<{ recipe: string }>();
  const recipe: Recipe | null = recipeJson ? JSON.parse(recipeJson) : null;

  if (!recipe) return null;

  return (
    <SafeAreaView style={styles.container}>
      <Header title={recipe.title} showSettings={false} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.emoji}>{recipe.emoji}</Text>
        <View style={styles.tags}>
          <Text style={styles.tag}>⏱ {recipe.cook_time_minutes} min</Text>
          <Text style={styles.tag}>{recipe.difficulty}</Text>
        </View>

        <Text style={styles.sectionTitle}>Ingredients</Text>
        {recipe.ingredients.map((ing, i) => (
          <View key={i} style={styles.ingredient}>
            <Text style={[styles.ingredientDot, { color: ing.have ? Colors.success : Colors.textMuted }]}>
              {ing.have ? '✓' : '○'}
            </Text>
            <Text style={[styles.ingredientName, !ing.have && styles.missing]}>{ing.name}</Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Instructions</Text>
        {recipe.instructions.map((step, i) => (
          <View key={i} style={styles.step}>
            <View style={styles.stepNumBox}>
              <Text style={styles.stepNum}>{i + 1}</Text>
            </View>
            <Text style={styles.stepText}>{step}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, paddingBottom: 40 },
  emoji: { fontSize: 56, textAlign: 'center', marginVertical: Spacing.md },
  tags: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.md, marginBottom: Spacing.lg },
  tag: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  sectionTitle: { ...Typography.subheading, marginBottom: Spacing.sm, marginTop: Spacing.md },
  ingredient: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.xs, gap: Spacing.sm },
  ingredientDot: { fontSize: 16, width: 20 },
  ingredientName: { ...Typography.body, color: Colors.textPrimary },
  missing: { color: Colors.textMuted },
  step: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  stepNumBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepNum: { color: '#fff', fontWeight: '700', fontSize: 12 },
  stepText: { ...Typography.body, flex: 1, lineHeight: 22 },
});
```

- [ ] **Step 4: Replace `app/(tabs)/recipes.tsx` with full implementation**

```typescript
import React, { useEffect } from 'react';
import { View, FlatList, StyleSheet, SafeAreaView, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Header } from '@/components/ui/Header';
import { EmptyState } from '@/components/ui/EmptyState';
import { RecipeCard } from '@/components/recipes/RecipeCard';
import { AISuggestionBanner } from '@/components/recipes/AISuggestionBanner';
import { useFridge } from '@/hooks/useFridge';
import { useRecipes } from '@/hooks/useRecipes';
import { useSubscription } from '@/hooks/useSubscription';
import { Colors, Spacing, Typography } from '@/constants/theme';
import type { Recipe } from '@/lib/claude';

export default function RecipesScreen() {
  const router = useRouter();
  const { items: fridgeItems, getExpiringSoon } = useFridge();
  const { isPremium } = useSubscription();
  const { recipes, loading, error, fetchRecipes } = useRecipes(fridgeItems, isPremium);

  useEffect(() => { fetchRecipes(); }, [fetchRecipes]);

  const expiringSoon = getExpiringSoon(5);
  const suggestion = expiringSoon.length > 0 && recipes.length > 0 ? recipes[0] : null;

  function openRecipe(recipe: Recipe, index: number) {
    router.push({
      pathname: '/recipe/[id]',
      params: { id: String(index), recipe: JSON.stringify(recipe) },
    });
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Recipes" />
        <View style={styles.center}>
          <Text style={Typography.body}>Finding recipes for your fridge...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Recipes" />
      {error ? (
        <EmptyState
          icon="⚠️"
          title="Something went wrong"
          message={error}
          actionLabel="Try Again"
          onAction={fetchRecipes}
        />
      ) : recipes.length === 0 ? (
        <EmptyState
          icon="🍳"
          title="No recipes yet"
          message="Add items to your fridge and we'll suggest recipes for you."
          actionLabel="Go to Fridge"
          onAction={() => router.push('/(tabs)/fridge')}
        />
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={(_, i) => String(i)}
          ListHeaderComponent={
            suggestion ? (
              <AISuggestionBanner recipe={suggestion} onPress={() => openRecipe(suggestion, 0)} />
            ) : null
          }
          renderItem={({ item, index }) => (
            <RecipeCard recipe={item} onPress={() => openRecipe(item, index)} />
          )}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  list: { padding: Spacing.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
```

- [ ] **Step 5: Commit**

```bash
git add components/recipes/ app/recipe/ app/(tabs)/recipes.tsx
git commit -m "feat: complete recipes tab with AI suggestions and recipe detail screen"
git push origin main
```

---

## Phase 6: Shopping Tab

### Task 16: deeplinks utility, useShopping hook

**Files:**
- Create: `lib/deeplinks.ts`
- Test: `__tests__/lib/deeplinks.test.ts`
- Create: `hooks/useShopping.ts`

- [ ] **Step 1: Write failing test for deeplinks**

Create `__tests__/lib/deeplinks.test.ts`:
```typescript
import { buildInstacartUrl, buildWalmartUrl } from '@/lib/deeplinks';

test('buildInstacartUrl includes item name in URL', () => {
  const url = buildInstacartUrl(['Eggs', 'Milk', 'Bread']);
  expect(url).toContain('instacart.com');
  expect(url).toContain('Eggs');
});

test('buildWalmartUrl includes item names in URL', () => {
  const url = buildWalmartUrl(['Eggs', 'Milk']);
  expect(url).toContain('walmart.com');
  expect(url).toContain('Eggs');
});

test('buildInstacartUrl handles empty list gracefully', () => {
  const url = buildInstacartUrl([]);
  expect(url).toContain('instacart.com');
});

test('buildWalmartUrl handles empty list gracefully', () => {
  const url = buildWalmartUrl([]);
  expect(url).toContain('walmart.com');
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- --testPathPattern=deeplinks
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create `lib/deeplinks.ts`**

```typescript
export function buildInstacartUrl(itemNames: string[]): string {
  if (itemNames.length === 0) return 'https://www.instacart.com';
  const query = encodeURIComponent(itemNames[0]);
  const all = encodeURIComponent(itemNames.join(', '));
  return `https://www.instacart.com/store/s?k=${query}#list=${all}`;
}

export function buildWalmartUrl(itemNames: string[]): string {
  if (itemNames.length === 0) return 'https://www.walmart.com/grocery';
  const query = encodeURIComponent(itemNames.join(' '));
  return `https://www.walmart.com/search?q=${query}&typeahead=${encodeURIComponent(itemNames[0])}`;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- --testPathPattern=deeplinks
```

Expected: PASS

- [ ] **Step 5: Create `hooks/useShopping.ts`**

```typescript
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  checked: boolean;
  created_at: string;
}

export function useShopping() {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from('shopping_list_items')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });
    setItems(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  async function addItem(name: string, quantity = 1, unit = '') {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('shopping_list_items')
      .insert({ name, quantity, unit, user_id: user.id })
      .select()
      .single();
    if (data) setItems((prev) => [...prev, data]);
  }

  async function toggleItem(id: string) {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    await supabase.from('shopping_list_items').update({ checked: !item.checked }).eq('id', id);
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, checked: !i.checked } : i));
  }

  async function deleteItem(id: string) {
    await supabase.from('shopping_list_items').delete().eq('id', id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  async function clearChecked() {
    const checkedIds = items.filter((i) => i.checked).map((i) => i.id);
    if (checkedIds.length === 0) return;
    await supabase.from('shopping_list_items').delete().in('id', checkedIds);
    setItems((prev) => prev.filter((i) => !i.checked));
  }

  return { items, loading, addItem, toggleItem, deleteItem, clearChecked, refetch: fetchItems };
}
```

- [ ] **Step 6: Commit**

```bash
git add lib/deeplinks.ts hooks/useShopping.ts __tests__/lib/deeplinks.test.ts
git commit -m "feat: add deeplinks utility and useShopping hook"
git push origin main
```

---

### Task 17: Shopping tab Edge Function and complete screen

**Files:**
- Create: `supabase/functions/build-shopping-list/index.ts`
- Create: `components/shopping/ShoppingItem.tsx`
- Create: `components/shopping/OrderButtons.tsx`
- Modify: `app/(tabs)/shopping.tsx`

- [ ] **Step 1: Create `supabase/functions/build-shopping-list/index.ts`**

```typescript
import Anthropic from 'npm:@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! });

Deno.serve(async (req) => {
  const { fridgeItems, householdSize, preferences } = await req.json();
  const prefStr = preferences?.length > 0 ? `Dietary preferences: ${preferences.join(', ')}.` : '';

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `I have these items in my fridge: ${fridgeItems.join(', ')}.
Household size: ${householdSize} people. ${prefStr}
Build a practical weekly grocery shopping list for what I need to buy.
Do not include items I already have unless they are nearly empty.
Return a JSON array of objects with: name (string), quantity (number), unit (string).
Return only the JSON array.`,
    }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '[]';
  let items = [];
  try {
    items = JSON.parse(text.replace(/```json?|```/g, '').trim());
  } catch {
    items = [];
  }

  return new Response(JSON.stringify({ items }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

- [ ] **Step 2: Deploy Edge Function**

```bash
npx supabase functions deploy build-shopping-list
```

- [ ] **Step 3: Create `components/shopping/ShoppingItem.tsx`**

```typescript
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import type { ShoppingItem as ShoppingItemType } from '@/hooks/useShopping';

interface Props {
  item: ShoppingItemType;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ShoppingItem({ item, onToggle, onDelete }: Props) {
  return (
    <View style={styles.row}>
      <TouchableOpacity onPress={() => onToggle(item.id)} style={styles.checkbox} hitSlop={8}>
        <View style={[styles.box, item.checked && styles.boxChecked]}>
          {item.checked && <Text style={styles.check}>✓</Text>}
        </View>
      </TouchableOpacity>
      <Text style={[styles.name, item.checked && styles.checkedText]}>{item.name}</Text>
      {item.unit ? <Text style={styles.qty}>{item.quantity} {item.unit}</Text> : null}
      <TouchableOpacity onPress={() => onDelete(item.id)} hitSlop={8}>
        <Text style={styles.delete}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.xs,
    gap: Spacing.sm,
  },
  checkbox: { flexShrink: 0 },
  box: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxChecked: { backgroundColor: Colors.primary },
  check: { color: '#fff', fontSize: 12, fontWeight: '700' },
  name: { ...Typography.body, flex: 1, color: Colors.textPrimary },
  checkedText: { textDecorationLine: 'line-through', color: Colors.textMuted },
  qty: { ...Typography.caption },
  delete: { color: Colors.textMuted, fontSize: 14 },
});
```

- [ ] **Step 4: Create `components/shopping/OrderButtons.tsx`**

```typescript
import React from 'react';
import { View, StyleSheet, Linking, Alert } from 'react-native';
import { Button } from '@/components/ui/Button';
import { PremiumGate } from '@/components/ui/PremiumGate';
import { buildInstacartUrl, buildWalmartUrl } from '@/lib/deeplinks';
import { Spacing } from '@/constants/theme';

interface Props {
  itemNames: string[];
}

async function openUrl(url: string, service: string) {
  const supported = await Linking.canOpenURL(url);
  if (supported) {
    await Linking.openURL(url);
  } else {
    Alert.alert(
      'Cannot open',
      `Unable to open ${service}. Make sure the app is installed or try later.`
    );
  }
}

export function OrderButtons({ itemNames }: Props) {
  return (
    <PremiumGate feature="Instacart and Walmart ordering">
      <View style={styles.container}>
        <Button
          label="🛍 Order on Instacart"
          onPress={() => openUrl(buildInstacartUrl(itemNames), 'Instacart')}
          style={styles.instacart}
        />
        <Button
          label="🛒 Order on Walmart"
          onPress={() => openUrl(buildWalmartUrl(itemNames), 'Walmart')}
          style={styles.walmart}
        />
      </View>
    </PremiumGate>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.md, gap: Spacing.sm },
  instacart: { backgroundColor: '#1c1917' },
  walmart: { backgroundColor: '#0071ce' },
});
```

- [ ] **Step 5: Replace `app/(tabs)/shopping.tsx` with full implementation**

```typescript
import React, { useState } from 'react';
import {
  View, FlatList, StyleSheet, SafeAreaView, TextInput,
  Alert, TouchableOpacity, Text,
} from 'react-native';
import { Header } from '@/components/ui/Header';
import { EmptyState } from '@/components/ui/EmptyState';
import { ShoppingItem } from '@/components/shopping/ShoppingItem';
import { OrderButtons } from '@/components/shopping/OrderButtons';
import { Button } from '@/components/ui/Button';
import { PremiumGate } from '@/components/ui/PremiumGate';
import { useShopping } from '@/hooks/useShopping';
import { useFridge } from '@/hooks/useFridge';
import { buildShoppingList } from '@/lib/claude';
import { supabase } from '@/lib/supabase';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';

export default function ShoppingScreen() {
  const { items, addItem, toggleItem, deleteItem, clearChecked } = useShopping();
  const { items: fridgeItems } = useFridge();
  const [newItem, setNewItem] = useState('');
  const [buildingList, setBuildingList] = useState(false);

  async function handleAddItem() {
    if (!newItem.trim()) return;
    await addItem(newItem.trim());
    setNewItem('');
  }

  async function handleBuildList() {
    setBuildingList(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('dietary_preferences, household_size')
        .eq('id', user?.id ?? '')
        .single();
      const itemNames = fridgeItems.map((i) => i.name);
      const newItems = await buildShoppingList(
        itemNames,
        profile?.household_size ?? 2,
        profile?.dietary_preferences ?? []
      );
      for (const item of newItems) {
        await addItem(item.name, item.quantity, item.unit);
      }
    } catch {
      Alert.alert('Error', 'Could not build shopping list. Please try again.');
    } finally {
      setBuildingList(false);
    }
  }

  const uncheckedNames = items.filter((i) => !i.checked).map((i) => i.name);

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Shopping" />

      <PremiumGate feature="AI weekly list builder">
        <Button
          label={buildingList ? 'Building list...' : '🤖 Build My Weekly List'}
          onPress={handleBuildList}
          loading={buildingList}
          style={styles.buildButton}
        />
      </PremiumGate>

      <View style={styles.addRow}>
        <TextInput
          style={styles.input}
          placeholder="Add item..."
          value={newItem}
          onChangeText={setNewItem}
          placeholderTextColor={Colors.textMuted}
          onSubmitEditing={handleAddItem}
          returnKeyType="done"
        />
        <TouchableOpacity style={styles.addBtn} onPress={handleAddItem}>
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {items.length === 0 ? (
        <EmptyState
          icon="🛒"
          title="List is empty"
          message="Add items manually or let AI build your weekly list."
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ShoppingItem item={item} onToggle={toggleItem} onDelete={deleteItem} />
          )}
          contentContainerStyle={styles.list}
          ListFooterComponent={
            items.some((i) => i.checked) ? (
              <Button
                label="Clear checked items"
                onPress={clearChecked}
                variant="ghost"
                style={styles.clearBtn}
              />
            ) : null
          }
        />
      )}

      {uncheckedNames.length > 0 && <OrderButtons itemNames={uncheckedNames} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  buildButton: { margin: Spacing.md, marginBottom: 0 },
  addRow: { flexDirection: 'row', padding: Spacing.md, gap: Spacing.sm },
  input: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Typography.body,
    color: Colors.textPrimary,
  },
  addBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: { color: '#fff', fontWeight: '700' },
  list: { paddingHorizontal: Spacing.md, paddingBottom: 20 },
  clearBtn: { marginTop: Spacing.sm },
});
```

- [ ] **Step 6: Commit**

```bash
git add supabase/functions/build-shopping-list/ components/shopping/ app/(tabs)/shopping.tsx
git commit -m "feat: complete shopping tab with AI list builder and grocery ordering"
git push origin main
```

---

## Phase 7: Final Verification

### Task 18: Run all tests and verify the full app

- [ ] **Step 1: Run the full test suite**

```bash
npm test
```

Expected: all tests PASS. If any fail, fix before continuing.

- [ ] **Step 2: Start the app**

```bash
npm start
```

Open on a physical device or simulator.

- [ ] **Step 3: Verify auth flow**

Sign up with a new email address. Complete onboarding. Confirm you land on the Fridge tab.

- [ ] **Step 4: Verify fridge tab**

Add a manual item. Confirm it appears in the list. Delete it. Confirm it disappears.

- [ ] **Step 5: Verify recipes tab**

With items in the fridge, open Recipes. Confirm AI recipes load. Tap one and confirm the detail screen opens with ingredients and steps.

- [ ] **Step 6: Verify shopping tab**

Add a manual item. Check it off. Tap "Clear checked items". Confirm Order buttons are behind the PremiumGate for free users.

- [ ] **Step 7: Final commit**

```bash
git add -A
git commit -m "feat: Leftovers v2 complete - AI-powered kitchen assistant"
git push origin main
```

---

## Environment Setup Reference

Before running, configure these values:

| Variable | Where to get it |
|----------|----------------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase dashboard - Project Settings - API |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase dashboard - Project Settings - API |
| `EXPO_PUBLIC_REVENUECAT_KEY` | RevenueCat dashboard - your app's public SDK key |
| `ANTHROPIC_API_KEY` | console.anthropic.com (set via `npx supabase secrets set`) |

All four must be set before the app will work end-to-end.
