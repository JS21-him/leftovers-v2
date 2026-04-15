import React, { useEffect } from 'react';
import { View, FlatList, StyleSheet, SafeAreaView, Text } from 'react-native';
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Recipes" />
        <View style={styles.center}>
          <Text style={Typography.body}>Finding recipes for your fridge...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Recipes" />
      {error ? (
        <EmptyState
          icon="⚠️"
          title="Something went wrong"
          message={error}
          actionLabel="Try Again"
          onAction={fetchRecipes}
        />
      ) : recipes.length === 0 ? (
        <EmptyState
          icon="🍳"
          title="No recipes yet"
          message="Add items to your fridge and we'll suggest recipes for you."
          actionLabel="Go to Fridge"
          onAction={() => router.push('/(tabs)/fridge')}
        />
      ) : (
        <FlatList
          data={suggestion ? recipes.slice(1) : recipes}
          keyExtractor={(item) => item.title}
          ListHeaderComponent={
            suggestion ? (
              <AISuggestionBanner recipe={suggestion} onPress={() => openRecipe(suggestion, 0)} />
            ) : null
          }
          renderItem={({ item, index }) => (
            <RecipeCard recipe={item} onPress={() => openRecipe(item, suggestion ? index + 1 : index)} />
          )}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  list: { padding: Spacing.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
