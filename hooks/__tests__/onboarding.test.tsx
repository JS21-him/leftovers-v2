import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import OnboardingScreen from '@/app/(auth)/onboarding';

const mockReplace = jest.fn();
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace, push: mockPush }),
}));

jest.mock('react-native-svg', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: ({ children, ...p }: any) => <View {...p}>{children}</View>,
    Rect: (p: any) => <View {...p} />,
    Line: (p: any) => <View {...p} />,
    Svg: ({ children, ...p }: any) => <View {...p}>{children}</View>,
  };
});

// Mock the Toast hook so we can assert on error toasts
const mockShowToast = jest.fn();
jest.mock('@/components/ui/Toast', () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

const mockUpsert = jest.fn().mockResolvedValue({ error: null });
const mockSignInAnonymously = jest.fn().mockResolvedValue({
  data: { user: { id: 'anon-123' }, session: {} },
  error: null,
});
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { signInAnonymously: (...a: any[]) => mockSignInAnonymously(...a) },
    from: () => ({ upsert: (...a: any[]) => mockUpsert(...a) }),
  },
}));

// Helper: advance the onboarding to the scan step (step index 2)
async function advanceToScanStep(getByText: (t: string) => any, fireEvent: any) {
  // Step 0 → 1
  fireEvent.press(getByText('Get Started'));
  // Step 1 → 2
  fireEvent.press(getByText('Continue'));
}

describe('OnboardingScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders Get Started on the welcome step', () => {
    const { getByText } = render(<OnboardingScreen />);
    expect(getByText('Get Started')).toBeTruthy();
  });

  it('renders login link on welcome step', () => {
    const { getByText } = render(<OnboardingScreen />);
    expect(getByText('I already have an account')).toBeTruthy();
  });

  it('login link navigates to login', () => {
    const { getByText } = render(<OnboardingScreen />);
    fireEvent.press(getByText('I already have an account'));
    expect(mockPush).toHaveBeenCalledWith('/(auth)/login');
  });

  it('Get Started advances to preferences step', () => {
    const { getByText } = render(<OnboardingScreen />);
    fireEvent.press(getByText('Get Started'));
    expect(getByText('Continue')).toBeTruthy();
  });

  it('Continue advances to scan step showing Scan My Fridge button', async () => {
    const { getByText } = render(<OnboardingScreen />);
    await advanceToScanStep(getByText, fireEvent);
    expect(getByText('Scan My Fridge')).toBeTruthy();
  });

  it('Scan My Fridge calls signInAnonymously and navigates to scan-preview', async () => {
    const { getByText } = render(<OnboardingScreen />);
    await advanceToScanStep(getByText, fireEvent);
    fireEvent.press(getByText('Scan My Fridge'));
    await waitFor(() => {
      expect(mockSignInAnonymously).toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith('/scan-preview');
    });
  });

  it('shows error toast and does not navigate if signInAnonymously returns error', async () => {
    mockSignInAnonymously.mockResolvedValueOnce({ data: { user: null }, error: { message: 'Network error' } });
    const { getByText } = render(<OnboardingScreen />);
    await advanceToScanStep(getByText, fireEvent);
    fireEvent.press(getByText('Scan My Fridge'));
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Network error', type: 'error' }),
      );
      expect(mockReplace).not.toHaveBeenCalled();
    });
  });

  it('Add items manually goes directly to fridge without scan', async () => {
    const { getByText } = render(<OnboardingScreen />);
    await advanceToScanStep(getByText, fireEvent);
    fireEvent.press(getByText('Add items manually instead'));
    await waitFor(() => {
      expect(mockSignInAnonymously).toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith('/(tabs)/fridge');
    });
  });
});
