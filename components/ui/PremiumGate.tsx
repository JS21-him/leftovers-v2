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
