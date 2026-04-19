/**
 * Expo Go behaviour test — isolated in its own file so the expo-constants
 * mock (appOwnership: 'expo') doesn't affect the other useNotifications tests.
 */
import { renderHook } from '@testing-library/react-native';

const mockUpsert = jest.fn();

jest.mock('expo-notifications', () => ({
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
}));

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { appOwnership: 'expo' },
}));

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: jest.fn() },
    from: jest.fn().mockReturnValue({ upsert: mockUpsert }),
  },
}));

describe('useNotifications — Expo Go', () => {
  it('does nothing in Expo Go (appOwnership === expo)', async () => {
    const { useNotifications } = require('../useNotifications');
    const Notifications = require('expo-notifications');

    renderHook(() => useNotifications());

    await new Promise((r) => setTimeout(r, 50));
    expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
    expect(mockUpsert).not.toHaveBeenCalled();
  });
});
