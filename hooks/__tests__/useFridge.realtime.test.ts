import { renderHook, waitFor, act } from '@testing-library/react-native';
import { useFridge } from '../useFridge';

// Capture realtime callbacks so tests can trigger them
let insertCallback: ((payload: { new: object }) => void) | null = null;
let deleteCallback: ((payload: { old: { id: string } }) => void) | null = null;

const mockItems = [
  { id: '1', name: 'Eggs', quantity: 6, unit: '', expiry_date: '2026-04-25', created_at: '' },
];

jest.mock('@/lib/supabase', () => {
  type MockChannel = { on: jest.Mock; subscribe: jest.Mock };
  const mockChannel: MockChannel = {
    on: jest.fn().mockImplementation((_e: string, filter: { event: string }, cb: (p: object) => void) => {
      if (filter.event === 'INSERT') insertCallback = cb as typeof insertCallback;
      if (filter.event === 'DELETE') deleteCallback = cb as typeof deleteCallback;
      return mockChannel;
    }),
    subscribe: jest.fn().mockImplementation(() => mockChannel),
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
      channel: jest.fn().mockReturnValue({
        on: jest.fn().mockImplementation((_e: string, filter: { event: string }, cb: (p: object) => void) => {
          if (filter.event === 'INSERT') insertCallback = cb as typeof insertCallback;
          if (filter.event === 'DELETE') deleteCallback = cb as typeof deleteCallback;
          return {
            on: jest.fn().mockImplementation((_e2: string, filter2: { event: string }, cb2: (p: object) => void) => {
              if (filter2.event === 'INSERT') insertCallback = cb2 as typeof insertCallback;
              if (filter2.event === 'DELETE') deleteCallback = cb2 as typeof deleteCallback;
              return { subscribe: jest.fn() };
            }),
            subscribe: jest.fn(),
          };
        }),
      }),
      removeChannel: jest.fn(),
    },
  };
});

describe('useFridge realtime', () => {
  beforeEach(() => {
    insertCallback = null;
    deleteCallback = null;
  });

  it('subscribes to fridge_items channel after fetching household', async () => {
    const { supabase } = require('@/lib/supabase');
    const { result } = renderHook(() => useFridge());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(supabase.channel).toHaveBeenCalledWith(expect.stringContaining('hh-1'));
  });

  it('appends new item to state on INSERT event', async () => {
    const { result } = renderHook(() => useFridge());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items).toHaveLength(1);

    const newItem = { id: '2', name: 'Milk', quantity: 1, unit: 'L', expiry_date: '2026-04-26', created_at: '' };
    act(() => { insertCallback?.({ new: newItem }); });

    expect(result.current.items).toHaveLength(2);
    expect(result.current.items.find((i: { id: string }) => i.id === '2')).toBeDefined();
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
