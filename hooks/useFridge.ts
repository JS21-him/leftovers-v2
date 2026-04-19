import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface FridgeItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  expiry_date: string | null;
  created_at: string;
}

export interface NewFridgeItem {
  name: string;
  quantity: number;
  unit: string;
  expiry_date: string | null;
}

async function getHouseholdId(userId: string): Promise<string | null> {
  try {
    const { data } = await supabase
      .from('household_members')
      .select('household_id')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();
    return data?.household_id ?? null;
  } catch {
    return null;
  }
}

export function useFridge() {
  const [items, setItems] = useState<FridgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) { setError(authError.message); setLoading(false); return; }
    if (!user) { setLoading(false); return; }

    const householdId = await getHouseholdId(user.id);
    const query = supabase
      .from('fridge_items')
      .select('*')
      .order('expiry_date', { ascending: true, nullsFirst: false });

    const { data, error: fetchError } = householdId
      ? await query.eq('household_id', householdId)
      : await query.eq('user_id', user.id);

    if (fetchError) setError(fetchError.message);
    else setItems(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const addItem = useCallback(async (item: NewFridgeItem): Promise<FridgeItem | null> => {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) { setError(authError.message); return null; }
    if (!user) return null;

    const householdId = await getHouseholdId(user.id);
    const { data, error: insertError } = await supabase
      .from('fridge_items')
      .insert({ ...item, user_id: user.id, household_id: householdId })
      .select()
      .single();
    if (insertError) { setError(insertError.message); return null; }
    setItems((prev) => [...prev, data]);
    return data;
  }, []);

  const deleteItem = useCallback(async (id: string) => {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) { setError(authError.message); return; }
    if (!user) return;
    const { error: deleteError } = await supabase.from('fridge_items').delete().eq('id', id);
    if (deleteError) { setError(deleteError.message); return; }
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  function getExpiringSoon(withinDays = 5): FridgeItem[] {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + withinDays);
    return items.filter((i) => {
      if (!i.expiry_date) return false;
      return new Date(i.expiry_date) <= cutoff;
    });
  }

  return { items, loading, error, addItem, deleteItem, refetch: fetchItems, getExpiringSoon };
}
