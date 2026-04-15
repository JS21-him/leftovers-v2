import { renderHook } from '@testing-library/react-native';
import { useFridge } from '@/hooks/useFridge';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: [], error: null }),
      insert: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: '1', name: 'Eggs', quantity: 6, unit: '', expiry_date: '2026-04-20', created_at: '' },
        error: null,
      }),
      delete: jest.fn().mockReturnThis(),
    })),
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }),
    },
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
