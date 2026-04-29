import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, Alert, ScrollView, Share, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/ui/Header';
import { Colors, Spacing, Typography, Radius } from '@/constants/theme';
import { purchasePremium, restorePurchases } from '@/lib/purchases';
import { useSubscription } from '@/hooks/useSubscription';
import { useHousehold } from '@/hooks/useHousehold';

const DIET_OPTIONS = [
  { id: 'vegetarian', label: 'Vegetarian' },
  { id: 'vegan', label: 'Vegan' },
  { id: 'keto', label: 'Keto' },
  { id: 'gluten-free', label: 'Gluten-Free' },
  { id: 'dairy-free', label: 'Dairy-Free' },
  { id: 'halal', label: 'Halal' },
  { id: 'kosher', label: 'Kosher' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { isPremium, refetch } = useSubscription();
  const { household, members, loading: householdLoading, joinByCode, refreshInviteCode } = useHousehold();
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [selectedDiets, setSelectedDiets] = useState<string[]>([]);
  const [prefsLoaded, setPrefsLoaded] = useState(false);

  // Load existing prefs once
  React.useEffect(() => {
    if (prefsLoaded) return;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('dietary_preferences')
        .eq('id', user.id)
        .maybeSingle();
      setSelectedDiets(data?.dietary_preferences ?? []);
      setPrefsLoaded(true);
    })();
  }, [prefsLoaded]);

  function toggleDiet(id: string) {
    setSelectedDiets((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id],
    );
  }

  async function savePreferences() {
    setSavingPrefs(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('profiles').upsert({ id: user.id, dietary_preferences: selectedDiets });
    }
    setSavingPrefs(false);
    Alert.alert('Saved', 'Your preferences have been updated. Recipes will reflect these next time.');
  }

  async function signOut() {
    await supabase.auth.signOut();
    // Send to onboarding so new users start fresh, not the login screen
    router.replace('/(auth)/onboarding');
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
      "The old code will stop working. Anyone who hasn't joined yet will need the new code.",
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
      ],
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Settings" showSettings={false} />
      <ScrollView contentContainerStyle={styles.content}>

        {/* Subscription */}
        <Text style={styles.sectionLabel}>SUBSCRIPTION</Text>
        <View style={styles.card}>
          <Text style={styles.statusText}>
            {isPremium ? '✨ Premium - Active' : 'Free Plan'}
          </Text>
          {!isPremium && (
            <Text style={styles.upgradeHint}>
              Unlock AI scanning, unlimited recipes, and the weekly list builder.
            </Text>
          )}
        </View>
        {!isPremium && (
          <Button label="Upgrade to Premium" onPress={handleUpgrade} style={styles.item} />
        )}
        <Button label="Restore Purchases" onPress={handleRestore} variant="secondary" style={styles.item} />

        {/* Dietary Preferences */}
        <Text style={[styles.sectionLabel, { marginTop: Spacing.lg }]}>DIETARY PREFERENCES</Text>
        <Text style={styles.hint}>Your preferences are used to tailor recipe suggestions.</Text>
        <View style={styles.dietGrid}>
          {DIET_OPTIONS.map((opt) => {
            const active = selectedDiets.includes(opt.id);
            return (
              <Button
                key={opt.id}
                label={opt.label}
                onPress={() => toggleDiet(opt.id)}
                variant={active ? 'primary' : 'secondary'}
                style={styles.dietChip}
              />
            );
          })}
        </View>
        <Button
          label={savingPrefs ? 'Saving...' : 'Save Preferences'}
          onPress={savePreferences}
          loading={savingPrefs}
          style={styles.item}
        />

        {/* Household */}
        <Text style={[styles.sectionLabel, { marginTop: Spacing.lg }]}>HOUSEHOLD</Text>
        {householdLoading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginBottom: Spacing.md }} />
        ) : household ? (
          <>
            <View style={styles.codeBox}>
              <Text style={styles.codeLabel}>Your invite code</Text>
              <Text style={styles.code}>{household.invite_code}</Text>
              <Text style={styles.codeHint}>Share this so family members can join your fridge</Text>
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
        <Text style={styles.hint}>Have a code from a family member? Enter it below.</Text>
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

        {/* Account */}
        <Text style={[styles.sectionLabel, { marginTop: Spacing.lg }]}>ACCOUNT</Text>
        <Button label="Sign Out" onPress={signOut} variant="secondary" style={styles.item} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, paddingBottom: 60 },
  sectionLabel: { ...Typography.label, marginBottom: Spacing.sm },
  hint: { ...Typography.body, marginBottom: Spacing.sm, color: Colors.textMuted },
  item: { marginBottom: Spacing.sm },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  statusText: { ...Typography.subheading, marginBottom: 4 },
  upgradeHint: { ...Typography.caption, color: Colors.textMuted },

  // Diet grid
  dietGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  dietChip: { paddingHorizontal: Spacing.sm },

  // Household
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
