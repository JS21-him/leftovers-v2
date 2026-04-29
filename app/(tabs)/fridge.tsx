import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View, Text, SectionList, StyleSheet, TouchableOpacity, SafeAreaView, RefreshControl,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import { Header } from '@/components/ui/Header';
import { EmptyState } from '@/components/ui/EmptyState';
import { FridgeItem } from '@/components/fridge/FridgeItem';
import { AddItemModal } from '@/components/fridge/AddItemModal';
import { ScanButtons } from '@/components/fridge/ScanButtons';
import { EatThisFirstBanner } from '@/components/fridge/EatThisFirstBanner';
import { FridgeSkeleton } from '@/components/ui/Skeleton';
import { useFridge } from '@/hooks/useFridge';
import { useShopping } from '@/hooks/useShopping';
import { useToast } from '@/components/ui/Toast';
import { hapticSuccess, hapticError } from '@/lib/haptics';
import { Colors, Spacing, Typography } from '@/constants/theme';
import type { NewFridgeItem } from '@/hooks/useFridge';

export default function FridgeScreen() {
  const { items, loading, addItem, deleteItem, refetch, getExpiringSoon } = useFridge();
  const { addItem: addToShopping } = useShopping();
  const { showToast } = useToast();
  const [showAddModal, setShowAddModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // FAB bounce-in on mount
  const fabScale = useSharedValue(0);
  const fabStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value }],
  }));
  useEffect(() => {
    fabScale.value = withDelay(400, withSpring(1, { damping: 12, stiffness: 180 }));
  }, []);

  const urgentItems = useMemo(() => getExpiringSoon(2), [items]);
  const expiringSoon = useMemo(
    () => getExpiringSoon(5).filter((i) => !urgentItems.find((u) => u.id === i.id)),
    [items, urgentItems],
  );
  const allOther = useMemo(
    () => items.filter((i) => !getExpiringSoon(5).find((e) => e.id === i.id)),
    [items],
  );

  const sections = useMemo(() => [
    ...(urgentItems.length > 0 ? [{ title: 'USE FIRST', data: urgentItems }] : []),
    ...(expiringSoon.length > 0 ? [{ title: 'EXPIRES SOON', data: expiringSoon }] : []),
    ...(allOther.length > 0 ? [{ title: 'IN YOUR FRIDGE', data: allOther }] : []),
  ], [urgentItems, expiringSoon, allOther]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleItemsScanned = useCallback(async (newItems: NewFridgeItem[]) => {
    let addedCount = 0;
    for (const item of newItems) {
      try {
        await addItem(item);
        addedCount++;
      } catch {
        // continue adding remaining items
      }
    }
    if (addedCount > 0) {
      hapticSuccess();
      showToast({ message: `Added ${addedCount} item${addedCount > 1 ? 's' : ''} to your fridge`, type: 'success' });
    }
  }, [addItem, showToast]);

  const handleAddItem = useCallback(async (item: NewFridgeItem) => {
    try {
      const result = await addItem(item);
      hapticSuccess();
      showToast({ message: `${item.name} added to fridge`, type: 'success' });
      return result;
    } catch {
      hapticError();
      showToast({ message: 'Could not add item. Please try again.', type: 'error' });
      return null;
    }
  }, [addItem, showToast]);

  const handleDeleteItem = useCallback(async (id: string) => {
    const item = items.find((i) => i.id === id);
    await deleteItem(id);
    if (item) {
      showToast({
        message: `${item.name} removed — add to shopping list?`,
        type: 'info',
        action: { label: 'Add', onPress: () => addToShopping(item.name, item.quantity, item.unit) },
      });
    } else {
      showToast({ message: 'Item removed', type: 'info' });
    }
  }, [deleteItem, items, showToast, addToShopping]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header showLogo />
        <FridgeSkeleton />
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
          message="Scan a receipt or add items manually to get started."
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
          renderItem={({ item, index }) => (
            <FridgeItem item={item} onDelete={handleDeleteItem} index={index} />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
        />
      )}

      <Animated.View style={[styles.fab, fabStyle]}>
        <TouchableOpacity
          style={styles.fabInner}
          onPress={() => setShowAddModal(true)}
          activeOpacity={0.85}
          accessibilityLabel="Add item to fridge"
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      </Animated.View>

      <AddItemModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddItem}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  list: { paddingHorizontal: Spacing.md, paddingBottom: 100 },
  sectionLabel: { ...Typography.label, marginTop: Spacing.md, marginBottom: Spacing.sm },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
  },
  fabInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '300', lineHeight: 32 },
});
