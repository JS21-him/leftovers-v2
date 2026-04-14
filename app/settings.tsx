import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/ui/Header';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { purchasePremium, restorePurchases } from '@/lib/purchases';
import { useSubscription } from '@/hooks/useSubscription';

export default function SettingsScreen() {
  const router = useRouter();
  const { isPremium, refetch } = useSubscription();

  async function signOut() {
    await supabase.auth.signOut();
    router.replace('/(auth)/login');
  }

  async function handleUpgrade() {
    const success = await purchasePremium();
    if (success) {
      refetch();
      Alert.alert('Welcome to Premium!', 'All features are now unlocked.');
    } else {
      Alert.alert('Purchase cancelled', 'You can upgrade any time from Settings.');
    }
  }

  async function handleRestore() {
    const restored = await restorePurchases();
    if (restored) {
      refetch();
      Alert.alert('Restored', 'Your premium subscription has been restored.');
    } else {
      Alert.alert('Not found', 'No previous purchase found for this account.');
    }
  }

  return (
    <View style={styles.container}>
      <Header title="Settings" showSettings={false} />
      <View style={styles.content}>
        <Text style={styles.sectionLabel}>SUBSCRIPTION</Text>
        <Text style={styles.status}>{isPremium ? '✨ Premium - Active' : 'Free Plan'}</Text>
        {!isPremium && (
          <Button label="Upgrade to Premium" onPress={handleUpgrade} style={styles.item} />
        )}
        <Button label="Restore Purchases" onPress={handleRestore} variant="secondary" style={styles.item} />
        <Text style={[styles.sectionLabel, { marginTop: Spacing.lg }]}>ACCOUNT</Text>
        <Button label="Sign Out" onPress={signOut} variant="secondary" style={styles.item} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md },
  sectionLabel: { ...Typography.label, marginBottom: Spacing.sm },
  status: { ...Typography.body, marginBottom: Spacing.md, color: Colors.textPrimary, fontWeight: '600' },
  item: { marginBottom: Spacing.sm },
});
