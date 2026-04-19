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

function sortByExpiry(items: FridgeItem[]): FridgeItem[] {
  return [...items].sort((a, b) => {
    if (!a.expiry_date) return 1;
    if (!b.expiry_date) return -1;
    return new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime();
  });
}

export function useFridge() {
  const [items, setItems] = useState<FridgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [householdId, setHouseholdId] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) { setError(authError.message); setLoading(false); return; }
    if (!user) { setLoading(false); return; }

    const hid = await getHouseholdId(user.id);
    setHouseholdId(hid);

    const query = supabase
      .from('fridge_items')
      .select('*')
      .order('expiry_date', { ascending: true, nullsFirst: false });

    const { data, error: fetchError } = hid
      ? await query.eq('household_id', hid)
      : await query.eq('user_id', user.id);

    if (fetchError) setError(fetchError.message);
    else setItems(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  // Realtime subscription - fires after householdId is resolved
  useEffect(() => {
    if (!householdId) return;

    const channel = supabase
      .channel(`fridge:${householdId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'fridge_items', filter: `household_id=eq.${householdId}` },
        (payload) => {
          setItems((prev) => sortByExpiry([...prev, payload.new as FridgeItem]));
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'fridge_items', filter: `household_id=eq.${householdId}` },
        (payload) => {
          setItems((prev) => prev.filter((i) => i.id !== (payload.old as { id: string }).id));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [householdId]);

  const addItem = useCallback(async (item: NewFridgeItem): Promise<FridgeItem | null> => {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) { setError(authError.message); return null; }
    if (!user) return null;

    const hid = await getHouseholdId(user.id);
    const { data, error: insertError } = await supabase
      .from('fridge_items')
      .insert({ ...item, user_id: user.id, household_id: hid })
      .select()
      .single();
    if (insertError) { setError(insertError.message); return null; }
    // Realtime handles adding to state
    return data;
  }, []);

  const deleteItem = useCallback(async (id: string) => {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) { setError(authError.message); return; }
    if (!user) return;
    const { error: deleteError } = await supabase.from('fridge_items').delete().eq('id', id);
    if (deleteError) { setError(deleteError.message); return; }
    // Realtime handles removing from state
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
