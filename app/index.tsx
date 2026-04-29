import { View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { Colors } from '@/constants/theme';

/**
 * Root entry point — waits for auth to resolve before redirecting.
 * This prevents the flash where unauthenticated users briefly see
 * the fridge tab before being sent to onboarding.
 */
export default function Index() {
  const { session, loading } = useAuth();

  if (loading) {
    // Show blank splash-colored screen while auth resolves
    return <View style={{ flex: 1, backgroundColor: Colors.background }} />;
  }

  return <Redirect href={session ? '/(tabs)/fridge' : '/(auth)/onboarding'} />;
}
