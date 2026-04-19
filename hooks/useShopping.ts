import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  checked: boolean;
  created_at: string;
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

export function useShopping() {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const householdIdRef = useRef<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) { setError(authError.message); setLoading(false); return; }
    if (!user) { setLoading(false); return; }

    const hid = await getHouseholdId(user.id);
    setHouseholdId(hid);
    householdIdRef.current = hid;

    const query = supabase
      .from('shopping_list_items')
      .select('*')
      .order('created_at', { ascending: true });

    const { data, error: fetchError } = hid
      ? await query.eq('household_id', hid)
      : await query.eq('user_id', user.id);

    if (fetchError) setError(fetchError.message);
    else setItems(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  // Realtime subscription
  useEffect(() => {
    if (!householdId) return;

    const channel = supabase
      .channel(`shopping:${householdId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'shopping_list_items', filter: `household_id=eq.${householdId}` },
        (payload) => {
          setItems((prev) => [...prev, payload.new as ShoppingItem]);
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'shopping_list_items', filter: `household_id=eq.${householdId}` },
        (payload) => {
          setItems((prev) => prev.filter((i) => i.id !== (payload.old as { id: string }).id));
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'shopping_list_items', filter: `household_id=eq.${householdId}` },
        (payload) => {
          setItems((prev) => prev.map((i) => i.id === (payload.new as ShoppingItem).id ? payload.new as ShoppingItem : i));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [householdId]);

  const addItem = useCallback(async (name: string, quantity = 1, unit = '') => {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) { setError(authError.message); return; }
    if (!user) return;

    const hid = await getHouseholdId(user.id);
    const { data, error: insertError } = await supabase
      .from('shopping_list_items')
      .insert({ name, quantity, unit, user_id: user.id, household_id: hid })
      .select()
      .single();
    if (insertError) { setError(insertError.message); return; }
    // If no Realtime subscription (no household), update state manually
    if (!householdIdRef.current && data) {
      setItems((prev) => [...prev, data]);
    }
  }, []);

  const toggleItem = useCallback(async (id: string) => {
    let currentChecked: boolean | undefined;
    setItems((prev) => {
      currentChecked = prev.find((i) => i.id === id)?.checked;
      return prev;
    });
    if (currentChecked === undefined) return;
    const { error: updateError } = await supabase
      .from('shopping_list_items')
      .update({ checked: !currentChecked })
      .eq('id', id);
    if (updateError) { setError(updateError.message); return; }
    // If no Realtime subscription (no household), update state manually
    if (!householdIdRef.current) {
      setItems((prev) => prev.map((i) => i.id === id ? { ...i, checked: !i.checked } : i));
    }
  }, []);

  const deleteItem = useCallback(async (id: string) => {
    const { error: deleteError } = await supabase.from('shopping_list_items').delete().eq('id', id);
    if (deleteError) { setError(deleteError.message); return; }
    // If no Realtime subscription (no household), update state manually
    if (!householdIdRef.current) {
      setItems((prev) => prev.filter((i) => i.id !== id));
    }
  }, []);

  const clearChecked = useCallback(async () => {
    let checkedIds: string[] = [];
    setItems((prev) => { checkedIds = prev.filter((i) => i.checked).map((i) => i.id); return prev; });
    if (checkedIds.length === 0) return;
    const { error: deleteError } = await supabase.from('shopping_list_items').delete().in('id', checkedIds);
    if (deleteError) { setError(deleteError.message); return; }
    // If no Realtime subscription (no household), update state manually
    if (!householdIdRef.current) {
      setItems((prev) => prev.filter((i) => !i.checked));
    }
  }, []);

  return { items, loading, error, addItem, toggleItem, deleteItem, clearChecked, refetch: fetchItems };
}
