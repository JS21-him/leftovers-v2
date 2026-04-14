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
