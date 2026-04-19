import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import type { FridgeItem as FridgeItemType } from '@/hooks/useFridge';

interface Props {
  item: FridgeItemType;
  onDelete: (id: string) => void;
}

function daysUntil(dateStr: string): number | null {
  const ms = new Date(dateStr).getTime();
  if (isNaN(ms)) return null;
  const diff = ms - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function expiryColor(days: number): string {
  if (days <= 2) return Colors.danger;
  if (days <= 5) return Colors.warning;
  return Colors.textMuted;
}

export function FridgeItem({ item, onDelete }: Props) {
  const days = item.expiry_date ? daysUntil(item.expiry_date) : null;

  function handleDelete() {
    Alert.alert(
      'Remove item',
      `Remove ${item.name} from your fridge?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => onDelete(item.id) },
      ]
    );
  }

  return (
    <View style={styles.row}>
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        {item.unit ? (
          <Text style={styles.quantity}>{item.quantity} {item.unit}</Text>
        ) : null}
      </View>
      {days !== null && (
        <Text style={[styles.expiry, { color: expiryColor(days) }]}>
          {days <= 0 ? 'Expired' : `${days}d`}
        </Text>
      )}
      <TouchableOpacity
        onPress={handleDelete}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={styles.delete}
      >
        <Text style={styles.deleteText}>✕</Text>
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
  },
  info: { flex: 1 },
  name: { ...Typography.body, color: Colors.textPrimary, fontWeight: '600' },
  quantity: { ...Typography.caption, marginTop: 2 },
  expiry: { ...Typography.caption, fontWeight: '700', marginRight: Spacing.sm },
  delete: { padding: 4 },
  deleteText: { color: Colors.textMuted, fontSize: 14 },
});
