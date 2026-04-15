import React from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Colors, Spacing, Typography, Radius } from '@/constants/theme';
import { Header } from '@/components/ui/Header';
import type { Recipe } from '@/lib/claude';

export default function RecipeDetailScreen() {
  const { recipe: recipeJson } = useLocalSearchParams<{ recipe: string }>();
  let recipe: Recipe | null = null;
  try {
    recipe = recipeJson ? JSON.parse(recipeJson) : null;
  } catch {
    recipe = null;
  }

  if (!recipe) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Recipe" showSettings={false} />
        <View style={styles.center}>
          <Text style={Typography.body}>Recipe not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title={recipe.title} showSettings={false} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.emoji}>{recipe.emoji}</Text>
        <View style={styles.tags}>
          <Text style={styles.tag}>⏱ {recipe.cook_time_minutes} min</Text>
          <Text style={styles.tag}>{recipe.difficulty}</Text>
        </View>

        <Text style={styles.sectionTitle}>Ingredients</Text>
        {recipe.ingredients.map((ing, i) => (
          <View key={`ing-${i}-${ing.name}`} style={styles.ingredient}>
            <Text style={[styles.ingredientDot, { color: ing.have ? Colors.success : Colors.textMuted }]}>
              {ing.have ? '✓' : '○'}
            </Text>
            <Text style={[styles.ingredientName, !ing.have && styles.missing]}>{ing.name}</Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Instructions</Text>
        {recipe.instructions.map((step, i) => (
          <View key={`step-${i}`} style={styles.step}>
            <View style={styles.stepNumBox}>
              <Text style={styles.stepNum}>{i + 1}</Text>
            </View>
            <Text style={styles.stepText}>{step}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 56, textAlign: 'center', marginVertical: Spacing.md },
  tags: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.md, marginBottom: Spacing.lg },
  tag: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  sectionTitle: { ...Typography.subheading, marginBottom: Spacing.sm, marginTop: Spacing.md },
  ingredient: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.xs, gap: Spacing.sm },
  ingredientDot: { fontSize: 16, width: 20 },
  ingredientName: { ...Typography.body, color: Colors.textPrimary },
  missing: { color: Colors.textMuted },
  step: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  stepNumBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepNum: { color: '#fff', fontWeight: '700', fontSize: 12 },
  stepText: { ...Typography.body, flex: 1, lineHeight: 22 },
});
