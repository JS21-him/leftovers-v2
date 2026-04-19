import { renderHook, waitFor } from '@testing-library/react-native';

const mockToken = 'ExponentPushToken[test-token-123]';
const mockUpsert = jest.fn().mockResolvedValue({ error: null });

jest.mock('expo-notifications', () => ({
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getExpoPushTokenAsync: jest.fn().mockResolvedValue({ data: mockToken }),
}));

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    appOwnership: 'standalone',
    expoConfig: { extra: { eas: { projectId: 'test-project-id' } } },
  },
}));

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
    jest.clearAllMocks();
    mockUpsert.mockResolvedValue({ error: null });
  });

  it('requests permission and saves token to profiles', async () => {
    const { useNotifications } = require('../useNotifications');
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

  it('does not save token if permission denied', async () => {
    const Notifications = require('expo-notifications');
    Notifications.requestPermissionsAsync.mockResolvedValueOnce({ status: 'denied' });

    const { useNotifications } = require('../useNotifications');
    renderHook(() => useNotifications());

    await new Promise((r) => setTimeout(r, 100));
    expect(mockUpsert).not.toHaveBeenCalled();
  });
});
