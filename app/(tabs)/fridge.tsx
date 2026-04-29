import React, { useState, useCallback } from 'react';
import {
  View, Text, SectionList, StyleSheet, TouchableOpacity,
  SafeAreaView, ActivityIndicator,
} from 'react-native';
import { Header } from '@/components/ui/Header';
import { EmptyState } from '@/components/ui/EmptyState';
import { FridgeItem } from '@/components/fridge/FridgeItem';
import { AddItemModal } from '@/components/fridge/AddItemModal';
import { ScanButtons } from '@/components/fridge/ScanButtons';
import { EatThisFirstBanner } from '@/components/fridge/EatThisFirstBanner';
import { useFridge } from '@/hooks/useFridge';
import { Colors, Spacing, Typography } from '@/constants/theme';
import type { NewFridgeItem } from '@/hooks/useFridge';

export default function FridgeScreen() {
  const { items, loading, addItem, deleteItem, getExpiringSoon } = useFridge();
  const [showAddModal, setShowAddModal] = useState(false);

  // Items expiring in 2 days → shown in urgency banner
  const urgentItems = getExpiringSoon(2);
  // Items expiring within 5 days (but not urgent) → "Expires Soon" section
  const expiringSoon = getExpiringSoon(5).filter((i) => !urgentItems.find((u) => u.id === i.id));
  const allOther = items.filter(
    (i) => !getExpiringSoon(5).find((e) => e.id === i.id),
  );

  const sections = [
    ...(expiringSoon.length > 0 ? [{ title: 'EXPIRES SOON', data: expiringSoon }] : []),
    ...(allOther.length > 0 ? [{ title: 'IN YOUR FRIDGE', data: allOther }] : []),
  ];

  const handleItemsScanned = useCallback(async (newItems: NewFridgeItem[]) => {
    for (const item of newItems) {
      try {
        await addItem(item);
      } catch {
        // continue adding remaining items even if one fails
      }
    }
  }, [addItem]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header showLogo />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header showLogo />
      <ScanButtons onItemsScanned={handleItemsScanned} />

      {items.length === 0 ? (
        <EmptyState
          icon="🧊"
          title="Your fridge is empty"
          message="Scan your fridge or add items manually to get started."
          actionLabel="Add Item"
          onAction={() => setShowAddModal(true)}
        />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={<EatThisFirstBanner items={urgentItems} />}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionLabel}>{section.title}</Text>
          )}
          renderItem={({ item }) => (
            <FridgeItem item={item} onDelete={deleteItem} />
          )}
          contentContainerStyle={styles.list}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => setShowAddModal(true)} accessibilityLabel="Add item">
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <AddItemModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={addItem}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: Spacing.md, paddingBottom: 100 },
  sectionLabel: { ...Typography.label, marginTop: Spacing.md, marginBottom: Spacing.sm },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '300', lineHeight: 32 },
});
