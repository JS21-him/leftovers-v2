import { supabase } from '@/lib/supabase';
import type { NewFridgeItem } from '@/hooks/useFridge';

async function invokeFunction<T>(name: string, body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) throw new Error(error.message);
  if (data == null) throw new Error(`Edge function '${name}' returned no data`);
  return data as T;
}

export interface Recipe {
  title: string;
  emoji: string;
  ingredients: { name: string; have: boolean }[];
  instructions: string[];
  cook_time_minutes: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface ShoppingListItem {
  name: string;
  quantity: number;
  unit: string;
}

export async function scanFridge(imageBase64: string): Promise<NewFridgeItem[]> {
  const { items } = await invokeFunction<{ items: NewFridgeItem[] }>('scan-fridge', { imageBase64 });
  return items;
}

export async function scanReceipt(imageBase64: string): Promise<NewFridgeItem[]> {
  const { items } = await invokeFunction<{ items: NewFridgeItem[] }>('scan-receipt', { imageBase64 });
  return items;
}

export async function generateRecipes(fridgeItems: string[], preferences: string[]): Promise<Recipe[]> {
  const { recipes } = await invokeFunction<{ recipes: Recipe[] }>('generate-recipes', { fridgeItems, preferences });
  return recipes;
}

export async function buildShoppingList(
  fridgeItems: string[],
  householdSize: number,
  preferences: string[]
): Promise<ShoppingListItem[]> {
  const { items } = await invokeFunction<{ items: ShoppingListItem[] }>('build-shopping-list', {
    fridgeItems,
    householdSize,
    preferences,
  });
  return items;
}
