import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { hapticLight, hapticError } from '@/lib/haptics';
import type { ShoppingItem as ShoppingItemType } from '@/hooks/useShopping';

interface Props {
  item: ShoppingItemType;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  index?: number;
}

// Left action: swipe right to check off
function LeftAction({ onToggle }: { onToggle: () => void }) {
  return (
    <TouchableOpacity
      style={styles.checkAction}
      onPress={() => {
        hapticLight();
        onToggle();
      }}
      activeOpacity={0.85}
    >
      <Text style={styles.checkActionIcon}>✓</Text>
      <Text style={styles.checkActionText}>Done</Text>
    </TouchableOpacity>
  );
}

// Right action: delete
function RightAction({ onDelete }: { onDelete: () => void }) {
  return (
    <TouchableOpacity
      style={styles.deleteAction}
      onPress={() => {
        hapticError();
        onDelete();
      }}
      activeOpacity={0.85}
    >
      <Text style={styles.deleteIcon}>🗑</Text>
      <Text style={styles.deleteActionText}>Delete</Text>
    </TouchableOpacity>
  );
}

function ShoppingItemComponent({ item, onToggle, onDelete, index = 0 }: Props) {
  const scale = useSharedValue(1);
  const checkboxAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handleToggle() {
    hapticLight();
    scale.value = withSpring(0.8, { damping: 10 }, () => {
      scale.value = withSpring(1, { damping: 12 });
    });
    onToggle(item.id);
  }

  const renderLeftActions = useCallback(
    () => <LeftAction onToggle={() => onToggle(item.id)} />,
    [item.id, onToggle],
  );

  const renderRightActions = useCallback(
    () => <RightAction onDelete={() => onDelete(item.id)} />,
    [item.id, onDelete],
  );

  return (
    <Animated.View entering={FadeInDown.delay(index * 30).springify().damping(18)}>
      <ReanimatedSwipeable
        renderLeftActions={renderLeftActions}
        renderRightActions={renderRightActions}
        overshootLeft={false}
        overshootRight={false}
        friction={2}
        leftThreshold={60}
        rightThreshold={60}
      >
        <View style={[styles.row, item.checked && styles.rowChecked]}>
          <TouchableOpacity
            onPress={handleToggle}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <Animated.View style={[styles.box, item.checked && styles.boxChecked, checkboxAnimStyle]}>
              {item.checked && <Text style={styles.check}>✓</Text>}
            </Animated.View>
          </TouchableOpacity>

          <View style={styles.nameWrap}>
            <Text
              style={[styles.name, item.checked && styles.checkedText]}
              numberOfLines={1}
            >
              {item.name}
            </Text>
            {item.unit ? (
              <Text style={styles.qty}>
                {item.quantity} {item.unit}
              </Text>
            ) : null}
          </View>
        </View>
      </ReanimatedSwipeable>
    </Animated.View>
  );
}

export const ShoppingItem = React.memo(ShoppingItemComponent);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.xs,
    gap: Spacing.sm,
  },
  rowChecked: {
    backgroundColor: Colors.surfaceAlt,
  },
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  check: { color: '#fff', fontSize: 13, fontWeight: '800' },
  nameWrap: { flex: 1 },
  name: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: '500',
    fontSize: 15,
  },
  checkedText: {
    textDecorationLine: 'line-through',
    color: Colors.textMuted,
  },
  qty: { ...Typography.caption, marginTop: 2, color: Colors.textMuted },
  checkAction: {
    backgroundColor: Colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    width: 72,
    borderRadius: Radius.sm,
    marginBottom: Spacing.xs,
    gap: 2,
  },
  checkActionIcon: { fontSize: 18, color: '#fff', fontWeight: '800' },
  checkActionText: { color: '#fff', fontWeight: '700', fontSize: 11 },
  deleteAction: {
    backgroundColor: Colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
    width: 72,
    borderRadius: Radius.sm,
    marginBottom: Spacing.xs,
    gap: 2,
  },
  deleteIcon: { fontSize: 18 },
  deleteActionText: { color: '#fff', fontWeight: '700', fontSize: 11 },
});
