/**
 * Skeleton loading placeholders.
 * Uses Reanimated to pulse on the UI thread — zero JS overhead.
 */
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Colors, Radius, Spacing } from '@/constants/theme';

function SkeletonBox({
  width,
  height,
  borderRadius = Radius.sm,
  style,
}: {
  width?: number | string;
  height: number;
  borderRadius?: number;
  style?: object;
}) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.35, { duration: 700 }),
        withTiming(1, { duration: 700 }),
      ),
      -1,
      true,
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        {
          width: width ?? '100%',
          height,
          borderRadius,
          backgroundColor: Colors.border,
        },
        animStyle,
        style,
      ]}
    />
  );
}

/** Skeleton for a single fridge item row */
export function FridgeItemSkeleton() {
  return (
    <View style={styles.fridgeRow}>
      <View style={styles.fridgeInfo}>
        <SkeletonBox height={14} width="60%" borderRadius={6} />
        <SkeletonBox height={10} width="30%" borderRadius={6} style={{ marginTop: 6 }} />
      </View>
      <SkeletonBox height={12} width={32} borderRadius={6} />
    </View>
  );
}

/** Full fridge loading screen */
export function FridgeSkeleton() {
  return (
    <View style={styles.container}>
      <SkeletonBox height={11} width={100} borderRadius={6} style={{ marginBottom: Spacing.sm }} />
      {[1, 2, 3].map((i) => (
        <FridgeItemSkeleton key={i} />
      ))}
      <SkeletonBox height={11} width={80} borderRadius={6} style={{ marginTop: Spacing.md, marginBottom: Spacing.sm }} />
      {[4, 5, 6, 7].map((i) => (
        <FridgeItemSkeleton key={i} />
      ))}
    </View>
  );
}

/** Skeleton for a recipe card */
export function RecipeCardSkeleton() {
  return (
    <View style={styles.recipeCard}>
      <SkeletonBox width={80} height={80} borderRadius={0} />
      <View style={styles.recipeInfo}>
        <SkeletonBox height={14} width="70%" borderRadius={6} />
        <SkeletonBox height={10} width="50%" borderRadius={6} style={{ marginTop: 6 }} />
        <View style={styles.recipeTags}>
          <SkeletonBox height={10} width={60} borderRadius={6} />
          <SkeletonBox height={10} width={50} borderRadius={6} />
        </View>
      </View>
    </View>
  );
}

/** Full recipes loading screen */
export function RecipesSkeleton() {
  return (
    <View style={styles.container}>
      {/* Banner skeleton */}
      <SkeletonBox height={80} borderRadius={Radius.lg} style={{ marginBottom: Spacing.md }} />
      {[1, 2, 3, 4].map((i) => (
        <RecipeCardSkeleton key={i} />
      ))}
    </View>
  );
}

/** Skeleton for a shopping item */
export function ShoppingItemSkeleton() {
  return (
    <View style={styles.shoppingRow}>
      <SkeletonBox width={20} height={20} borderRadius={4} />
      <SkeletonBox height={13} width="55%" borderRadius={6} />
    </View>
  );
}

/** Full shopping loading screen */
export function ShoppingSkeleton() {
  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5].map((i) => (
        <ShoppingItemSkeleton key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm },
  fridgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.xs,
    borderLeftWidth: 4,
    borderLeftColor: Colors.border,
    gap: Spacing.sm,
  },
  fridgeInfo: { flex: 1, gap: 6 },
  recipeCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
    height: 80,
  },
  recipeInfo: {
    flex: 1,
    padding: Spacing.md,
    gap: 6,
  },
  recipeTags: { flexDirection: 'row', gap: Spacing.sm, marginTop: 4 },
  shoppingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.xs,
    gap: Spacing.sm,
  },
});
