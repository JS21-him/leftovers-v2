import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { supabase } from '@/lib/supabase';

export function useNotifications() {
  useEffect(() => {
    // Skip in Expo Go — push tokens require a dev build
    if (Constants.appOwnership === 'expo') return;

    async function registerToken() {
      try {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') return;

        const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
        if (!projectId) return;
        const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
        if (!token) return;

        const { data, error: userError } = await supabase.auth.getUser();
        if (userError || !data?.user) return;
        const { user } = data;

        await supabase.from('profiles').upsert({ id: user.id, push_token: token }, { onConflict: 'id' });
      } catch {
        // Silently fail — notifications are non-critical
      }
    }

    registerToken();
  }, []);
}
