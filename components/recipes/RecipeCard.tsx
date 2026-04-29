import React, { useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeInDown,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { hapticLight } from '@/lib/haptics';
import type { Recipe } from '@/lib/claude';

interface Props {
  recipe: Recipe;
  onPress: () => void;
  index?: number;
}

function RecipeCardComponent({ recipe, onPress, index = 0 }: Props) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const tap = Gesture.Tap()
    .maxDuration(500)
    .onBegin(() => {
      scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
    })
    .onFinalize(() => {
      scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    })
    .onEnd(() => {
      hapticLight();
      onPress();
    });

  const itemsYouHave = recipe.ingredients.filter((i) => i.have).length;
  const missing = recipe.ingredients.length - itemsYouHave;
  const oneAway = missing === 1;

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).springify().damping(16)}
      style={animStyle}
    >
      <GestureDetector gesture={tap}>
        <View style={styles.card}>
          <View style={styles.emojiBox}>
            <Text style={styles.emoji}>{recipe.emoji}</Text>
          </View>
          <View style={styles.info}>
            <View style={styles.titleRow}>
              <Text style={styles.title} numberOfLines={1}>
                {recipe.title}
              </Text>
              {oneAway && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>1 away</Text>
                </View>
              )}
            </View>
            <Text style={styles.meta}>
              {missing === 0
                ? 'You have everything!'
                : `Missing ${missing} ingredient${missing > 1 ? 's' : ''}`}
            </Text>
            <View style={styles.tags}>
              <Text style={styles.tag}>⏱ {recipe.cook_time_minutes} min</Text>
              <Text style={styles.tag}>{recipe.difficulty}</Text>
            </View>
          </View>
        </View>
      </GestureDetector>
    </Animated.View>
  );
}

export const RecipeCard = React.memo(RecipeCardComponent);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  emojiBox: {
    width: 80,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: Colors.border,
  },
  emoji: { fontSize: 34 },
  info: { flex: 1, padding: Spacing.md },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: 3,
  },
  title: { ...Typography.subheading, flex: 1, fontSize: 15 },
  badge: {
    backgroundColor: Colors.success,
    borderRadius: Radius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: { fontSize: 9, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
  meta: { ...Typography.caption, marginBottom: Spacing.xs, color: Colors.textMuted },
  tags: { flexDirection: 'row', gap: Spacing.sm },
  tag: { fontSize: 11, color: Colors.primary, fontWeight: '600' },
});
