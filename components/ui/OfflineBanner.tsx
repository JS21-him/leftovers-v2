import { useEffect, useRef, useState, useCallback } from 'react';
import { AppState, AppStateStatus, Text, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Shows a banner when the device has no internet connection.
 * Uses a lightweight fetch-based ping so no extra native modules are needed.
 */

const PING_URL = 'https://www.google.com/generate_204';
const CHECK_INTERVAL_MS = 8000;

async function isOnline(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(PING_URL, { method: 'HEAD', signal: controller.signal });
    clearTimeout(timeout);
    return res.ok || res.status === 204;
  } catch {
    return false;
  }
}

export function OfflineBanner() {
  const [offline, setOffline] = useState(false);
  const translateY = useSharedValue(-52);
  const insets = useSafeAreaInsets();
  const mounted = useRef(true);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const check = useCallback(async () => {
    if (!mounted.current) return;
    const online = await isOnline();
    if (!mounted.current) return;
    const isNowOffline = !online;
    setOffline((prev) => {
      if (prev !== isNowOffline) {
        translateY.value = withTiming(isNowOffline ? 0 : -52, { duration: 300 });
      }
      return isNowOffline;
    });
  }, []);

  useEffect(() => {
    mounted.current = true;
    check();
    timer.current = setInterval(check, CHECK_INTERVAL_MS);

    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') check();
    });

    return () => {
      mounted.current = false;
      if (timer.current) clearInterval(timer.current);
      sub.remove();
    };
  }, [check]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!offline) return null;

  return (
    <Animated.View
      style={[
        styles.banner,
        { paddingTop: insets.top + (Platform.OS === 'ios' ? 4 : 8) },
        animStyle,
      ]}
      pointerEvents="none"
    >
      <Text style={styles.text}>No internet connection</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9998,
    backgroundColor: '#374151',
    paddingBottom: 10,
    alignItems: 'center',
  },
  text: { color: '#fff', fontSize: 13, fontWeight: '600' },
});
