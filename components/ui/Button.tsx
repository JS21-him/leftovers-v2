import React from 'react';
import {
  Text, StyleSheet, ActivityIndicator, ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { hapticLight } from '@/lib/haptics';

type Variant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

function ButtonComponent({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
}: ButtonProps) {
  const scale = useSharedValue(1);
  const isDisabled = disabled || loading;

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: isDisabled ? 0.5 : 1,
  }));

  const tap = Gesture.Tap()
    .enabled(!isDisabled)
    .maxDuration(500)
    .onBegin(() => {
      scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
    })
    .onFinalize(() => {
      scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    })
    .onEnd(() => {
      hapticLight();
      onPress();
    });

  return (
    <GestureDetector gesture={tap}>
      <Animated.View
        style={[styles.base, styles[variant], animStyle, style]}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled }}
      >
        {loading ? (
          <ActivityIndicator
            color={variant === 'primary' ? '#fff' : Colors.primary}
            size="small"
          />
        ) : (
          <Text style={[styles.label, styles[`${variant}Label` as keyof typeof styles]]}>
            {label}
          </Text>
        )}
      </Animated.View>
    </GestureDetector>
  );
}

export const Button = React.memo(ButtonComponent);

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm + 4,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  primary: { backgroundColor: Colors.primary },
  secondary: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  ghost: { backgroundColor: 'transparent' },
  label: { ...Typography.subheading, fontSize: 15 },
  primaryLabel: { color: '#fff' },
  secondaryLabel: { color: Colors.primary },
  ghostLabel: { color: Colors.primary },
});
