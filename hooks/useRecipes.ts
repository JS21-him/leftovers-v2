import { useState, useCallback } from 'react';
import { generateRecipes, type Recipe } from '@/lib/claude';
import { supabase } from '@/lib/supabase';
import type { FridgeItem } from '@/hooks/useFridge';

const FREE_DAILY_LIMIT = 5;

export function useRecipes(fridgeItems: FridgeItem[], isPremium: boolean) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecipes = useCallback(async () => {
    if (fridgeItems.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) { setError(authError.message); return; }
      if (!user) { setError('Not authenticated'); return; }
      const { data: profile } = await supabase
        .from('profiles')
        .select('dietary_preferences')
        .eq('id', user.id)
        .maybeSingle();
      const preferences: string[] = profile?.dietary_preferences ?? [];
      const itemNames = fridgeItems.map((i) => `${i.name}${i.unit ? ` (${i.quantity} ${i.unit})` : ''}`);
      const result = await generateRecipes(itemNames, preferences);
      setRecipes(isPremium ? result : result.slice(0, FREE_DAILY_LIMIT));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load recipes. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [fridgeItems, isPremium]);

  return { recipes, loading, error, fetchRecipes };
}
