import { renderHook } from '@testing-library/react-native';
import { useFridge } from '@/hooks/useFridge';

// The builder is thenable so `await builder.eq(...)` resolves correctly.
// Methods like .limit() and .maybeSingle() are needed by getHouseholdId.
const mockBuilder: any = {
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
  insert: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue({
    data: { id: '1', name: 'Eggs', quantity: 6, unit: '', expiry_date: '2026-04-20', created_at: '' },
    error: null,
  }),
  delete: jest.fn().mockReturnThis(),
  then: (resolve: (v: unknown) => void) =>
    Promise.resolve({ data: [], error: null }).then(resolve),
};

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => mockBuilder),
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }),
    },
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn(),
    })),
    removeChannel: jest.fn(),
  },
}));

test('starts with loading true', () => {
  const { result } = renderHook(() => useFridge());
  expect(result.current.loading).toBe(true);
});

test('getExpiringSoon returns items expiring within threshold', () => {
  const { result } = renderHook(() => useFridge());
  // With empty items, expiring soon should be empty
  expect(result.current.getExpiringSoon(5)).toEqual([]);
});
