import React, { useState } from 'react';
import { Modal, View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import type { NewFridgeItem } from '@/hooks/useFridge';

interface Props {
  visible: boolean;
  onClose: () => void;
  onAdd: (item: NewFridgeItem) => Promise<unknown>;
}

// Quick expiry presets — builds an ISO date string from "days from today"
const EXPIRY_PRESETS: { label: string; days: number | null }[] = [
  { label: 'Today',   days: 0 },
  { label: '3 days',  days: 3 },
  { label: '1 week',  days: 7 },
  { label: '2 weeks', days: 14 },
  { label: '1 month', days: 30 },
  { label: 'No date', days: null },
];

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0]; // "YYYY-MM-DD"
}

export function AddItemModal({ visible, onClose, onAdd }: Props) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null); // index into EXPIRY_PRESETS
  const [loading, setLoading] = useState(false);

  function reset() {
    setName(''); setQuantity('1'); setUnit(''); setSelectedPreset(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleAdd() {
    if (!name.trim()) return;

    let expiry_date: string | null = null;
    if (selectedPreset !== null) {
      const preset = EXPIRY_PRESETS[selectedPreset];
      expiry_date = preset.days !== null ? daysFromNow(preset.days) : null;
    }

    setLoading(true);
    try {
      await onAdd({
        name: name.trim(),
        quantity: parseFloat(quantity) || 1,
        unit: unit.trim(),
        expiry_date,
      });
      reset();
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Add Item</Text>
          <TouchableOpacity onPress={handleClose} hitSlop={8}>
            <Text style={styles.close}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Item name */}
          <Text style={styles.fieldLabel}>Item name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Eggs, Chicken, Milk"
            value={name}
            onChangeText={setName}
            placeholderTextColor={Colors.textMuted}
            autoFocus
          />

          {/* Qty + Unit */}
          <View style={styles.row}>
            <View style={styles.half}>
              <Text style={styles.fieldLabel}>Quantity</Text>
              <TextInput
                style={styles.input}
                placeholder="1"
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
                placeholderTextColor={Colors.textMuted}
              />
            </View>
            <View style={styles.half}>
              <Text style={styles.fieldLabel}>Unit (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="kg, L, pack..."
                value={unit}
                onChangeText={setUnit}
                placeholderTextColor={Colors.textMuted}
              />
            </View>
          </View>

          {/* Expiry presets */}
          <Text style={styles.fieldLabel}>Expires in</Text>
          <View style={styles.presets}>
            {EXPIRY_PRESETS.map((p, i) => (
              <TouchableOpacity
                key={p.label}
                style={[styles.preset, selectedPreset === i && styles.presetActive]}
                onPress={() => setSelectedPreset(i)}
                activeOpacity={0.7}
              >
                <Text style={[styles.presetText, selectedPreset === i && styles.presetTextActive]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Button
            label="Add to Fridge"
            onPress={handleAdd}
            loading={loading}
            disabled={!name.trim()}
            style={{ marginTop: Spacing.lg, marginBottom: Spacing.xl }}
          />
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  title: { ...Typography.heading, fontSize: 22 },
  close: { fontSize: 20, color: Colors.textMuted, padding: 4 },
  fieldLabel: {
    ...Typography.label,
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Typography.body,
    color: Colors.textPrimary,
    fontSize: 15,
  },
  row: { flexDirection: 'row', gap: Spacing.sm },
  half: { flex: 1 },

  // Expiry presets
  presets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  preset: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  presetActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  presetText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  presetTextActive: { color: '#fff' },
});
