import React, { useEffect, useCallback } from 'react';
import {
  View, FlatList, StyleSheet, SafeAreaView, Text, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Header } from '@/components/ui/Header';
import { EmptyState } from '@/components/ui/EmptyState';
import { RecipeCard } from '@/components/recipes/RecipeCard';
import { AISuggestionBanner } from '@/components/recipes/AISuggestionBanner';
import { useFridge } from '@/hooks/useFridge';
import { useRecipes } from '@/hooks/useRecipes';
import { useSubscription } from '@/hooks/useSubscription';
import { Colors, Spacing, Typography } from '@/constants/theme';
import type { Recipe } from '@/lib/claude';

export default function RecipesScreen() {
  const router = useRouter();
  const { items: fridgeItems, getExpiringSoon } = useFridge();
  const { isPremium } = useSubscription();
  const { recipes, loading, error, fetchRecipes } = useRecipes(fridgeItems, isPremium);

  useEffect(() => { fetchRecipes(); }, [fetchRecipes]);

  const expiringSoon = getExpiringSoon(5);
  const suggestion = expiringSoon.length > 0 && recipes.length > 0 ? recipes[0] : null;

  function openRecipe(recipe: Recipe, index: number) {
    router.push({
      pathname: '/recipe/[id]',
      params: { id: String(index), recipe: JSON.stringify(recipe) },
    });
  }

  const handleRefresh = useCallback(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Recipes" />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Finding recipes for your fridge...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Recipes" />
        <EmptyState
          icon="⚠️"
          title="Something went wrong"
          message={error}
          actionLabel="Try Again"
          onAction={handleRefresh}
        />
      </SafeAreaView>
    );
  }

  // ── No fridge items ───────────────────────────────────────────────────────
  if (fridgeItems.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Recipes" />
        <EmptyState
          icon="🍳"
          title="Your fridge is empty"
          message="Add items to your fridge and we'll suggest recipes tailored to what you have."
          actionLabel="Go to Fridge"
          onAction={() => router.push('/(tabs)/fridge')}
        />
      </SafeAreaView>
    );
  }

  // ── No recipes generated yet ──────────────────────────────────────────────
  if (recipes.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Recipes" />
        <EmptyState
          icon="🍳"
          title="No recipes yet"
          message="Tap the button below to generate recipes from your fridge."
          actionLabel="Generate Recipes"
          onAction={handleRefresh}
        />
      </SafeAreaView>
    );
  }

  // ── Recipe list ───────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <Header title="Recipes" />

      <FlatList
        data={suggestion ? recipes.slice(1) : recipes}
        keyExtractor={(item) => item.title}
        ListHeaderComponent={
          <>
            {suggestion && (
              <AISuggestionBanner
                recipe={suggestion}
                onPress={() => openRecipe(suggestion, 0)}
              />
            )}
            <View style={styles.refreshRow}>
              <Text style={styles.countLabel}>
                {recipes.length} recipe{recipes.length !== 1 ? 's' : ''} from your fridge
              </Text>
              <TouchableOpacity onPress={handleRefresh} style={styles.refreshBtn} activeOpacity={0.7}>
                <Text style={styles.refreshText}>Refresh ↺</Text>
              </TouchableOpacity>
            </View>
          </>
        }
        renderItem={({ item, index }) => (
          <RecipeCard
            recipe={item}
            onPress={() => openRecipe(item, suggestion ? index + 1 : index)}
          />
        )}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  list: { padding: Spacing.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  loadingText: { ...Typography.body, color: Colors.textMuted, textAlign: 'center' },
  refreshRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  countLabel: { ...Typography.caption, color: Colors.textMuted },
  refreshBtn: { padding: 4 },
  refreshText: { ...Typography.caption, color: Colors.primary, fontWeight: '700' },
});
