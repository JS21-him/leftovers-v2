import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import type { Recipe } from '@/lib/claude';

interface Props {
  recipe: Recipe;
  onPress: () => void;
}

export function RecipeCard({ recipe, onPress }: Props) {
  const itemsYouHave = recipe.ingredients.filter((i) => i.have).length;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.emojiBox}>
        <Text style={styles.emoji}>{recipe.emoji}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.title}>{recipe.title}</Text>
        <Text style={styles.meta}>
          Uses {itemsYouHave}/{recipe.ingredients.length} items you have
        </Text>
        <View style={styles.tags}>
          <Text style={styles.tag}>⏱ {recipe.cook_time_minutes} min</Text>
          <Text style={styles.tag}>{recipe.difficulty}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  emojiBox: {
    width: 80,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 32 },
  info: { flex: 1, padding: Spacing.md },
  title: { ...Typography.subheading, marginBottom: 2 },
  meta: { ...Typography.caption, marginBottom: Spacing.xs },
  tags: { flexDirection: 'row', gap: Spacing.sm },
  tag: { fontSize: 11, color: Colors.primary, fontWeight: '600' },
});
