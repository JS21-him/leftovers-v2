import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Radius, Spacing } from '@/constants/theme';
import type { Recipe } from '@/lib/claude';

interface Props {
  recipe: Recipe;
  onPress: () => void;
}

export function AISuggestionBanner({ recipe, onPress }: Props) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.wrapper}>
      <LinearGradient
        colors={['#f97316', '#ea580c']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.banner}
      >
        <Text style={styles.label}>🤖 AI SUGGESTION</Text>
        <Text style={styles.title}>{recipe.title}</Text>
        <Text style={styles.sub}>Perfect for your expiring ingredients</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    margin: Spacing.md,
    marginBottom: 0,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  banner: {
    padding: Spacing.md,
  },
  label: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.8)', letterSpacing: 1, marginBottom: 4 },
  title: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 2 },
  sub: { fontSize: 12, color: 'rgba(255,255,255,0.85)' },
});
