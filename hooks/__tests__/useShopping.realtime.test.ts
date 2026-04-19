import { renderHook, waitFor, act } from '@testing-library/react-native';
import { useShopping } from '../useShopping';

let insertCallback: ((payload: { new: object }) => void) | null = null;
let deleteCallback: ((payload: { old: { id: string } }) => void) | null = null;
let updateCallback: ((payload: { new: object }) => void) | null = null;

const mockItems = [
  { id: '1', name: 'Bread', quantity: 1, unit: '', checked: false, created_at: '' },
];

jest.mock('@/lib/supabase', () => {
  type MockChannel = { on: jest.Mock; subscribe: jest.Mock };
  const mockChannel: MockChannel = {
    on: jest.fn().mockImplementation((_e: string, filter: { event: string }, cb: (p: object) => void) => {
      if (filter.event === 'INSERT') insertCallback = cb as typeof insertCallback;
      if (filter.event === 'DELETE') deleteCallback = cb as typeof deleteCallback;
      if (filter.event === 'UPDATE') updateCallback = cb as typeof updateCallback;
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
