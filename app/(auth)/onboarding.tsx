import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Typography, Radius } from '@/constants/theme';
import { Button } from '@/components/ui/Button';

const DIETARY_OPTIONS = ['Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Nut-Free'];
const HOUSEHOLD_SIZES = [1, 2, 3, 4, 5, 6];

export default function OnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState<'welcome' | 'preferences' | 'household'>('welcome');
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
        <Text style={styles.emoji}>🧊</Text>
        <Text style={styles.title}>Welcome to Leftovers</Text>
        <Text style={styles.subtitle}>
          Your AI-powered kitchen assistant. Know what's in your fridge, get great recipes, and order
          groceries — effortlessly.
        </Text>
        <Button label="Get Started" onPress={() => setStep('preferences')} style={styles.button} />
      </View>
    );
  }

  if (step === 'preferences') {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Any dietary needs?</Text>
        <Text style={styles.subtitle}>We'll tailor recipes and shopping to match.</Text>
        {DIETARY_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt}
            onPress={() => toggleDietary(opt)}
            style={[styles.chip, dietary.includes(opt) && styles.chipSelected]}
          >
            <Text style={[styles.chipText, dietary.includes(opt) && styles.chipTextSelected]}>{opt}</Text>
          </TouchableOpacity>
        ))}
        <Button label="Next" onPress={() => setStep('household')} style={styles.button} />
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Household size?</Text>
      <Text style={styles.subtitle}>Helps us suggest the right portions.</Text>
      <View style={styles.row}>
        {HOUSEHOLD_SIZES.map((n) => (
          <TouchableOpacity
            key={n}
            onPress={() => setHouseholdSize(n)}
            style={[styles.sizeChip, householdSize === n && styles.chipSelected]}
          >
            <Text style={[styles.chipText, householdSize === n && styles.chipTextSelected]}>{n}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Button label="Continue" onPress={finish} style={styles.button} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: Spacing.xl, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 64, marginBottom: Spacing.md },
  title: { ...Typography.heading, fontSize: 26, textAlign: 'center', marginBottom: Spacing.sm },
  subtitle: { ...Typography.body, textAlign: 'center', marginBottom: Spacing.xl, lineHeight: 22 },
  button: { width: '100%', marginTop: Spacing.lg },
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
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, justifyContent: 'center', marginBottom: Spacing.lg },
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
});
