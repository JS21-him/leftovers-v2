/**
 * App-wide toast notification system.
 *
 * Usage:
 *   const { showToast } = useToast();
 *   showToast({ message: 'Item added!', type: 'success' });
 *   showToast({ message: 'Item removed', type: 'info', action: { label: 'Undo', onPress: () => {} } });
 *
 * Wrap the root layout with <ToastProvider>.
 */
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────
export type ToastType = 'success' | 'error' | 'info';

interface ToastAction {
  label: string;
  onPress: () => void;
}

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  action?: ToastAction;
}

interface ToastContextValue {
  showToast: (opts: { message: string; type?: ToastType; action?: ToastAction }) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────
const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

// ─── Single Toast Item ────────────────────────────────────────────────────────
function ToastItem({
  toast,
  onDone,
}: {
  toast: ToastMessage;
  onDone: (id: string) => void;
}) {
  const translateY = useSharedValue(-80);
  const opacity = useSharedValue(0);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const dismiss = useCallback(() => {
    opacity.value = withTiming(0, { duration: 250 });
    translateY.value = withTiming(
      -60,
      { duration: 250 },
      (finished) => {
        if (finished) runOnJS(onDone)(toast.id);
      },
    );
  }, []);

  useEffect(() => {
    // Slide in
    translateY.value = withSpring(0, { damping: 18, stiffness: 200 });
    opacity.value = withTiming(1, { duration: 200 });

    // Auto-dismiss after 3.5s (longer when there's an action)
    const delay = toast.action ? 4500 : 2800;
    const timer = setTimeout(dismiss, delay);

    return () => clearTimeout(timer);
  }, []);

  const bg =
    toast.type === 'success'
      ? '#16a34a'
      : toast.type === 'error'
      ? '#dc2626'
      : '#1d4ed8';

  const icon =
    toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'ℹ';

  return (
    <Animated.View style={[styles.toast, { backgroundColor: bg }, animStyle]}>
      <View style={styles.toastIcon}>
        <Text style={styles.toastIconText}>{icon}</Text>
      </View>
      <Text style={styles.toastText} numberOfLines={2}>
        {toast.message}
      </Text>
      {toast.action && (
        <TouchableOpacity
          onPress={() => {
            toast.action!.onPress();
            dismiss();
          }}
          style={styles.actionBtn}
          hitSlop={8}
        >
          <Text style={styles.actionText}>{toast.action.label}</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const insets = useSafeAreaInsets();
  const counter = useRef(0);

  const showToast = useCallback(
    ({ message, type = 'info', action }: { message: string; type?: ToastType; action?: ToastAction }) => {
      const id = String(++counter.current);
      setToasts((prev) => [...prev.slice(-2), { id, message, type, action }]);
    },
    [],
  );

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast overlay — renders above everything */}
      <View
        style={[
          styles.container,
          { top: insets.top + (Platform.OS === 'ios' ? 8 : 12) },
        ]}
        pointerEvents="box-none"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDone={remove} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
    zIndex: 9999,
    gap: Spacing.sm,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.lg,
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  toastIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  toastIconText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  toastText: {
    ...Typography.body,
    color: '#fff',
    fontWeight: '600',
    flex: 1,
    fontSize: 13,
  },
  actionBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: Radius.sm,
    paddingVertical: 4,
    paddingHorizontal: 10,
    flexShrink: 0,
  },
  actionText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 12,
  },
});
