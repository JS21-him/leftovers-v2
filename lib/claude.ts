import { supabase } from '@/lib/supabase';
import type { NewFridgeItem } from '@/hooks/useFridge';

const TIMEOUT_MS = 10_000;
const MAX_RETRIES = 1;

/** Races a promise against a timeout. */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error('Request timed out. Check your connection and try again.')),
        ms,
      ),
    ),
  ]);
}

/** Invokes a Supabase Edge Function with timeout + one automatic retry. */
async function invokeFunction<T>(name: string, body: Record<string, unknown>): Promise<T> {
  let lastError: Error = new Error('Unknown error');

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const { data, error } = await withTimeout(
        supabase.functions.invoke(name, { body }),
        TIMEOUT_MS,
      );
      if (error) throw new Error(error.message);
      if (data == null) throw new Error(`Edge function '${name}' returned no data`);
      return data as T;
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
      if (attempt < MAX_RETRIES) {
        // Brief pause before retry
        await new Promise((r) => setTimeout(r, 1200));
      }
    }
  }

  throw lastError;
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
  preferences: string[],
): Promise<ShoppingListItem[]> {
  const { items } = await invokeFunction<{ items: ShoppingListItem[] }>('build-shopping-list', {
    fridgeItems,
    householdSize,
    preferences,
  });
  return items;
}
