import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { initializePurchases } from '@/lib/purchases';
import { ToastProvider } from '@/components/ui/Toast';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { Colors } from '@/constants/theme';
import { Config } from '@/constants/config';

// ─── Dev-time env var check ───────────────────────────────────────────────────
if (__DEV__) {
  if (!Config.supabaseUrl) {
    console.warn('[Leftovers] ⚠️  EXPO_PUBLIC_SUPABASE_URL is not set in .env.local');
  }
  if (!Config.supabaseAnonKey) {
    console.warn('[Leftovers] ⚠️  EXPO_PUBLIC_SUPABASE_ANON_KEY is not set in .env.local');
  }
  if (!Config.revenueCatKey) {
    console.warn('[Leftovers] ℹ️  EXPO_PUBLIC_REVENUECAT_KEY is not set — premium features will be skipped');
  }
}

export default function RootLayout() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useNotifications();

  useEffect(() => {
    initializePurchases();
  }, []);

  useEffect(() => {
    if (loading || !segments[0]) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!session && !inAuthGroup) {
      router.replace('/(auth)/onboarding');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)/fridge');
    }
  }, [session, loading, segments]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ToastProvider>
          <OfflineBanner />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: Colors.background },
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="index" options={{ animation: 'none' }} />
            <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
            <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
            <Stack.Screen name="scan-preview" />
            <Stack.Screen
              name="settings"
              options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
            />
            <Stack.Screen
              name="recipe/[id]"
              options={{ presentation: 'card', animation: 'slide_from_right' }}
            />
          </Stack>
        </ToastProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
