import React, { useState, useCallback, useMemo } from 'react';
import {
  View, SectionList, StyleSheet, SafeAreaView, TextInput,
  TouchableOpacity, Text,
} from 'react-native';
import { Header } from '@/components/ui/Header';
import { EmptyState } from '@/components/ui/EmptyState';
import { ShoppingItem } from '@/components/shopping/ShoppingItem';
import { OrderButtons } from '@/components/shopping/OrderButtons';
import { Button } from '@/components/ui/Button';
import { PremiumGate } from '@/components/ui/PremiumGate';
import { ShoppingSkeleton } from '@/components/ui/Skeleton';
import { useShopping } from '@/hooks/useShopping';
import { useFridge } from '@/hooks/useFridge';
import { buildShoppingList } from '@/lib/claude';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/Toast';
import { hapticSuccess, hapticLight, hapticError } from '@/lib/haptics';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import type { ShoppingItem as ShoppingItemType } from '@/hooks/useShopping';

// ─── Category helpers ─────────────────────────────────────────────────────────
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  '🥩 Meat & Fish': ['chicken', 'beef', 'pork', 'fish', 'salmon', 'tuna', 'shrimp', 'turkey', 'lamb', 'bacon', 'sausage', 'steak', 'mince', 'ground'],
  '🥦 Produce': ['apple', 'banana', 'orange', 'lemon', 'lime', 'berry', 'berries', 'grape', 'mango', 'tomato', 'lettuce', 'spinach', 'kale', 'broccoli', 'carrot', 'celery', 'cucumber', 'pepper', 'onion', 'garlic', 'potato', 'sweet potato', 'mushroom', 'avocado', 'zucchini', 'corn', 'pea', 'bean', 'herb', 'basil', 'cilantro', 'parsley'],
  '🥛 Dairy': ['milk', 'cheese', 'butter', 'yogurt', 'cream', 'egg', 'eggs', 'sour cream', 'cottage cheese', 'cheddar', 'mozzarella', 'parmesan'],
  '🍞 Bakery': ['bread', 'bagel', 'muffin', 'tortilla', 'wrap', 'pita', 'roll', 'bun', 'croissant', 'sourdough'],
  '🥫 Pantry': ['pasta', 'rice', 'flour', 'sugar', 'salt', 'pepper', 'oil', 'vinegar', 'sauce', 'can', 'canned', 'soup', 'stock', 'broth', 'cereal', 'oat', 'lentil', 'chickpea', 'bean', 'honey', 'jam', 'peanut butter', 'ketchup', 'mustard', 'mayo', 'soy sauce', 'spice'],
  '🥤 Drinks': ['juice', 'water', 'soda', 'coffee', 'tea', 'wine', 'beer', 'drink', 'smoothie', 'almond milk', 'oat milk'],
  '❄️ Frozen': ['frozen', 'ice cream', 'gelato', 'sorbet', 'ice'],
  '🧴 Other': [],
};

function categorise(name: string): string {
  const lower = name.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (category === '🧴 Other') continue;
    if (keywords.some((k) => lower.includes(k))) return category;
  }
  return '🧴 Other';
}

function groupByCategory(items: ShoppingItemType[]) {
  const map: Record<string, ShoppingItemType[]> = {};
  for (const item of items) {
    const cat = categorise(item.name);
    if (!map[cat]) map[cat] = [];
    map[cat].push(item);
  }
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([title, data]) => ({ title, data }));
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function ShoppingScreen() {
  const { items, loading, addItem, toggleItem, deleteItem, clearChecked } = useShopping();
  const { items: fridgeItems } = useFridge();
  const { showToast } = useToast();
  const [newItem, setNewItem] = useState('');
  const [buildingList, setBuildingList] = useState(false);

  const sections = useMemo(() => groupByCategory(items), [items]);
  const uncheckedNames = useMemo(
    () => items.filter((i) => !i.checked).map((i) => i.name),
    [items],
  );
  const hasChecked = useMemo(() => items.some((i) => i.checked), [items]);

  const handleAddItem = useCallback(async () => {
    const name = newItem.trim();
    if (!name) return;
    try {
      await addItem(name);
      setNewItem('');
      hapticSuccess();
      showToast({ message: `${name} added to list`, type: 'success' });
    } catch {
      hapticError();
      showToast({ message: 'Could not add item', type: 'error' });
    }
  }, [newItem, addItem, showToast]);

  const handleToggle = useCallback(async (id: string) => {
    hapticLight();
    await toggleItem(id);
  }, [toggleItem]);

  const handleDelete = useCallback(async (id: string) => {
    const item = items.find((i) => i.id === id);
    await deleteItem(id);
    showToast({ message: `${item?.name ?? 'Item'} removed`, type: 'info' });
  }, [deleteItem, items, showToast]);

  const handleClearChecked = useCallback(async () => {
    await clearChecked();
    hapticSuccess();
    showToast({ message: 'Checked items cleared', type: 'success' });
  }, [clearChecked, showToast]);

  const handleBuildList = useCallback(async () => {
    setBuildingList(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        showToast({ message: 'Please sign in to build your list', type: 'error' });
        return;
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('dietary_preferences, household_size')
        .eq('id', user.id)
        .maybeSingle();
      const itemNames = fridgeItems.map((i) => i.name);
      const newItems = await buildShoppingList(
        itemNames,
        profile?.household_size ?? 2,
        profile?.dietary_preferences ?? [],
      );
      for (const item of newItems) {
        try {
          await addItem(item.name, item.quantity, item.unit);
        } catch { /* continue */ }
      }
      hapticSuccess();
      showToast({ message: `${newItems.length} items added to your list`, type: 'success' });
    } catch {
      hapticError();
      showToast({ message: 'Could not build shopping list. Please try again.', type: 'error' });
    } finally {
      setBuildingList(false);
    }
  }, [fridgeItems, addItem, showToast]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Shopping" />
        <ShoppingSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Shopping" />

      <PremiumGate feature="AI weekly list builder">
        <Button
          label={buildingList ? 'Building list...' : '🤖 Build My Weekly List'}
          onPress={handleBuildList}
          loading={buildingList}
          style={styles.buildButton}
        />
      </PremiumGate>

      <View style={styles.addRow}>
        <TextInput
          style={styles.input}
          placeholder="Add item..."
          value={newItem}
          onChangeText={setNewItem}
          placeholderTextColor={Colors.textMuted}
          onSubmitEditing={handleAddItem}
          returnKeyType="done"
        />
        <TouchableOpacity
          style={styles.addBtn}
          onPress={handleAddItem}
          activeOpacity={0.8}
        >
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {items.length === 0 ? (
        <EmptyState
          icon="🛒"
          title="Your list is clear!"
          message="Add items manually or let AI build your weekly list based on your fridge."
        />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionLabel}>{section.title}</Text>
          )}
          renderItem={({ item, index }) => (
            <ShoppingItem
              item={item}
              onToggle={handleToggle}
              onDelete={handleDelete}
              index={index}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            hasChecked ? (
              <Button
                label="Clear checked items"
                onPress={handleClearChecked}
                variant="ghost"
                style={styles.clearBtn}
              />
            ) : null
          }
        />
      )}

      {uncheckedNames.length > 0 && <OrderButtons itemNames={uncheckedNames} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  buildButton: { margin: Spacing.md, marginBottom: 0 },
  addRow: {
    flexDirection: 'row',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    ...Typography.body,
    color: Colors.textPrimary,
    fontSize: 15,
    minHeight: 48,
  },
  addBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  list: { paddingHorizontal: Spacing.md, paddingBottom: 100 },
  sectionLabel: { ...Typography.label, marginTop: Spacing.md, marginBottom: Spacing.sm },
  clearBtn: { marginTop: Spacing.sm },
});
