import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
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

function urgencyBorderColor(days: number | null): string {
  if (days === null) return 'transparent';
  if (days <= 2) return Colors.danger;
  if (days <= 5) return Colors.warning;
  return 'transparent';
}

export function FridgeItem({ item, onDelete }: Props) {
  const days = item.expiry_date ? daysUntil(item.expiry_date) : null;

  function renderRightActions() {
    return (
      <TouchableOpacity style={styles.deleteAction} onPress={() => onDelete(item.id)}>
        <Text style={styles.deleteActionText}>Delete</Text>
      </TouchableOpacity>
    );
  }

  return (
    <Swipeable renderRightActions={renderRightActions} overshootRight={false}>
      <View style={[styles.row, { borderLeftColor: urgencyBorderColor(days) }]}>
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
      </View>
    </Swipeable>
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
    borderLeftWidth: 4,
  },
  info: { flex: 1 },
  name: { ...Typography.body, color: Colors.textPrimary, fontWeight: '600' },
  quantity: { ...Typography.caption, marginTop: 2 },
  expiry: { ...Typography.caption, fontWeight: '700' },
  deleteAction: {
    backgroundColor: Colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderRadius: Radius.sm,
    marginBottom: Spacing.xs,
  },
  deleteActionText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
