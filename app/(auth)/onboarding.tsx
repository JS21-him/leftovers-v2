import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Typography, Radius } from '@/constants/theme';
import { Button } from '@/components/ui/Button';

const DIETARY_OPTIONS = [
  { label: '🥦 Vegetarian', value: 'Vegetarian' },
  { label: '🌱 Vegan', value: 'Vegan' },
  { label: '🌾 Gluten-Free', value: 'Gluten-Free' },
  { label: '🥛 Dairy-Free', value: 'Dairy-Free' },
  { label: '🥜 Nut-Free', value: 'Nut-Free' },
  { label: '🐟 Pescatarian', value: 'Pescatarian' },
];

const HOUSEHOLD_SIZES = [1, 2, 3, 4, 5, 6];

const FEATURES = [
  { emoji: '📷', title: 'Scan your fridge', desc: 'Point your camera — we\'ll log everything instantly' },
  { emoji: '🍳', title: 'AI recipe suggestions', desc: 'Recipes built around what you already have' },
  { emoji: '🛒', title: 'Smart shopping lists', desc: 'Weekly lists generated in seconds, sorted by aisle' },
  { emoji: '👨‍👩‍👧', title: 'Share with family', desc: 'Everyone sees the same fridge in real time' },
];

type Step = 'welcome' | 'features' | 'dietary' | 'household' | 'ready';

export default function OnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('welcome');
  const [dietary, setDietary] = useState<string[]>([]);
  const [householdSize, setHouseholdSize] = useState(2);

  function toggleDietary(option: string) {
    setDietary((prev) =>
      prev.includes(option) ? prev.filter((d) => d !== option) : [...prev, option]
    );
  }

  function finish() {
    router.push({
      pathname: '/(auth)/login',
      params: { dietary: JSON.stringify(dietary), householdSize: String(householdSize) },
    });
  }

  if (step === 'welcome') {
    return (
      <View style={styles.container}>
        <Text style={styles.bigEmoji}>🧊</Text>
        <Text style={styles.title}>Welcome to Leftovers</Text>
        <Text style={styles.subtitle}>
          Stop wasting food. Cook better meals.{'\n'}Shop smarter — all from your fridge.
        </Text>
        <Button label="Let's Go" onPress={() => setStep('features')} style={styles.button} />
        <TouchableOpacity onPress={finish} style={styles.skipBtn}>
          <Text style={styles.skipText}>Already have an account? Log in</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (step === 'features') {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Here's what we do</Text>
        <Text style={styles.subtitle}>Set up takes 30 seconds.</Text>
        <View style={styles.featureList}>
          {FEATURES.map((f) => (
            <View key={f.title} style={styles.featureRow}>
              <Text style={styles.featureEmoji}>{f.emoji}</Text>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>
        <Button label="Next" onPress={() => setStep('dietary')} style={styles.button} />
      </ScrollView>
    );
  }

  if (step === 'dietary') {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.stepIndicator}>Step 1 of 2</Text>
        <Text style={styles.title}>Any dietary needs?</Text>
        <Text style={styles.subtitle}>We'll tailor recipes and shopping to match. Skip if none apply.</Text>
        <View style={styles.chipGrid}>
          {DIETARY_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              onPress={() => toggleDietary(opt.value)}
              style={[styles.chip, dietary.includes(opt.value) && styles.chipSelected]}
            >
              <Text style={[styles.chipText, dietary.includes(opt.value) && styles.chipTextSelected]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Button label="Next" onPress={() => setStep('household')} style={styles.button} />
      </ScrollView>
    );
  }

  if (step === 'household') {
    return (
      <View style={styles.container}>
        <Text style={styles.stepIndicator}>Step 2 of 2</Text>
        <Text style={styles.title}>How many people?</Text>
        <Text style={styles.subtitle}>Helps us suggest the right portions and shopping quantities.</Text>
        <View style={styles.sizeRow}>
          {HOUSEHOLD_SIZES.map((n) => (
            <TouchableOpacity
              key={n}
              onPress={() => setHouseholdSize(n)}
              style={[styles.sizeChip, householdSize === n && styles.chipSelected]}
            >
              <Text style={[styles.sizeChipText, householdSize === n && styles.chipTextSelected]}>
                {n}{n === 6 ? '+' : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.sizeLabel}>
          {householdSize === 1 ? 'Just me' : `${householdSize} people`}
        </Text>
        <Button label="See My Plan" onPress={() => setStep('ready')} style={styles.button} />
      </View>
    );
  }

  // Ready screen — shows personalised summary before signup
  const dietaryLabel = dietary.length > 0 ? dietary.join(', ') : 'No restrictions';
  return (
    <View style={styles.container}>
      <Text style={styles.bigEmoji}>✅</Text>
      <Text style={styles.title}>Your kitchen is ready</Text>
      <View style={styles.summaryBox}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryKey}>Household</Text>
          <Text style={styles.summaryVal}>{householdSize === 1 ? 'Just me' : `${householdSize} people`}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryKey}>Diet</Text>
          <Text style={styles.summaryVal}>{dietaryLabel}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryKey}>Features</Text>
          <Text style={styles.summaryVal}>Fridge scan, Recipes, Shopping</Text>
        </View>
      </View>
      <Button label="Create Free Account" onPress={finish} style={styles.button} />
      <Text style={styles.freeNote}>Free to use · No credit card required</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: Spacing.xl, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  bigEmoji: { fontSize: 72, marginBottom: Spacing.md },
  title: { ...Typography.heading, fontSize: 26, textAlign: 'center', marginBottom: Spacing.sm },
  subtitle: { ...Typography.body, textAlign: 'center', marginBottom: Spacing.xl, lineHeight: 22 },
  stepIndicator: { ...Typography.caption, color: Colors.textMuted, marginBottom: Spacing.md },
  button: { width: '100%', marginTop: Spacing.lg },
  skipBtn: { marginTop: Spacing.md, padding: Spacing.sm },
  skipText: { ...Typography.caption, color: Colors.textMuted },
  featureList: { width: '100%', marginBottom: Spacing.md },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, marginBottom: Spacing.md },
  featureEmoji: { fontSize: 28, width: 40, textAlign: 'center' },
  featureText: { flex: 1 },
  featureTitle: { ...Typography.subheading, marginBottom: 2 },
  featureDesc: { ...Typography.caption },
  chipGrid: { width: '100%', marginBottom: Spacing.sm },
  chip: {
    width: '100%',
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  chipSelected: { borderColor: Colors.primary, backgroundColor: Colors.surfaceAlt },
  chipText: { ...Typography.body, textAlign: 'center' },
  chipTextSelected: { color: Colors.primary, fontWeight: '600' },
  sizeRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  sizeChip: {
    width: 52,
    height: 52,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  sizeChipText: { ...Typography.body, fontWeight: '600' },
  sizeLabel: { ...Typography.body, color: Colors.textMuted, marginBottom: Spacing.sm },
  summaryBox: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.xs },
  summaryKey: { ...Typography.body, color: Colors.textMuted },
  summaryVal: { ...Typography.body, color: Colors.textPrimary, fontWeight: '600', flex: 1, textAlign: 'right' },
  freeNote: { ...Typography.caption, color: Colors.textMuted, marginTop: Spacing.md },
});
