import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Spacing, Typography, Radius } from '@/constants/theme';
import { Header } from '@/components/ui/Header';
import { Button } from '@/components/ui/Button';
import { useShopping } from '@/hooks/useShopping';
import type { Recipe } from '@/lib/claude';

export default function RecipeDetailScreen() {
  const { recipe: recipeJson } = useLocalSearchParams<{ recipe: string }>();
  const router = useRouter();
  const { addItem } = useShopping();
  const [addingToCart, setAddingToCart] = useState(false);

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

  const missingIngredients = recipe.ingredients.filter((i) => !i.have);

  async function handleAddMissingToCart() {
    if (missingIngredients.length === 0) return;
    setAddingToCart(true);
    try {
      for (const ing of missingIngredients) {
        await addItem(ing.name, 1, '');
      }
      Alert.alert(
        'Added to cart!',
        `${missingIngredients.length} ingredient${missingIngredients.length > 1 ? 's' : ''} added to your shopping list.`,
        [
          { text: 'View List', onPress: () => router.push('/(tabs)/shopping') },
          { text: 'Stay here', style: 'cancel' },
        ],
      );
    } catch {
      Alert.alert('Error', 'Could not add items to your list. Please try again.');
    } finally {
      setAddingToCart(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title={recipe.title} showSettings={false} />
      <ScrollView contentContainerStyle={styles.content}>

        {/* Hero */}
        <Text style={styles.emoji}>{recipe.emoji}</Text>
        <View style={styles.tags}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>⏱ {recipe.cook_time_minutes} min</Text>
          </View>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{recipe.difficulty}</Text>
          </View>
        </View>

        {/* Add missing to cart — shown only when there are missing ingredients */}
        {missingIngredients.length > 0 && (
          <View style={styles.cartBanner}>
            <Text style={styles.cartBannerText}>
              Missing {missingIngredients.length} ingredient{missingIngredients.length > 1 ? 's' : ''}
            </Text>
            <Button
              label={addingToCart ? 'Adding...' : `Add ${missingIngredients.length} to cart`}
              onPress={handleAddMissingToCart}
              loading={addingToCart}
              style={styles.cartButton}
            />
          </View>
        )}

        {missingIngredients.length === 0 && (
          <View style={styles.readyBanner}>
            <Text style={styles.readyText}>You have everything - let's cook!</Text>
          </View>
        )}

        {/* Ingredients */}
        <Text style={styles.sectionTitle}>Ingredients</Text>
        {recipe.ingredients.map((ing, i) => (
          <View key={`ing-${i}-${ing.name}`} style={styles.ingredient}>
            <View style={[styles.ingredientDot, { backgroundColor: ing.have ? Colors.success : Colors.border }]}>
              <Text style={styles.ingredientDotText}>{ing.have ? '✓' : '+'}</Text>
            </View>
            <Text style={[styles.ingredientName, !ing.have && styles.missing]}>
              {ing.name}
            </Text>
            {!ing.have && <Text style={styles.needToBuy}>need to buy</Text>}
          </View>
        ))}

        {/* Instructions */}
        <Text style={styles.sectionTitle}>Instructions</Text>
        {recipe.instructions.map((step, i) => (
          <View key={`step-${i}`} style={styles.step}>
            <View style={styles.stepNumBox}>
              <Text style={styles.stepNum}>{i + 1}</Text>
            </View>
            <Text style={styles.stepText}>{step}</Text>
          </View>
        ))}

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Hero
  emoji: { fontSize: 56, textAlign: 'center', marginVertical: Spacing.md },
  tags: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  tag: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.full,
    paddingVertical: 4,
    paddingHorizontal: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tagText: { fontSize: 13, color: Colors.primary, fontWeight: '600' },

  // Cart banner
  cartBanner: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    alignItems: 'center',
  },
  cartBannerText: {
    ...Typography.body,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
    fontWeight: '600',
  },
  cartButton: { minWidth: 180 },

  // Ready banner
  readyBanner: {
    backgroundColor: '#dcfce7',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#86efac',
  },
  readyText: {
    color: '#166534',
    fontWeight: '700',
    fontSize: 14,
  },

  // Ingredients
  sectionTitle: { ...Typography.subheading, marginBottom: Spacing.sm, marginTop: Spacing.md },
  ingredient: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  ingredientDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  ingredientDotText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  ingredientName: { ...Typography.body, color: Colors.textPrimary, flex: 1 },
  missing: { color: Colors.textMuted },
  needToBuy: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  // Instructions
  step: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  stepNumBox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  stepNum: { color: '#fff', fontWeight: '700', fontSize: 12 },
  stepText: { ...Typography.body, flex: 1, lineHeight: 22, color: Colors.textPrimary },
});
