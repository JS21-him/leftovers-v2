# Branding + Onboarding Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the emoji logo with a fridge-E wordmark component and redesign onboarding to lead with a scan-first flow (scan before signup).

**Architecture:** `components/Logo.tsx` is a self-contained wordmark using react-native-svg (fridge SVG inline with "L" + "FTOVERS" text). Onboarding is rebuilt as a minimal welcome screen with no form — tapping "Scan My Fridge" navigates to a new top-level `app/scan-preview.tsx` screen that creates an anonymous Supabase session, runs the scan, loads recipes, then surfaces a sign-up modal. The auth guard in `_layout.tsx` is unchanged — anonymous sessions pass through like named sessions.

**Tech Stack:** React Native, Expo SDK 54, TypeScript, react-native-svg, Supabase anonymous auth (`signInAnonymously` + `updateUser`)

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `components/Logo.tsx` | Create | Fridge-E wordmark, sizes sm/md/lg |
| `components/SignUpModal.tsx` | Create | Post-scan sign-up overlay |
| `app/(auth)/onboarding.tsx` | Rewrite | Minimal welcome screen, no form |
| `app/scan-preview.tsx` | Create | Onboarding scan + recipe preview |
| `app/_layout.tsx` | Modify | Register `scan-preview` stack screen |
| `app/(auth)/login.tsx` | Modify | Swap emoji `🧊` for `<Logo size="md" />` |
| `hooks/__tests__/Logo.test.tsx` | Create | Render tests for Logo |
| `hooks/__tests__/SignUpModal.test.tsx` | Create | Render + interaction tests |
| `hooks/__tests__/onboarding.test.tsx` | Create | Render + nav tests for new onboarding |

---

## Task 1: Install react-native-svg

**Files:**
- Modify: `package.json` (via expo install)

- [ ] **Step 1: Install**

```bash
npx expo install react-native-svg
```

Expected: `react-native-svg` added to `package.json` dependencies.

- [ ] **Step 2: Verify TypeScript types available**

```bash
npx tsc --noEmit
```

Expected: No new errors.

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "chore: install react-native-svg"
```

---

## Task 2: Logo component

**Files:**
- Create: `components/Logo.tsx`
- Create: `hooks/__tests__/Logo.test.tsx`

The wordmark is `L` + fridge SVG + `FTOVERS`, all in a horizontal row baseline-aligned. The fridge SVG uses the same geometry as the approved `b-fridge-e.html` mockup (viewBox `0 0 28 54`). The fridge is orange (`#f97316`), text is the app's `textPrimary` color (`#7c2d12`).

- [ ] **Step 1: Write the failing test**

Create `hooks/__tests__/Logo.test.tsx`:

```tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { Logo } from '@/components/Logo';

jest.mock('react-native-svg', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: ({ children, ...props }: any) => <View {...props}>{children}</View>,
    Rect: (props: any) => <View {...props} />,
    Line: (props: any) => <View {...props} />,
    Svg: ({ children, ...props }: any) => <View {...props}>{children}</View>,
  };
});

describe('Logo', () => {
  it('renders sm without crashing', () => {
    const { getByText } = render(<Logo size="sm" />);
    expect(getByText('L')).toBeTruthy();
    expect(getByText('FTOVERS')).toBeTruthy();
  });

  it('renders md without crashing', () => {
    const { getByText } = render(<Logo size="md" />);
    expect(getByText('L')).toBeTruthy();
  });

  it('renders lg without crashing', () => {
    const { getByText } = render(<Logo size="lg" />);
    expect(getByText('L')).toBeTruthy();
  });

  it('shows tagline when showTagline=true', () => {
    const { getByText } = render(<Logo size="md" showTagline />);
    expect(getByText('Stop wasting food.')).toBeTruthy();
  });

  it('hides tagline by default', () => {
    const { queryByText } = render(<Logo size="md" />);
    expect(queryByText('Stop wasting food.')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- --testPathPattern="Logo.test" --watchAll=false
```

Expected: FAIL — "Cannot find module '@/components/Logo'"

- [ ] **Step 3: Implement Logo component**

Create `components/Logo.tsx`:

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Line } from 'react-native-svg';
import { Colors } from '@/constants/theme';

export type LogoSize = 'sm' | 'md' | 'lg';

const SIZES: Record<LogoSize, { fontSize: number; iconW: number; iconH: number }> = {
  sm: { fontSize: 28, iconW: 17, iconH: 28 },
  md: { fontSize: 42, iconW: 25, iconH: 42 },
  lg: { fontSize: 52, iconW: 31, iconH: 52 },
};

function FridgeIcon({ width, height }: { width: number; height: number }) {
  // All coordinates are relative to viewBox "0 0 28 54" (from approved mockup).
  // SVG scales to the rendered width/height automatically.
  return (
    <Svg width={width} height={height} viewBox="0 0 28 54">
      {/* Outer body */}
      <Rect x="1" y="1" width="22" height="52" rx="2.5" stroke={Colors.primary} strokeWidth="2.5" fill="none" />
      {/* Freezer divider */}
      <Line x1="1" y1="15" x2="23" y2="15" stroke={Colors.primary} strokeWidth="2" />
      {/* Shelf 1 */}
      <Line x1="5" y1="26" x2="18" y2="26" stroke={Colors.primary} strokeWidth="1.5" strokeLinecap="round" />
      {/* Shelf 2 */}
      <Line x1="5" y1="35" x2="18" y2="35" stroke={Colors.primary} strokeWidth="1.5" strokeLinecap="round" />
      {/* Shelf 3 */}
      <Line x1="5" y1="43" x2="18" y2="43" stroke={Colors.primary} strokeWidth="1.5" strokeLinecap="round" />
      {/* Freezer handle */}
      <Rect x="17" y="3" width="3" height="8" rx="1.5" fill={Colors.primary} />
      {/* Fridge handle */}
      <Rect x="17" y="18" width="3" height="10" rx="1.5" fill={Colors.primary} />
    </Svg>
  );
}

interface LogoProps {
  size: LogoSize;
  showTagline?: boolean;
}

export function Logo({ size, showTagline = false }: LogoProps) {
  const { fontSize, iconW, iconH } = SIZES[size];
  const letterStyle = { fontSize, fontWeight: '900' as const, color: Colors.textPrimary, fontFamily: 'System', lineHeight: fontSize };

  return (
    <View style={styles.wrapper}>
      <View style={styles.wordmark}>
        <Text style={letterStyle}>L</Text>
        <FridgeIcon width={iconW} height={iconH} />
        <Text style={letterStyle}>FTOVERS</Text>
      </View>
      {showTagline && (
        <>
          <View style={[styles.divider, { marginTop: size === 'lg' ? 14 : 10 }]} />
          <Text style={styles.tagline}>Stop wasting food.</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center' },
  wordmark: { flexDirection: 'row', alignItems: 'flex-end', gap: 0 },
  divider: { width: 44, height: 3, backgroundColor: Colors.primary, borderRadius: 2, marginTop: 10 },
  tagline: { color: Colors.textMuted, fontSize: 13, marginTop: 6 },
});
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- --testPathPattern="Logo.test" --watchAll=false
```

Expected: 5 tests PASS.

- [ ] **Step 5: Verify types**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add components/Logo.tsx hooks/__tests__/Logo.test.tsx
git commit -m "feat: add Logo component with fridge-E wordmark"
```

---

## Task 3: SignUpModal component

**Files:**
- Create: `components/SignUpModal.tsx`
- Create: `hooks/__tests__/SignUpModal.test.tsx`

Modal overlaid after the recipe preview. Shows email + password inputs, converts anonymous session to a named account on submit.

- [ ] **Step 1: Write the failing test**

Create `hooks/__tests__/SignUpModal.test.tsx`:

```tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { SignUpModal } from '@/components/SignUpModal';

const mockUpdateUser = jest.fn().mockResolvedValue({ error: null });
jest.mock('@/lib/supabase', () => ({
  supabase: { auth: { updateUser: (...args: any[]) => mockUpdateUser(...args) } },
}));

describe('SignUpModal', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders headline and buttons', () => {
    const { getByText } = render(
      <SignUpModal visible onSkip={jest.fn()} onSuccess={jest.fn()} />
    );
    expect(getByText('Your fridge is ready')).toBeTruthy();
    expect(getByText('Create Free Account')).toBeTruthy();
    expect(getByText('Skip for now')).toBeTruthy();
  });

  it('calls onSkip when skip tapped', () => {
    const onSkip = jest.fn();
    const { getByText } = render(
      <SignUpModal visible onSkip={onSkip} onSuccess={jest.fn()} />
    );
    fireEvent.press(getByText('Skip for now'));
    expect(onSkip).toHaveBeenCalled();
  });

  it('calls updateUser and onSuccess when form submitted', async () => {
    const onSuccess = jest.fn();
    const { getByPlaceholderText, getByText } = render(
      <SignUpModal visible onSkip={jest.fn()} onSuccess={onSuccess} />
    );
    fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'secret123');
    fireEvent.press(getByText('Create Free Account'));
    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith({ email: 'test@example.com', password: 'secret123' });
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('shows error if password under 6 chars', async () => {
    const { getByPlaceholderText, getByText } = render(
      <SignUpModal visible onSkip={jest.fn()} onSuccess={jest.fn()} />
    );
    fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), '123');
    fireEvent.press(getByText('Create Free Account'));
    await waitFor(() => {
      expect(getByText('Must be at least 6 characters')).toBeTruthy();
      expect(mockUpdateUser).not.toHaveBeenCalled();
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- --testPathPattern="SignUpModal.test" --watchAll=false
```

Expected: FAIL — "Cannot find module '@/components/SignUpModal'"

- [ ] **Step 3: Implement SignUpModal**

Create `components/SignUpModal.tsx`:

```tsx
import React, { useState, useRef } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { Colors, Spacing, Radius, Typography } from '@/constants/theme';

interface Props {
  visible: boolean;
  onSkip: () => void;
  onSuccess: () => void;
}

export function SignUpModal({ visible, onSkip, onSuccess }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  async function handleSubmit() {
    setPasswordError('');
    if (password.length < 6) {
      setPasswordError('Must be at least 6 characters');
      return;
    }
    if (!email) {
      Alert.alert('Error', 'Please enter your email.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ email, password });
      if (error) {
        Alert.alert('Error', error.message);
      } else {
        onSuccess();
      }
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.sheet}>
          <Text style={styles.headline}>Your fridge is ready</Text>
          <Text style={styles.sub}>
            Create a free account to save your items and come back later.
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={Colors.textMuted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            blurOnSubmit={false}
          />
          <TextInput
            ref={passwordRef}
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={Colors.textMuted}
            value={password}
            onChangeText={(t) => { setPassword(t); setPasswordError(''); }}
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
          />
          {passwordError ? (
            <Text style={styles.fieldError}>{passwordError}</Text>
          ) : (
            <Text style={styles.hint}>Must be at least 6 characters</Text>
          )}

          <TouchableOpacity style={styles.primaryBtn} onPress={handleSubmit} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>Create Free Account</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.freeNote}>Free to use - No credit card required</Text>

          <TouchableOpacity style={styles.skipBtn} onPress={onSkip}>
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.xl,
    paddingBottom: Spacing.xl + 16,
  },
  headline: { ...Typography.heading, fontSize: 22, textAlign: 'center', marginBottom: Spacing.sm },
  sub: { ...Typography.body, textAlign: 'center', marginBottom: Spacing.lg, lineHeight: 20 },
  input: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Typography.body,
    color: Colors.textPrimary,
  },
  hint: { ...Typography.caption, color: Colors.textMuted, marginBottom: Spacing.md },
  fieldError: { ...Typography.caption, color: Colors.danger, marginBottom: Spacing.md },
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  freeNote: { ...Typography.caption, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.sm },
  skipBtn: { alignItems: 'center', marginTop: Spacing.md, padding: Spacing.sm },
  skipText: { ...Typography.caption, color: Colors.textMuted },
});
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- --testPathPattern="SignUpModal.test" --watchAll=false
```

Expected: 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add components/SignUpModal.tsx hooks/__tests__/SignUpModal.test.tsx
git commit -m "feat: add SignUpModal for post-scan account creation"
```

---

## Task 4: Rewrite onboarding.tsx (welcome screen)

**Files:**
- Modify: `app/(auth)/onboarding.tsx` (complete rewrite)
- Create: `hooks/__tests__/onboarding.test.tsx`

Replace the multi-step sign-up flow with a minimal welcome screen: Logo + one-liner + "Scan My Fridge" CTA + login link.

- [ ] **Step 1: Write the failing test**

Create `hooks/__tests__/onboarding.test.tsx`:

```tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import OnboardingScreen from '@/app/(auth)/onboarding';

const mockReplace = jest.fn();
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace, push: mockPush }),
}));

jest.mock('react-native-svg', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: ({ children, ...p }: any) => <View {...p}>{children}</View>,
    Rect: (p: any) => <View {...p} />,
    Line: (p: any) => <View {...p} />,
    Svg: ({ children, ...p }: any) => <View {...p}>{children}</View>,
  };
});

const mockSignInAnonymously = jest.fn().mockResolvedValue({ data: { session: {} }, error: null });
jest.mock('@/lib/supabase', () => ({
  supabase: { auth: { signInAnonymously: (...a: any[]) => mockSignInAnonymously(...a) } },
}));

describe('OnboardingScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders Scan My Fridge button', () => {
    const { getByText } = render(<OnboardingScreen />);
    expect(getByText('Scan My Fridge')).toBeTruthy();
  });

  it('renders login link', () => {
    const { getByText } = render(<OnboardingScreen />);
    expect(getByText('I already have an account')).toBeTruthy();
  });

  it('login link navigates to login', () => {
    const { getByText } = render(<OnboardingScreen />);
    fireEvent.press(getByText('I already have an account'));
    expect(mockPush).toHaveBeenCalledWith('/(auth)/login');
  });

  it('Scan My Fridge calls signInAnonymously and navigates to scan-preview', async () => {
    const { getByText } = render(<OnboardingScreen />);
    fireEvent.press(getByText('Scan My Fridge'));
    await waitFor(() => {
      expect(mockSignInAnonymously).toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith('/scan-preview');
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- --testPathPattern="onboarding.test" --watchAll=false
```

Expected: FAIL — component structure won't match.

- [ ] **Step 3: Rewrite onboarding.tsx**

Replace the entire content of `app/(auth)/onboarding.tsx`:

```tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/Button';
import { Colors, Spacing, Typography } from '@/constants/theme';

export default function OnboardingScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleScan() {
    setLoading(true);
    try {
      await supabase.auth.signInAnonymously();
      router.replace('/scan-preview');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Logo size="lg" showTagline />
      <Text style={styles.value}>See what you can cook with what you have.</Text>
      <Button
        label={loading ? 'Getting ready...' : 'Scan My Fridge'}
        onPress={handleScan}
        loading={loading}
        style={styles.cta}
      />
      <TouchableOpacity onPress={() => router.push('/(auth)/login')} style={styles.loginBtn}>
        <Text style={styles.loginText}>I already have an account</Text>
      </TouchableOpacity>
      <Text style={styles.finePrint}>No account needed to get started</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  value: {
    ...Typography.body,
    textAlign: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
    fontSize: 16,
    lineHeight: 24,
  },
  cta: { width: '100%' },
  loginBtn: { marginTop: Spacing.md, padding: Spacing.sm },
  loginText: { ...Typography.body, color: Colors.textMuted },
  finePrint: { ...Typography.caption, color: Colors.textMuted, marginTop: Spacing.sm },
});
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- --testPathPattern="onboarding.test" --watchAll=false
```

Expected: 4 tests PASS.

- [ ] **Step 5: Verify types**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add app/(auth)/onboarding.tsx hooks/__tests__/onboarding.test.tsx
git commit -m "feat: rewrite onboarding as scan-first welcome screen"
```

---

## Task 5: Scan Preview screen

**Files:**
- Create: `app/scan-preview.tsx`

This is the onboarding scan + recipe preview screen. It creates the anonymous session on mount (the user was already signed in anonymously in onboarding, but if they navigate here directly the session still exists), lets the user scan their fridge, then shows recipe suggestions and the sign-up modal.

**Note on session:** `signInAnonymously()` was called in onboarding before navigating here. By the time this screen mounts, `supabase.auth.getSession()` returns a valid anonymous session. The hooks (`useFridge`, `useRecipes`) work identically for anonymous and named users.

- [ ] **Step 1: Implement scan-preview.tsx**

Create `app/scan-preview.tsx`:

```tsx
import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ScanButtons } from '@/components/fridge/ScanButtons';
import { RecipeCard } from '@/components/recipes/RecipeCard';
import { SignUpModal } from '@/components/SignUpModal';
import { useFridge } from '@/hooks/useFridge';
import { useRecipes } from '@/hooks/useRecipes';
import { Colors, Spacing, Typography } from '@/constants/theme';
import type { NewFridgeItem } from '@/hooks/useFridge';

export default function ScanPreviewScreen() {
  const router = useRouter();
  const { items, addItem } = useFridge();
  const { recipes, loading: recipesLoading, fetchRecipes } = useRecipes(items, false);
  const [scanned, setScanned] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleItemsScanned = useCallback(
    async (newItems: NewFridgeItem[]) => {
      for (const item of newItems) {
        try { await addItem(item); } catch { /* continue */ }
      }
      setScanned(true);
      await fetchRecipes();
      setShowModal(true);
    },
    [addItem, fetchRecipes],
  );

  function handleSuccess() {
    setShowModal(false);
    router.replace('/(tabs)/fridge');
  }

  function handleSkip() {
    setShowModal(false);
    router.replace('/(tabs)/fridge');
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.heading}>Scan your fridge</Text>
        <Text style={styles.sub}>Point your camera at your fridge or a receipt.</Text>

        <ScanButtons onItemsScanned={handleItemsScanned} />

        {scanned && recipesLoading && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Finding recipes for you...</Text>
          </View>
        )}

        {scanned && !recipesLoading && recipes.length > 0 && (
          <>
            <Text style={styles.recipesHeading}>Here's what you can make</Text>
            {recipes.slice(0, 3).map((recipe, i) => (
              <RecipeCard key={i} recipe={recipe} onPress={() => {}} />
            ))}
          </>
        )}
      </ScrollView>

      <SignUpModal visible={showModal} onSkip={handleSkip} onSuccess={handleSuccess} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg },
  heading: { ...Typography.heading, fontSize: 22, marginBottom: Spacing.sm },
  sub: { ...Typography.body, marginBottom: Spacing.lg, lineHeight: 20 },
  center: { alignItems: 'center', padding: Spacing.xl },
  loadingText: { ...Typography.body, marginTop: Spacing.md, color: Colors.textMuted },
  recipesHeading: { ...Typography.subheading, marginTop: Spacing.lg, marginBottom: Spacing.md },
});
```

- [ ] **Step 2: Verify types**

```bash
npx tsc --noEmit
```

Expected: No errors. If RecipeCard props don't match, check `components/recipes/RecipeCard.tsx` for the correct prop name (it may be `onPress` or `onSelect`).

- [ ] **Step 3: Commit**

```bash
git add app/scan-preview.tsx
git commit -m "feat: add scan-preview onboarding screen"
```

---

## Task 6: Register scan-preview in _layout.tsx

**Files:**
- Modify: `app/_layout.tsx`

The new `scan-preview` screen is at the root level (not inside `(auth)` or `(tabs)`). It needs to be declared in the Stack so expo-router can navigate to it.

- [ ] **Step 1: Add Stack.Screen for scan-preview**

In `app/_layout.tsx`, inside the `<Stack>` block, add a new `<Stack.Screen>` entry after the existing ones:

Current:
```tsx
<Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.background } }}>
  <Stack.Screen name="(auth)" />
  <Stack.Screen name="(tabs)" />
  <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
  <Stack.Screen name="recipe/[id]" options={{ presentation: 'card' }} />
</Stack>
```

Change to:
```tsx
<Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.background } }}>
  <Stack.Screen name="(auth)" />
  <Stack.Screen name="(tabs)" />
  <Stack.Screen name="scan-preview" />
  <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
  <Stack.Screen name="recipe/[id]" options={{ presentation: 'card' }} />
</Stack>
```

- [ ] **Step 2: Verify types**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add app/_layout.tsx
git commit -m "feat: register scan-preview route in root layout"
```

---

## Task 7: Update login.tsx with Logo

**Files:**
- Modify: `app/(auth)/login.tsx`

Swap the `🧊` emoji `<Text>` for `<Logo size="md" />`. Remove the `emoji` style. Add the svg mock to any existing login tests if present.

- [ ] **Step 1: Add Logo import and swap emoji**

In `app/(auth)/login.tsx`:

1. Add import at the top (after existing imports):
```tsx
import { Logo } from '@/components/Logo';
```

2. Replace:
```tsx
<Text style={styles.emoji}>🧊</Text>
<Text style={styles.title}>{mode === 'login' ? 'Welcome back' : 'Create account'}</Text>
```

With:
```tsx
<View style={styles.logoWrap}>
  <Logo size="md" />
</View>
<Text style={styles.title}>{mode === 'login' ? 'Welcome back' : 'Create account'}</Text>
```

3. Add `logoWrap` to the StyleSheet and remove the `emoji` style:

Remove:
```tsx
emoji: { fontSize: 48, textAlign: 'center', marginBottom: Spacing.md },
```

Add:
```tsx
logoWrap: { alignItems: 'center', marginBottom: Spacing.md },
```

- [ ] **Step 2: Verify types**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Run existing tests**

```bash
npm test -- --watchAll=false
```

Expected: All existing tests pass. (If any test imports login.tsx, add the react-native-svg mock from Task 2's test file.)

- [ ] **Step 4: Commit**

```bash
git add app/(auth)/login.tsx
git commit -m "feat: replace emoji with Logo component in login screen"
```

---

## Task 8: Push to GitHub

- [ ] **Step 1: Final type check**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 2: Run full test suite**

```bash
npm test -- --watchAll=false
```

Expected: All tests pass.

- [ ] **Step 3: Push**

```bash
git push origin main
```

Expected: All commits pushed successfully.

---

## Self-Review

**Spec coverage check:**
- [x] Logo component with sm/md/lg sizes — Task 2
- [x] Fridge-E SVG mark (viewBox 0 0 28 54, body, freezer divider, 3 shelves, 2 handles) — Task 2
- [x] Logo used in onboarding.tsx — Task 4
- [x] Logo used in login.tsx — Task 7
- [x] Welcome screen: no form, "Scan My Fridge" CTA, login link, fine print — Task 4
- [x] signInAnonymously on "Scan My Fridge" — Task 4
- [x] Scan preview screen as separate route — Task 5
- [x] SignUpModal: headline, email, password, "Must be at least 6 chars", fine print, both buttons — Task 3
- [x] updateUser to convert anon session — Task 3
- [x] Navigate to `/(tabs)/fridge` after modal — Task 5
- [x] Auth guard unchanged (anon sessions pass through) — no task needed, confirmed in analysis

**No placeholders present.**

**Type consistency:**
- `Logo` exported as named export from `components/Logo.tsx`, imported as `{ Logo }` in onboarding, login
- `SignUpModal` props: `visible: boolean`, `onSkip: () => void`, `onSuccess: () => void` — consistent across Task 3 definition and Task 5 usage
- `RecipeCard` — check the `onPress` prop name matches what `components/recipes/RecipeCard.tsx` expects before submitting Task 5
