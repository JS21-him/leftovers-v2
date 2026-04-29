import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';

// ─── Diet options ──────────────────────────────────────────────────────────
const DIET_OPTIONS = [
  { id: 'none',        label: 'No restrictions', emoji: '🍽' },
  { id: 'vegetarian',  label: 'Vegetarian',       emoji: '🥗' },
  { id: 'vegan',       label: 'Vegan',            emoji: '🌱' },
  { id: 'keto',        label: 'Keto',             emoji: '🥑' },
  { id: 'gluten-free', label: 'Gluten-Free',      emoji: '🌾' },
  { id: 'dairy-free',  label: 'Dairy-Free',       emoji: '🥛' },
  { id: 'halal',       label: 'Halal',            emoji: '🌙' },
  { id: 'kosher',      label: 'Kosher',           emoji: '✡' },
];

const HOUSEHOLD_SIZES = ['1', '2', '3', '4', '5', '6+'];

type Step = 'welcome' | 'preferences' | 'scan';

export default function OnboardingScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const [step, setStep] = useState<Step>('welcome');
  const [selectedDiets, setSelectedDiets] = useState<string[]>([]);
  const [householdSize, setHouseholdSize] = useState<string>('2');
  const [loading, setLoading] = useState(false);

  // ── Diet toggle ──────────────────────────────────────────────────────────
  function toggleDiet(id: string) {
    if (id === 'none') {
      setSelectedDiets([]);
      return;
    }
    setSelectedDiets((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id],
    );
  }

  // ── Anonymous auth + persist prefs ──────────────────────────────────────
  async function signInAndSavePrefs(): Promise<boolean> {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) {
      showToast({ message: error.message, type: 'error' });
      return false;
    }
    if (data.user) {
      const sizeNum = householdSize === '6+' ? 6 : parseInt(householdSize, 10);
      await supabase.from('profiles').upsert({
        id: data.user.id,
        dietary_preferences: selectedDiets,
        household_size: sizeNum,
      });
    }
    return true;
  }

  async function handleScanStart() {
    setLoading(true);
    try {
      const ok = await signInAndSavePrefs();
      if (ok) router.replace('/scan-preview');
    } catch (e) {
      showToast({ message: e instanceof Error ? e.message : 'Something went wrong. Please try again.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  async function handleSkipToFridge() {
    setLoading(true);
    try {
      const ok = await signInAndSavePrefs();
      if (ok) router.replace('/(tabs)/fridge');
    } catch (e) {
      showToast({ message: e instanceof Error ? e.message : 'Something went wrong. Please try again.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  // ── Step: Welcome ────────────────────────────────────────────────────────
  if (step === 'welcome') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Logo size="lg" />

          <Text style={styles.headline}>Stop wasting food.{'\n'}Start cooking smarter.</Text>
          <Text style={styles.sub}>
            Scan your fridge and get instant recipe ideas for what you already have.
          </Text>

          <Button
            label="Get Started"
            onPress={() => setStep('preferences')}
            style={styles.cta}
          />
          <TouchableOpacity
            onPress={() => router.push('/(auth)/login')}
            style={styles.secondaryBtn}
          >
            <Text style={styles.secondaryText}>I already have an account</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Step: Preferences ────────────────────────────────────────────────────
  if (step === 'preferences') {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Progress dots */}
          <View style={styles.progress}>
            <View style={[styles.dot, styles.dotActive]} />
            <View style={[styles.dot, styles.dotInactive]} />
          </View>

          <Text style={styles.stepHeading}>Any dietary{'\n'}preferences?</Text>
          <Text style={styles.stepSub}>We'll tailor every recipe to match. Pick all that apply.</Text>

          {/* Diet grid */}
          <View style={styles.grid}>
            {DIET_OPTIONS.map((opt) => {
              const active = opt.id === 'none'
                ? selectedDiets.length === 0
                : selectedDiets.includes(opt.id);
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => toggleDiet(opt.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.chipEmoji}>{opt.emoji}</Text>
                  <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Household size */}
          <Text style={[styles.stepHeading, { fontSize: 20, marginTop: Spacing.xl }]}>
            Cooking for how many?
          </Text>
          <View style={styles.sizeRow}>
            {HOUSEHOLD_SIZES.map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.sizeChip, householdSize === s && styles.sizeChipActive]}
                onPress={() => setHouseholdSize(s)}
                activeOpacity={0.7}
              >
                <Text style={[styles.sizeLabel, householdSize === s && styles.sizeLabelActive]}>
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Button
            label="Continue"
            onPress={() => setStep('scan')}
            style={styles.cta}
          />
          <TouchableOpacity style={styles.backBtn} onPress={() => setStep('welcome')}>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Step: Scan ────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.centerContent}>
        {/* Progress dots */}
        <View style={styles.progress}>
          <View style={[styles.dot, styles.dotInactive]} />
          <View style={[styles.dot, styles.dotActive]} />
        </View>

        <Text style={styles.bigEmoji}>📷</Text>
        <Text style={styles.stepHeading}>Scan your fridge</Text>
        <Text style={styles.stepSub}>
          Point your camera at your fridge or a grocery receipt. Our AI reads it instantly.
        </Text>

        <Button
          label={loading ? 'Starting...' : 'Scan My Fridge'}
          onPress={handleScanStart}
          loading={loading}
          style={styles.cta}
        />

        <TouchableOpacity style={styles.secondaryBtn} onPress={handleSkipToFridge} disabled={loading}>
          <Text style={styles.secondaryText}>Add items manually instead</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.backBtn} onPress={() => setStep('preferences')}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },

  // Progress
  progress: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: Spacing.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: { backgroundColor: Colors.primary },
  dotInactive: { backgroundColor: Colors.border },

  // Welcome
  headline: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 36,
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  sub: {
    ...Typography.body,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
    color: Colors.textMuted,
  },

  // Steps
  stepHeading: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 34,
    marginBottom: Spacing.sm,
  },
  stepSub: {
    ...Typography.body,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
    color: Colors.textMuted,
  },

  // Diet grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipEmoji: { fontSize: 16 },
  chipLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  chipLabelActive: { color: '#fff' },

  // Household size
  sizeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  sizeChip: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  sizeLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  sizeLabelActive: { color: '#fff' },

  // Buttons
  cta: { width: '100%', marginBottom: Spacing.md },
  bigEmoji: { fontSize: 64, marginBottom: Spacing.lg },
  secondaryBtn: { padding: Spacing.sm, marginBottom: Spacing.sm },
  secondaryText: { ...Typography.body, color: Colors.textMuted, fontWeight: '600' },
  backBtn: { padding: Spacing.sm, marginTop: Spacing.xs },
  backText: { ...Typography.caption, color: Colors.textMuted },
});
