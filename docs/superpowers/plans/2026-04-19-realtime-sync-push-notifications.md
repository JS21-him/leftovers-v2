# Real-time Sync + Push Notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Supabase Realtime subscriptions to the fridge and shopping hooks so household members see instant updates, and add a daily server-side push notification that fires when fridge items expire the next day.

**Architecture:** Realtime subscriptions are added to `useFridge` and `useShopping` alongside existing fetch logic — they watch for DB changes and update local state directly. Push notifications use a new `useNotifications` hook (token registration) plus a Supabase Edge Function triggered by pg_cron daily at 8am UTC.

**Tech Stack:** `expo-notifications`, Supabase Realtime (`@supabase/supabase-js` already installed), Supabase Edge Functions (Deno), Expo Push API (free, no account needed), pg_cron + pg_net (pre-installed on Supabase)

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `hooks/useFridge.ts` | Modify | Add Realtime subscription for INSERT/DELETE |
| `hooks/useShopping.ts` | Modify | Add Realtime subscription for INSERT/DELETE/UPDATE |
| `hooks/useNotifications.ts` | Create | Permission request + push token upsert to Supabase |
| `app/_layout.tsx` | Modify | Call `useNotifications` after session confirmed |
| `supabase/migrations/003_push_token.sql` | Create | Add `push_token` column to `profiles` |
| `supabase/functions/send-expiry-notifications/index.ts` | Create | Daily cron Edge Function — query expiry, send pushes |
| `hooks/__tests__/useFridge.realtime.test.ts` | Create | Realtime subscription tests for useFridge |
| `hooks/__tests__/useShopping.realtime.test.ts` | Create | Realtime subscription tests for useShopping |
| `hooks/__tests__/useNotifications.test.ts` | Create | Token registration tests |

---

## Task 1: Install expo-notifications

**Files:**
- Modify: `package.json` (via npm install)

- [ ] **Step 1: Install the package**

```bash
cd leftovers-v2
npx expo install expo-notifications
```

Expected output: package added, no errors.

- [ ] **Step 2: Verify types compile**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: install expo-notifications"
```

---

## Task 2: Add push_token column to profiles

**Files:**
- Create: `supabase/migrations/003_push_token.sql`

- [ ] **Step 1: Create the migration file**

Create `supabase/migrations/003_push_token.sql`:

```sql
alter table profiles
  add column if not exists push_token text;
```

- [ ] **Step 2: Apply the migration in Supabase dashboard**

Go to the Supabase dashboard → SQL Editor → paste and run the migration SQL above.

Verify: `profiles` table now has a `push_token` column (nullable text).

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/003_push_token.sql
git commit -m "feat: add push_token column to profiles"
```

---

## Task 3: Real-time sync for useFridge

**Files:**
- Create: `hooks/__tests__/useFridge.realtime.test.ts`
- Modify: `hooks/useFridge.ts`

- [ ] **Step 1: Write the failing tests**

Create `hooks/__tests__/useFridge.realtime.test.ts`:

```typescript
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { useFridge } from '../useFridge';

// Capture realtime callbacks so tests can trigger them
let insertCallback: ((payload: { new: object }) => void) | null = null;
let deleteCallback: ((payload: { old: { id: string } }) => void) | null = null;
let removedChannel = false;

const mockChannel = {
  on: jest.fn().mockImplementation((_event: string, filter: { event: string }, cb: (payload: object) => void) => {
    if (filter.event === 'INSERT') insertCallback = cb as typeof insertCallback;
    if (filter.event === 'DELETE') deleteCallback = cb as typeof deleteCallback;
    return mockChannel;
  }),
  subscribe: jest.fn().mockReturnValue(mockChannel),
};

const mockItems = [
  { id: '1', name: 'Eggs', quantity: 6, unit: '', expiry_date: '2026-04-25', created_at: '' },
];

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }),
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ data: mockItems, error: null }),
      insert: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: mockItems[0], error: null }),
    }),
    channel: jest.fn().mockReturnValue(mockChannel),
    removeChannel: jest.fn().mockImplementation(() => { removedChannel = true; }),
  },
}));

// Mock household lookup to return a household_id
jest.mock('@/lib/supabase', () => {
  const mockChannel = {
    on: jest.fn().mockImplementation((_e: string, filter: { event: string }, cb: (p: object) => void) => {
      if (filter.event === 'INSERT') insertCallback = cb as typeof insertCallback;
      if (filter.event === 'DELETE') deleteCallback = cb as typeof deleteCallback;
      return mockChannel;
    }),
    subscribe: jest.fn().mockReturnValue(mockChannel),
  };
  return {
    supabase: {
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }),
      },
      from: jest.fn().mockImplementation((table: string) => {
        if (table === 'household_members') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({ data: { household_id: 'hh-1' }, error: null }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ data: mockItems, error: null }),
          insert: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
          delete: jest.fn().mockReturnThis(),
        };
      }),
      channel: jest.fn().mockReturnValue(mockChannel),
      removeChannel: jest.fn().mockImplementation(() => { removedChannel = true; }),
    },
  };
});

describe('useFridge realtime', () => {
  beforeEach(() => {
    insertCallback = null;
    deleteCallback = null;
    removedChannel = false;
  });

  it('subscribes to fridge_items channel after fetching household', async () => {
    const { supabase } = require('@/lib/supabase');
    const { result } = renderHook(() => useFridge());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(supabase.channel).toHaveBeenCalledWith(expect.stringContaining('hh-1'));
    expect(mockChannel.subscribe).toHaveBeenCalled();
  });

  it('appends new item to state on INSERT event', async () => {
    const { result } = renderHook(() => useFridge());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items).toHaveLength(1);

    const newItem = { id: '2', name: 'Milk', quantity: 1, unit: 'L', expiry_date: '2026-04-26', created_at: '' };
    act(() => { insertCallback?.({ new: newItem }); });

    expect(result.current.items).toHaveLength(2);
    expect(result.current.items.find(i => i.id === '2')).toBeDefined();
  });

  it('removes item from state on DELETE event', async () => {
    const { result } = renderHook(() => useFridge());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items).toHaveLength(1);

    act(() => { deleteCallback?.({ old: { id: '1' } }); });

    expect(result.current.items).toHaveLength(0);
  });

  it('removes channel on unmount', async () => {
    const { supabase } = require('@/lib/supabase');
    const { result, unmount } = renderHook(() => useFridge());
    await waitFor(() => expect(result.current.loading).toBe(false));
    unmount();
    expect(supabase.removeChannel).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx jest hooks/__tests__/useFridge.realtime.test.ts --no-coverage
```

Expected: FAIL — `useFridge` doesn't subscribe yet.

- [ ] **Step 3: Update useFridge to add Realtime subscription**

Replace the entire contents of `hooks/useFridge.ts`:

```typescript
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

  // Realtime subscription — fires after householdId is resolved
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
    // Realtime will handle adding to state — no manual setItems here
    return data;
  }, []);

  const deleteItem = useCallback(async (id: string) => {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) { setError(authError.message); return; }
    if (!user) return;
    const { error: deleteError } = await supabase.from('fridge_items').delete().eq('id', id);
    if (deleteError) { setError(deleteError.message); return; }
    // Realtime will handle removing from state — no manual setItems here
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
```

> **Note:** `addItem` and `deleteItem` no longer call `setItems` directly — Realtime handles all state updates. This avoids duplicate items when the user's own mutations fire a Realtime event back.

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx jest hooks/__tests__/useFridge.realtime.test.ts --no-coverage
```

Expected: PASS (4 tests).

- [ ] **Step 5: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add hooks/useFridge.ts hooks/__tests__/useFridge.realtime.test.ts
git commit -m "feat: add realtime sync to useFridge"
```

---

## Task 4: Real-time sync for useShopping

**Files:**
- Create: `hooks/__tests__/useShopping.realtime.test.ts`
- Modify: `hooks/useShopping.ts`

- [ ] **Step 1: Write the failing tests**

Create `hooks/__tests__/useShopping.realtime.test.ts`:

```typescript
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { useShopping } from '../useShopping';

let insertCallback: ((payload: { new: object }) => void) | null = null;
let deleteCallback: ((payload: { old: { id: string } }) => void) | null = null;
let updateCallback: ((payload: { new: object }) => void) | null = null;

const mockItems = [
  { id: '1', name: 'Bread', quantity: 1, unit: '', checked: false, created_at: '' },
];

jest.mock('@/lib/supabase', () => {
  const mockChannel = {
    on: jest.fn().mockImplementation((_e: string, filter: { event: string }, cb: (p: object) => void) => {
      if (filter.event === 'INSERT') insertCallback = cb as typeof insertCallback;
      if (filter.event === 'DELETE') deleteCallback = cb as typeof deleteCallback;
      if (filter.event === 'UPDATE') updateCallback = cb as typeof updateCallback;
      return mockChannel;
    }),
    subscribe: jest.fn().mockReturnValue(mockChannel),
  };
  return {
    supabase: {
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }),
      },
      from: jest.fn().mockImplementation((table: string) => {
        if (table === 'household_members') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({ data: { household_id: 'hh-1' }, error: null }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ data: mockItems, error: null }),
          insert: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
          update: jest.fn().mockReturnThis(),
          delete: jest.fn().mockReturnThis(),
          in: jest.fn().mockResolvedValue({ data: null, error: null }),
        };
      }),
      channel: jest.fn().mockReturnValue(mockChannel),
      removeChannel: jest.fn(),
    },
  };
});

describe('useShopping realtime', () => {
  beforeEach(() => {
    insertCallback = null;
    deleteCallback = null;
    updateCallback = null;
  });

  it('appends new item on INSERT event', async () => {
    const { result } = renderHook(() => useShopping());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items).toHaveLength(1);

    const newItem = { id: '2', name: 'Milk', quantity: 1, unit: '', checked: false, created_at: '' };
    act(() => { insertCallback?.({ new: newItem }); });

    expect(result.current.items).toHaveLength(2);
  });

  it('removes item on DELETE event', async () => {
    const { result } = renderHook(() => useShopping());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => { deleteCallback?.({ old: { id: '1' } }); });

    expect(result.current.items).toHaveLength(0);
  });

  it('updates item on UPDATE event', async () => {
    const { result } = renderHook(() => useShopping());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items[0].checked).toBe(false);

    act(() => { updateCallback?.({ new: { id: '1', name: 'Bread', quantity: 1, unit: '', checked: true, created_at: '' } }); });

    expect(result.current.items[0].checked).toBe(true);
  });

  it('removes channel on unmount', async () => {
    const { supabase } = require('@/lib/supabase');
    const { result, unmount } = renderHook(() => useShopping());
    await waitFor(() => expect(result.current.loading).toBe(false));
    unmount();
    expect(supabase.removeChannel).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx jest hooks/__tests__/useShopping.realtime.test.ts --no-coverage
```

Expected: FAIL.

- [ ] **Step 3: Update useShopping to add Realtime subscription**

Replace the entire contents of `hooks/useShopping.ts`:

```typescript
import { useState, useEffect, useCallback } from 'react';
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

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) { setError(authError.message); setLoading(false); return; }
    if (!user) { setLoading(false); return; }

    const hid = await getHouseholdId(user.id);
    setHouseholdId(hid);

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
    const { error: insertError } = await supabase
      .from('shopping_list_items')
      .insert({ name, quantity, unit, user_id: user.id, household_id: hid });
    if (insertError) setError(insertError.message);
    // Realtime handles state update
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
    if (updateError) setError(updateError.message);
    // Realtime handles state update
  }, []);

  const deleteItem = useCallback(async (id: string) => {
    const { error: deleteError } = await supabase.from('shopping_list_items').delete().eq('id', id);
    if (deleteError) setError(deleteError.message);
    // Realtime handles state update
  }, []);

  const clearChecked = useCallback(async () => {
    let checkedIds: string[] = [];
    setItems((prev) => { checkedIds = prev.filter((i) => i.checked).map((i) => i.id); return prev; });
    if (checkedIds.length === 0) return;
    const { error: deleteError } = await supabase.from('shopping_list_items').delete().in('id', checkedIds);
    if (deleteError) setError(deleteError.message);
    // Realtime handles state update
  }, []);

  return { items, loading, error, addItem, toggleItem, deleteItem, clearChecked, refetch: fetchItems };
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx jest hooks/__tests__/useShopping.realtime.test.ts --no-coverage
```

Expected: PASS (4 tests).

- [ ] **Step 5: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add hooks/useShopping.ts hooks/__tests__/useShopping.realtime.test.ts
git commit -m "feat: add realtime sync to useShopping"
```

---

## Task 5: useNotifications hook

**Files:**
- Create: `hooks/__tests__/useNotifications.test.ts`
- Create: `hooks/useNotifications.ts`

- [ ] **Step 1: Write the failing tests**

Create `hooks/__tests__/useNotifications.test.ts`:

```typescript
import { renderHook, waitFor } from '@testing-library/react-native';
import { useNotifications } from '../useNotifications';

const mockToken = 'ExponentPushToken[test-token-123]';

jest.mock('expo-notifications', () => ({
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getExpoPushTokenAsync: jest.fn().mockResolvedValue({ data: mockToken }),
}));

jest.mock('expo-constants', () => ({
  default: {
    appOwnership: 'standalone', // simulate dev build
    expoConfig: { extra: { eas: { projectId: 'test-project-id' } } },
  },
}));

const mockUpsert = jest.fn().mockResolvedValue({ error: null });

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }),
    },
    from: jest.fn().mockReturnValue({
      upsert: mockUpsert,
    }),
  },
}));

describe('useNotifications', () => {
  beforeEach(() => {
    mockUpsert.mockClear();
  });

  it('requests permission and saves token to profiles', async () => {
    const Notifications = require('expo-notifications');
    renderHook(() => useNotifications());

    await waitFor(() => {
      expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
      expect(Notifications.getExpoPushTokenAsync).toHaveBeenCalled();
      expect(mockUpsert).toHaveBeenCalledWith(
        { id: 'user-1', push_token: mockToken },
        { onConflict: 'id' }
      );
    });
  });

  it('does nothing in Expo Go (appOwnership === expo)', async () => {
    jest.resetModules();
    jest.mock('expo-constants', () => ({
      default: { appOwnership: 'expo' },
    }));
    jest.mock('expo-notifications', () => ({
      requestPermissionsAsync: jest.fn(),
      getExpoPushTokenAsync: jest.fn(),
    }));
    jest.mock('@/lib/supabase', () => ({
      supabase: {
        auth: { getUser: jest.fn() },
        from: jest.fn().mockReturnValue({ upsert: mockUpsert }),
      },
    }));

    const { useNotifications: useNotificationsReset } = require('../useNotifications');
    renderHook(() => useNotificationsReset());

    await new Promise((r) => setTimeout(r, 50));
    const Notifications = require('expo-notifications');
    expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it('does not save token if permission denied', async () => {
    const Notifications = require('expo-notifications');
    Notifications.requestPermissionsAsync.mockResolvedValueOnce({ status: 'denied' });

    renderHook(() => useNotifications());
    await new Promise((r) => setTimeout(r, 50));
    expect(mockUpsert).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx jest hooks/__tests__/useNotifications.test.ts --no-coverage
```

Expected: FAIL — `useNotifications` doesn't exist yet.

- [ ] **Step 3: Create useNotifications hook**

Create `hooks/useNotifications.ts`:

```typescript
import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { supabase } from '@/lib/supabase';

export function useNotifications() {
  useEffect(() => {
    // Skip in Expo Go — push tokens require a dev build
    if (Constants.appOwnership === 'expo') return;

    async function registerToken() {
      try {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') return;

        const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
        const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
        if (!token) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await supabase.from('profiles').upsert({ id: user.id, push_token: token }, { onConflict: 'id' });
      } catch {
        // Silently fail — notifications are non-critical
      }
    }

    registerToken();
  }, []);
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx jest hooks/__tests__/useNotifications.test.ts --no-coverage
```

Expected: PASS (3 tests).

- [ ] **Step 5: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add hooks/useNotifications.ts hooks/__tests__/useNotifications.test.ts
git commit -m "feat: add useNotifications hook for push token registration"
```

---

## Task 6: Wire useNotifications into _layout.tsx

**Files:**
- Modify: `app/_layout.tsx`

- [ ] **Step 1: Add useNotifications call to root layout**

In `app/_layout.tsx`, add the import and call the hook after the existing imports:

```typescript
import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { initializePurchases } from '@/lib/purchases';
import { Colors } from '@/constants/theme';

export default function RootLayout() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useNotifications();

  useEffect(() => {
    initializePurchases();
  }, []);

  useEffect(() => {
    if (loading || !segments[0]) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!session && !inAuthGroup) {
      router.replace('/(auth)/onboarding');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)/fridge');
    }
  }, [session, loading, segments]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.background } }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
        <Stack.Screen name="recipe/[id]" options={{ presentation: 'card' }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/_layout.tsx
git commit -m "feat: wire useNotifications into root layout"
```

---

## Task 7: send-expiry-notifications Edge Function

**Files:**
- Create: `supabase/functions/send-expiry-notifications/index.ts`

- [ ] **Step 1: Create the Edge Function**

Create `supabase/functions/send-expiry-notifications/index.ts`:

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

Deno.serve(async () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response('Missing env vars', { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Find all items expiring tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD

  const { data: expiringItems, error } = await supabase
    .from('fridge_items')
    .select('name, household_id')
    .eq('expiry_date', tomorrowStr);

  if (error) {
    console.error('Error fetching expiring items:', error.message);
    return new Response('DB error', { status: 500 });
  }

  if (!expiringItems || expiringItems.length === 0) {
    return new Response('No expiring items today', { status: 200 });
  }

  // Group item names by household_id
  const byHousehold: Record<string, string[]> = {};
  for (const item of expiringItems) {
    if (!byHousehold[item.household_id]) byHousehold[item.household_id] = [];
    byHousehold[item.household_id].push(item.name);
  }

  // Build push messages for each household
  const messages: { to: string; title: string; body: string }[] = [];

  for (const [householdId, names] of Object.entries(byHousehold)) {
    // Get push tokens for all members of this household
    const { data: members } = await supabase
      .from('household_members')
      .select('user_id')
      .eq('household_id', householdId);

    if (!members || members.length === 0) continue;

    const userIds = members.map((m: { user_id: string }) => m.user_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('push_token')
      .in('id', userIds)
      .not('push_token', 'is', null);

    if (!profiles || profiles.length === 0) continue;

    // Format notification body
    const MAX_NAMED = 3;
    const named = names.slice(0, MAX_NAMED).join(', ');
    const extra = names.length > MAX_NAMED ? ` and ${names.length - MAX_NAMED} more` : '';
    const body = `Heads up! ${named}${extra} expire${names.length === 1 ? 's' : ''} tomorrow.`;

    for (const profile of profiles) {
      if (!profile.push_token) continue;
      messages.push({
        to: profile.push_token,
        title: 'Leftovers',
        body,
      });
    }
  }

  if (messages.length === 0) {
    return new Response('No tokens to notify', { status: 200 });
  }

  // Send to Expo Push API
  const pushResponse = await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(messages),
  });

  if (!pushResponse.ok) {
    const text = await pushResponse.text();
    console.error('Expo push error:', text);
    return new Response('Push send failed', { status: 500 });
  }

  return new Response(`Sent ${messages.length} notification(s)`, { status: 200 });
});
```

- [ ] **Step 2: Deploy the Edge Function**

```bash
npx supabase functions deploy send-expiry-notifications --no-verify-jwt
```

`--no-verify-jwt` is required because this function is called by the cron job, not by a user with a JWT.

- [ ] **Step 3: Test the function manually**

In Supabase dashboard → Edge Functions → `send-expiry-notifications` → Invoke. Or via curl with your service role key:

```bash
curl -X POST https://noykaaacbqfubspubjhl.supabase.co/functions/v1/send-expiry-notifications \
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>"
```

Expected: `"No expiring items today"` or `"Sent N notification(s)"` — no 500 errors.

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/send-expiry-notifications/index.ts
git commit -m "feat: add send-expiry-notifications edge function"
```

---

## Task 8: Manual setup — Enable Realtime + pg_cron

> These are one-time setup steps in the Supabase dashboard. Not automated.

- [ ] **Step 1: Enable Realtime for fridge_items**

Supabase dashboard → Database → Replication → Tables → enable `fridge_items`.

- [ ] **Step 2: Enable Realtime for shopping_list_items**

Same place → enable `shopping_list_items`.

- [ ] **Step 3: Set up pg_cron job**

Supabase dashboard → SQL Editor → run:

```sql
select cron.schedule(
  'expiry-notifications',
  '0 8 * * *',
  $$
    select net.http_post(
      url := 'https://noykaaacbqfubspubjhl.supabase.co/functions/v1/send-expiry-notifications',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      ),
      body := '{}'::jsonb
    )
  $$
);
```

> **Note:** If `current_setting('app.service_role_key')` is unavailable, hardcode the service role key string directly (it's server-side only, not exposed to clients).

- [ ] **Step 4: Verify cron is scheduled**

```sql
select * from cron.job;
```

Expected: row with `jobname = 'expiry-notifications'` and `schedule = '0 8 * * *'`.

- [ ] **Step 5: Run full test suite**

```bash
npx jest --no-coverage
```

Expected: all tests pass.

- [ ] **Step 6: Final commit and push**

```bash
git add -A
git commit -m "feat: complete realtime sync and push notifications"
git push origin main
```

---

## Summary

| Feature | Status after plan |
|---|---|
| Real-time fridge sync | Live — household members see instant updates |
| Real-time shopping sync | Live — check/add/delete syncs instantly |
| Push token registration | Code shipped — fires on dev build, silent no-op on Expo Go |
| Daily expiry notifications | Fires at 8am UTC for items expiring the next day |
