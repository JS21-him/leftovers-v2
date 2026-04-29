import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface Household {
  id: string;
  name: string;
  owner_id: string;
  invite_code: string;
  created_at: string;
}

export interface HouseholdMember {
  user_id: string;
  joined_at: string;
  email: string;
}

export function useHousehold() {
  const [household, setHousehold] = useState<Household | null>(null);
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHousehold = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) { setError(authError.message); setLoading(false); return; }
    if (!user) { setLoading(false); return; }

    // Get the household this user belongs to
    const { data: memberRow, error: memberError } = await supabase
      .from('household_members')
      .select('household_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    if (memberError || !memberRow) { setLoading(false); return; }

    const { data: householdData, error: householdError } = await supabase
      .from('households')
      .select('*')
      .eq('id', memberRow.household_id)
      .single();

    if (householdError) { setError(householdError.message); setLoading(false); return; }
    setHousehold(householdData);

    // Fetch members with their emails via profiles join
    const { data: membersData, error: membersError } = await supabase
      .from('household_members')
      .select('user_id, joined_at')
      .eq('household_id', memberRow.household_id);

    if (membersError) { setError(membersError.message); setLoading(false); return; }

    // Fetch emails for each member from auth.users via RPC or profiles
    const memberList: HouseholdMember[] = await Promise.all(
      (membersData ?? []).map(async (m) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', m.user_id)
          .single();
        // Use user_id as display fallback — email not exposed client-side by default
        return {
          user_id: m.user_id,
          joined_at: m.joined_at,
          email: profile ? `Member ${m.user_id.slice(0, 6)}` : `Member ${m.user_id.slice(0, 6)}`,
        };
      })
    );

    setMembers(memberList);
    setLoading(false);
  }, []);

  useEffect(() => { fetchHousehold(); }, [fetchHousehold]);

  const joinByCode = useCallback(async (code: string): Promise<string | null> => {
    setError(null);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return 'Not authenticated';

    const { data: target, error: findError } = await supabase
      .from('households')
      .select('id')
      .eq('invite_code', code.toUpperCase().trim())
      .single();

    if (findError || !target) return 'Invalid invite code';

    // Leave current household first
    if (household) {
      await supabase
        .from('household_members')
        .delete()
        .eq('household_id', household.id)
        .eq('user_id', user.id);
    }

    const { error: joinError } = await supabase
      .from('household_members')
      .insert({ household_id: target.id, user_id: user.id });

    if (joinError) return joinError.message;

    await fetchHousehold();
    return null;
  }, [household, fetchHousehold]);

  const refreshInviteCode = useCallback(async (): Promise<string | null> => {
    if (!household) return 'No household';
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || household.owner_id !== user.id) return 'Only the owner can refresh the invite code';

    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const { error: updateError } = await supabase
      .from('households')
      .update({ invite_code: newCode })
      .eq('id', household.id);

    if (updateError) return updateError.message;
    setHousehold((prev) => prev ? { ...prev, invite_code: newCode } : prev);
    return null;
  }, [household]);

  return {
    household,
    members,
    loading,
    error,
    joinByCode,
    refreshInviteCode,
    refetch: fetchHousehold,
  };
}
