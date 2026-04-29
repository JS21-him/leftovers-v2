import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, {
  FadeInDown,
  FadeOutLeft,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { hapticMedium, hapticError } from '@/lib/haptics';
import type { FridgeItem as FridgeItemType } from '@/hooks/useFridge';

interface Props {
  item: FridgeItemType;
  onDelete: (id: string) => void;
  index?: number;
}

function daysUntil(dateStr: string): number | null {
  const ms = new Date(dateStr).getTime();
  if (isNaN(ms)) return null;
  return Math.ceil((ms - Date.now()) / (1000 * 60 * 60 * 24));
}

function expiryColor(days: number): string {
  if (days <= 0) return Colors.danger;
  if (days <= 2) return Colors.danger;
  if (days <= 5) return Colors.warning;
  return Colors.textMuted;
}

function expiryLabel(days: number): string {
  if (days <= 0) return 'Expired';
  if (days === 1) return 'Tomorrow';
  return `${days}d`;
}

function urgencyBorderColor(days: number | null): string {
  if (days === null) return 'transparent';
  if (days <= 2) return Colors.danger;
  if (days <= 5) return Colors.warning;
  return 'transparent';
}

// Right swipe action — delete
function RightAction({ onDelete }: { onDelete: () => void }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <TouchableOpacity
      style={styles.deleteAction}
      onPress={() => {
        hapticError();
        onDelete();
      }}
      onPressIn={() => { scale.value = withSpring(0.92); }}
      onPressOut={() => { scale.value = withSpring(1); }}
      activeOpacity={1}
    >
      <Animated.View style={animStyle}>
        <Text style={styles.deleteIcon}>🗑</Text>
        <Text style={styles.deleteActionText}>Delete</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

function FridgeItemComponent({ item, onDelete, index = 0 }: Props) {
  const days = item.expiry_date ? daysUntil(item.expiry_date) : null;

  const renderRightActions = useCallback(
    () => <RightAction onDelete={() => onDelete(item.id)} />,
    [item.id, onDelete],
  );

  const handleSwipeOpen = useCallback(() => {
    hapticMedium();
  }, []);

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 40).springify().damping(18)}
      exiting={FadeOutLeft.duration(200)}
    >
      <ReanimatedSwipeable
        renderRightActions={renderRightActions}
        overshootRight={false}
        friction={2}
        rightThreshold={60}
        onSwipeableWillOpen={handleSwipeOpen}
      >
        <View style={[styles.row, { borderLeftColor: urgencyBorderColor(days) }]}>
          <View style={styles.info}>
            <Text style={styles.name}>{item.name}</Text>
            {item.unit ? (
              <Text style={styles.quantity}>
                {item.quantity} {item.unit}
              </Text>
            ) : null}
          </View>
          {days !== null && (
            <View style={[styles.expiryBadge, { borderColor: expiryColor(days) }]}>
              <Text style={[styles.expiry, { color: expiryColor(days) }]}>
                {expiryLabel(days)}
              </Text>
            </View>
          )}
        </View>
      </ReanimatedSwipeable>
    </Animated.View>
  );
}

export const FridgeItem = React.memo(FridgeItemComponent);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.xs,
    borderLeftWidth: 4,
  },
  info: { flex: 1 },
  name: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: '600',
    fontSize: 15,
  },
  quantity: { ...Typography.caption, marginTop: 3, color: Colors.textMuted },
  expiryBadge: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  expiry: { ...Typography.caption, fontWeight: '700', fontSize: 11 },
  deleteAction: {
    backgroundColor: Colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderRadius: Radius.sm,
    marginBottom: Spacing.xs,
    gap: 2,
  },
  deleteIcon: { fontSize: 18 },
  deleteActionText: { color: '#fff', fontWeight: '700', fontSize: 11 },
});
