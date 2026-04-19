import React, { useState, useCallback } from 'react';
import {
  View, SectionList, StyleSheet, SafeAreaView, TextInput,
  Alert, TouchableOpacity, Text,
} from 'react-native';
import { Header } from '@/components/ui/Header';
import { EmptyState } from '@/components/ui/EmptyState';
import { ShoppingItem } from '@/components/shopping/ShoppingItem';
import { OrderButtons } from '@/components/shopping/OrderButtons';
import { Button } from '@/components/ui/Button';
import { PremiumGate } from '@/components/ui/PremiumGate';
import { useShopping } from '@/hooks/useShopping';
import { useFridge } from '@/hooks/useFridge';
import { buildShoppingList } from '@/lib/claude';
import { supabase } from '@/lib/supabase';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import type { ShoppingItem as ShoppingItemType } from '@/hooks/useShopping';

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

export default function ShoppingScreen() {
  const { items, addItem, toggleItem, deleteItem, clearChecked } = useShopping();
  const { items: fridgeItems } = useFridge();
  const [newItem, setNewItem] = useState('');
  const [buildingList, setBuildingList] = useState(false);

  const handleAddItem = useCallback(async () => {
    if (!newItem.trim()) return;
    await addItem(newItem.trim());
    setNewItem('');
  }, [newItem, addItem]);

  const handleBuildList = useCallback(async () => {
    setBuildingList(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        Alert.alert('Error', 'Please sign in to build your shopping list.');
        return;
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('dietary_preferences, household_size')
        .eq('id', user.id)
        .single();
      const itemNames = fridgeItems.map((i) => i.name);
      const newItems = await buildShoppingList(
        itemNames,
        profile?.household_size ?? 2,
        profile?.dietary_preferences ?? []
      );
      for (const item of newItems) {
        try {
          await addItem(item.name, item.quantity, item.unit);
        } catch {
          // continue adding remaining items
        }
      }
    } catch {
      Alert.alert('Error', 'Could not build shopping list. Please try again.');
    } finally {
      setBuildingList(false);
    }
  }, [fridgeItems, addItem]);

  const uncheckedNames = items.filter((i) => !i.checked).map((i) => i.name);
  const sections = groupByCategory(items);
  const hasChecked = items.some((i) => i.checked);

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
        <TouchableOpacity style={styles.addBtn} onPress={handleAddItem}>
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {items.length === 0 ? (
        <EmptyState
          icon="🛒"
          title="List is empty"
          message="Add items manually or let AI build your weekly list."
        />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionLabel}>{section.title}</Text>
          )}
          renderItem={({ item }) => (
            <ShoppingItem item={item} onToggle={toggleItem} onDelete={deleteItem} />
          )}
          contentContainerStyle={styles.list}
          ListFooterComponent={
            hasChecked ? (
              <Button
                label="Clear checked items"
                onPress={clearChecked}
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
  addRow: { flexDirection: 'row', padding: Spacing.md, gap: Spacing.sm },
  input: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Typography.body,
    color: Colors.textPrimary,
  },
  addBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: { color: '#fff', fontWeight: '700' },
  list: { paddingHorizontal: Spacing.md, paddingBottom: 80 },
  sectionLabel: { ...Typography.label, marginTop: Spacing.md, marginBottom: Spacing.xs },
  clearBtn: { marginTop: Spacing.sm },
});
