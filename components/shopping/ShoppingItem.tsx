import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import type { ShoppingItem as ShoppingItemType } from '@/hooks/useShopping';

interface Props {
  item: ShoppingItemType;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ShoppingItem({ item, onToggle, onDelete }: Props) {
  return (
    <View style={styles.row}>
      <TouchableOpacity
        onPress={() => onToggle(item.id)}
        style={styles.checkbox}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <View style={[styles.box, item.checked && styles.boxChecked]}>
          {item.checked && <Text style={styles.check}>✓</Text>}
        </View>
      </TouchableOpacity>
      <Text style={[styles.name, item.checked && styles.checkedText]}>{item.name}</Text>
      {item.unit ? <Text style={styles.qty}>{item.quantity} {item.unit}</Text> : null}
      <TouchableOpacity
        onPress={() => onDelete(item.id)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.delete}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

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
  checkbox: { flexShrink: 0 },
  box: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxChecked: { backgroundColor: Colors.primary },
  check: { color: '#fff', fontSize: 12, fontWeight: '700' },
  name: { ...Typography.body, flex: 1, color: Colors.textPrimary },
  checkedText: { textDecorationLine: 'line-through', color: Colors.textMuted },
  qty: { ...Typography.caption },
  delete: { color: Colors.textMuted, fontSize: 14 },
});
