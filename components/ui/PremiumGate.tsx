import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { purchasePremium } from '@/lib/purchases';
import { useSubscription } from '@/hooks/useSubscription';

interface PremiumGateProps {
  children: React.ReactNode;
  feature: string;
}

/**
 * Wraps a feature that requires Premium.
 *
 * If the user is not premium:
 *   - renders the children behind a semi-transparent overlay (vs. hiding them entirely)
 *   - shows a "Unlock Premium" nudge on top
 *
 * This is better UX than a full replacement — users can see WHAT they're missing.
 */
export function PremiumGate({ children, feature }: PremiumGateProps) {
  const { isPremium, loading, refetch } = useSubscription();

  if (loading) return null;
  if (isPremium) return <>{children}</>;

  async function handleUpgrade() {
    const success = await purchasePremium();
    if (success) refetch();
  }

  return (
    <View style={styles.wrapper}>
      {/* Grayed-out preview of the feature */}
      <View style={styles.preview} pointerEvents="none">
        {children}
      </View>

      {/* Overlay nudge */}
      <View style={styles.overlay}>
        <Text style={styles.icon}>✨</Text>
        <Text style={styles.title}>Premium Feature</Text>
        <Text style={styles.message}>{feature} is available with Premium.</Text>
        <TouchableOpacity style={styles.button} onPress={handleUpgrade} activeOpacity={0.85}>
          <Text style={styles.buttonText}>Unlock Premium</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  preview: {
    opacity: 0.25,
    pointerEvents: 'none',
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(255, 248, 240, 0.92)',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  icon: { fontSize: 28, marginBottom: 4 },
  title: { ...Typography.subheading, marginBottom: 4, textAlign: 'center' },
  message: {
    ...Typography.caption,
    textAlign: 'center',
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
    lineHeight: 18,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
});
