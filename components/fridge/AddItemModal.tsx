import React, { useState } from 'react';
import { Modal, View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import type { NewFridgeItem } from '@/hooks/useFridge';

interface Props {
  visible: boolean;
  onClose: () => void;
  onAdd: (item: NewFridgeItem) => Promise<unknown>;
}

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function AddItemModal({ visible, onClose, onAdd }: Props) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [dateError, setDateError] = useState('');

  async function handleAdd() {
    if (!name.trim()) return;
    if (expiryDate && !DATE_REGEX.test(expiryDate)) {
      setDateError('Use format YYYY-MM-DD');
      return;
    }
    setDateError('');
    setLoading(true);
    try {
      await onAdd({
        name: name.trim(),
        quantity: parseFloat(quantity) || 1,
        unit: unit.trim(),
        expiry_date: expiryDate || null,
      });
      setName(''); setQuantity('1'); setUnit(''); setExpiryDate('');
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Add Item</Text>
          <TouchableOpacity onPress={onClose}><Text style={styles.close}>✕</Text></TouchableOpacity>
        </View>
        <TextInput
          style={styles.input}
          placeholder="Item name (e.g. Eggs)"
          value={name}
          onChangeText={setName}
          placeholderTextColor={Colors.textMuted}
          autoFocus
        />
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.half]}
            placeholder="Qty"
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
            placeholderTextColor={Colors.textMuted}
          />
          <TextInput
            style={[styles.input, styles.half]}
            placeholder="Unit (e.g. kg)"
            value={unit}
            onChangeText={setUnit}
            placeholderTextColor={Colors.textMuted}
          />
        </View>
        <TextInput
          style={[styles.input, dateError ? styles.inputError : null]}
          placeholder="Expiry date (YYYY-MM-DD)"
          value={expiryDate}
          onChangeText={(t) => { setExpiryDate(t); setDateError(''); }}
          placeholderTextColor={Colors.textMuted}
        />
        {dateError ? <Text style={styles.errorText}>{dateError}</Text> : null}
        <Button label="Add to Fridge" onPress={handleAdd} loading={loading} style={{ marginTop: Spacing.md }} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: Spacing.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  title: { ...Typography.heading },
  close: { fontSize: 20, color: Colors.textMuted },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Typography.body,
    color: Colors.textPrimary,
  },
  inputError: { borderColor: Colors.danger },
  row: { flexDirection: 'row', gap: Spacing.sm },
  half: { flex: 1 },
  errorText: { color: Colors.danger, fontSize: 12, marginTop: -4, marginBottom: Spacing.sm },
});
