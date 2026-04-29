import React, { useEffect, useCallback, useMemo } from 'react';
import { View, FlatList, StyleSheet, SafeAreaView, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Header } from '@/components/ui/Header';
import { EmptyState } from '@/components/ui/EmptyState';
import { RecipeCard } from '@/components/recipes/RecipeCard';
import { AISuggestionBanner } from '@/components/recipes/AISuggestionBanner';
import { RecipesSkeleton } from '@/components/ui/Skeleton';
import { useFridge } from '@/hooks/useFridge';
import { useRecipes } from '@/hooks/useRecipes';
import { useSubscription } from '@/hooks/useSubscription';
import { useToast } from '@/components/ui/Toast';
import { Colors, Spacing, Typography } from '@/constants/theme';
import type { Recipe } from '@/lib/claude';

export default function RecipesScreen() {
  const router = useRouter();
  const { items: fridgeItems, getExpiringSoon } = useFridge();
  const { isPremium } = useSubscription();
  const { recipes, loading, error, fetchRecipes } = useRecipes(fridgeItems, isPremium);
  const { showToast } = useToast();

  useEffect(() => { fetchRecipes(); }, [fetchRecipes]);

  const expiringSoon = useMemo(() => getExpiringSoon(5), [fridgeItems]);
  const suggestion = useMemo(
    () => (expiringSoon.length > 0 && recipes.length > 0 ? recipes[0] : null),
    [expiringSoon, recipes],
  );
  const remainingRecipes = useMemo(
    () => (suggestion ? recipes.slice(1) : recipes),
    [suggestion, recipes],
  );

  const openRecipe = useCallback((recipe: Recipe, index: number) => {
    router.push({
      pathname: '/recipe/[id]',
      params: { id: String(index), recipe: JSON.stringify(recipe) },
    });
  }, [router]);

  const handleRefresh = useCallback(async () => {
    try {
      await fetchRecipes();
    } catch {
      showToast({ message: 'Could not load recipes. Please try again.', type: 'error' });
    }
  }, [fetchRecipes, showToast]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Recipes" />
        <RecipesSkeleton />
      </SafeAreaView>
    );
  }

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

  if (fridgeItems.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Recipes" />
        <EmptyState
          icon="🍳"
          title="Your fridge is empty"
          message="Add items to your fridge to get recipe suggestions tailored to what you have."
          actionLabel="Go to Fridge"
          onAction={() => router.push('/(tabs)/fridge')}
        />
      </SafeAreaView>
    );
  }

  if (recipes.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Recipes" />
        <EmptyState
          icon="🍳"
          title="No recipes yet"
          message="Tap below to generate recipes from your fridge."
          actionLabel="Generate Recipes"
          onAction={handleRefresh}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Recipes" />
      <FlatList
        data={remainingRecipes}
        keyExtractor={(item) => item.title}
        showsVerticalScrollIndicator={false}
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
                {recipes.length} recipe{recipes.length !== 1 ? 's' : ''} for your fridge
              </Text>
              <TouchableOpacity onPress={handleRefresh} activeOpacity={0.7}>
                <Text style={styles.refreshText}>Refresh ↺</Text>
              </TouchableOpacity>
            </View>
          </>
        }
        renderItem={({ item, index }) => (
          <RecipeCard
            recipe={item}
            onPress={() => openRecipe(item, suggestion ? index + 1 : index)}
            index={index}
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
  refreshRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  countLabel: { ...Typography.caption, color: Colors.textMuted },
  refreshText: { ...Typography.caption, color: Colors.primary, fontWeight: '700' },
});
