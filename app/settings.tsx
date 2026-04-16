import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, ScrollView, Share } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/ui/Header';
import { Colors, Spacing, Typography, Radius } from '@/constants/theme';
import { purchasePremium, restorePurchases } from '@/lib/purchases';
import { useSubscription } from '@/hooks/useSubscription';
import { useHousehold } from '@/hooks/useHousehold';

export default function SettingsScreen() {
  const router = useRouter();
  const { isPremium, refetch } = useSubscription();
  const { household, members, joinByCode, refreshInviteCode } = useHousehold();
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);

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

  async function handleShareCode() {
    if (!household) return;
    await Share.share({
      message: `Join my household on Leftovers! Enter this code in the app: ${household.invite_code}`,
    });
  }

  async function handleJoin() {
    if (!joinCode.trim()) return;
    setJoining(true);
    const err = await joinByCode(joinCode);
    setJoining(false);
    if (err) {
      Alert.alert('Could not join', err);
    } else {
      setJoinCode('');
      Alert.alert('Joined!', 'You are now sharing a fridge with this household.');
    }
  }

  async function handleRefreshCode() {
    Alert.alert(
      'Refresh invite code?',
      'The old code will stop working. Anyone who hasn\'t joined yet will need the new code.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Refresh',
          style: 'destructive',
          onPress: async () => {
            const err = await refreshInviteCode();
            if (err) Alert.alert('Error', err);
          },
        },
      ]
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Settings" showSettings={false} />
      <ScrollView contentContainerStyle={styles.content}>

        {/* Household */}
        <Text style={styles.sectionLabel}>HOUSEHOLD</Text>
        {household ? (
          <>
            <View style={styles.codeBox}>
              <Text style={styles.codeLabel}>Your invite code</Text>
              <Text style={styles.code}>{household.invite_code}</Text>
              <Text style={styles.codeHint}>Share this with family members so they can join your fridge</Text>
            </View>
            <Button label="Share Invite Code" onPress={handleShareCode} style={styles.item} />
            <Button label="Refresh Code" onPress={handleRefreshCode} variant="secondary" style={styles.item} />

            <Text style={styles.membersLabel}>Members ({members.length})</Text>
            {members.map((m) => (
              <View key={m.user_id} style={styles.memberRow}>
                <Text style={styles.memberIcon}>👤</Text>
                <Text style={styles.memberText}>{m.email}</Text>
              </View>
            ))}
          </>
        ) : null}

        <Text style={[styles.sectionLabel, { marginTop: Spacing.lg }]}>JOIN A HOUSEHOLD</Text>
        <Text style={styles.joinHint}>Have a code from a family member? Enter it below.</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter 6-letter code"
          placeholderTextColor={Colors.textMuted}
          value={joinCode}
          onChangeText={(t) => setJoinCode(t.toUpperCase())}
          autoCapitalize="characters"
          maxLength={6}
        />
        <Button
          label={joining ? 'Joining...' : 'Join Household'}
          onPress={handleJoin}
          loading={joining}
          style={styles.item}
        />

        {/* Subscription */}
        <Text style={[styles.sectionLabel, { marginTop: Spacing.lg }]}>SUBSCRIPTION</Text>
        <Text style={styles.status}>{isPremium ? '✨ Premium - Active' : 'Free Plan'}</Text>
        {!isPremium && (
          <Button label="Upgrade to Premium" onPress={handleUpgrade} style={styles.item} />
        )}
        <Button label="Restore Purchases" onPress={handleRestore} variant="secondary" style={styles.item} />

        {/* Account */}
        <Text style={[styles.sectionLabel, { marginTop: Spacing.lg }]}>ACCOUNT</Text>
        <Button label="Sign Out" onPress={signOut} variant="secondary" style={styles.item} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, paddingBottom: 40 },
  sectionLabel: { ...Typography.label, marginBottom: Spacing.sm },
  status: { ...Typography.body, marginBottom: Spacing.md, color: Colors.textPrimary, fontWeight: '600' },
  item: { marginBottom: Spacing.sm },
  codeBox: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  codeLabel: { ...Typography.caption, color: Colors.textMuted, marginBottom: Spacing.xs },
  code: { fontSize: 32, fontWeight: '700', color: Colors.primary, letterSpacing: 6, marginBottom: Spacing.xs },
  codeHint: { ...Typography.caption, color: Colors.textMuted, textAlign: 'center' },
  membersLabel: { ...Typography.subheading, marginTop: Spacing.md, marginBottom: Spacing.sm },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xs },
  memberIcon: { fontSize: 16 },
  memberText: { ...Typography.body, color: Colors.textPrimary },
  joinHint: { ...Typography.body, marginBottom: Spacing.sm },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 4,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
});
