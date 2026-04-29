import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ScanButtons } from '@/components/fridge/ScanButtons';
import { RecipeCard } from '@/components/recipes/RecipeCard';
import { SignUpModal } from '@/components/SignUpModal';
import { useFridge } from '@/hooks/useFridge';
import { useRecipes } from '@/hooks/useRecipes';
import { Colors, Spacing, Typography } from '@/constants/theme';
import type { NewFridgeItem } from '@/hooks/useFridge';

export default function ScanPreviewScreen() {
  const router = useRouter();
  const { items, addItem } = useFridge();
  const { recipes, loading: recipesLoading, fetchRecipes } = useRecipes(items, false);
  const [scanned, setScanned] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Fetch recipes after items state has updated (avoids stale closure on fetchRecipes)
  useEffect(() => {
    if (!scanned || items.length === 0) return;
    fetchRecipes()
      .then(() => setShowModal(true))
      .catch(() => setShowModal(true));
  // Intentionally depends only on `scanned`. When scanned flips to true, React
  // has already committed the items state update. Including fetchRecipes or items
  // in deps would recreate the stale-closure bug this effect was introduced to fix.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanned]);

  const handleItemsScanned = useCallback(
    async (newItems: NewFridgeItem[]) => {
      for (const item of newItems) {
        try { await addItem(item); } catch { /* continue */ }
      }
      setScanned(true);
    },
    [addItem],
  );

  function handleSuccess() {
    setShowModal(false);
    router.replace('/(tabs)/fridge');
  }

  function handleSkip() {
    setShowModal(false);
    router.replace('/(tabs)/fridge');
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.heading}>Scan your fridge</Text>
        <Text style={styles.sub}>Point your camera at your fridge or a receipt.</Text>

        {/* skipGate bypasses PremiumGate — anonymous users must be able to scan here */}
        <ScanButtons onItemsScanned={handleItemsScanned} skipGate />

        {scanned && recipesLoading && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Finding recipes for you...</Text>
          </View>
        )}

        {scanned && !recipesLoading && recipes.length > 0 && (
          <>
            <Text style={styles.recipesHeading}>Here's what you can make</Text>
            {recipes.slice(0, 3).map((recipe, i) => (
              <RecipeCard key={recipe.title ?? i} recipe={recipe} onPress={() => {}} />
            ))}
          </>
        )}
      </ScrollView>

      <SignUpModal visible={showModal} onSkip={handleSkip} onSuccess={handleSuccess} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg },
  heading: { ...Typography.heading, fontSize: 22, marginBottom: Spacing.sm },
  sub: { ...Typography.body, marginBottom: Spacing.lg, lineHeight: 20 },
  center: { alignItems: 'center', padding: Spacing.xl },
  loadingText: { ...Typography.body, marginTop: Spacing.md, color: Colors.textMuted },
  recipesHeading: { ...Typography.subheading, marginTop: Spacing.lg, marginBottom: Spacing.md },
});
