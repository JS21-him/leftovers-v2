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
  const missing = recipe.ingredients.length - itemsYouHave;
  const oneAway = missing === 1;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.emojiBox}>
        <Text style={styles.emoji}>{recipe.emoji}</Text>
      </View>
      <View style={styles.info}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>{recipe.title}</Text>
          {oneAway && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>1 away</Text>
            </View>
          )}
        </View>
        <Text style={styles.meta}>
          {missing === 0 ? 'You have everything!' : `Missing ${missing} ingredient${missing > 1 ? 's' : ''}`}
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  emojiBox: {
    width: 80,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 32 },
  info: { flex: 1, padding: Spacing.md },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: 2 },
  title: { ...Typography.subheading, flex: 1 },
  badge: {
    backgroundColor: Colors.success,
    borderRadius: Radius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  meta: { ...Typography.caption, marginBottom: Spacing.xs },
  tags: { flexDirection: 'row', gap: Spacing.sm },
  tag: { fontSize: 11, color: Colors.primary, fontWeight: '600' },
});
