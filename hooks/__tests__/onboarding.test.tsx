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

const mockSignInAnonymously = jest.fn().mockResolvedValue({ data: { session: {} }, error: null });
jest.mock('@/lib/supabase', () => ({
  supabase: { auth: { signInAnonymously: (...a: any[]) => mockSignInAnonymously(...a) } },
}));

describe('OnboardingScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders Scan My Fridge button', () => {
    const { getByText } = render(<OnboardingScreen />);
    expect(getByText('Scan My Fridge')).toBeTruthy();
  });

  it('renders login link', () => {
    const { getByText } = render(<OnboardingScreen />);
    expect(getByText('I already have an account')).toBeTruthy();
  });

  it('login link navigates to login', () => {
    const { getByText } = render(<OnboardingScreen />);
    fireEvent.press(getByText('I already have an account'));
    expect(mockPush).toHaveBeenCalledWith('/(auth)/login');
  });

  it('Scan My Fridge calls signInAnonymously and navigates to scan-preview', async () => {
    const { getByText } = render(<OnboardingScreen />);
    fireEvent.press(getByText('Scan My Fridge'));
    await waitFor(() => {
      expect(mockSignInAnonymously).toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith('/scan-preview');
    });
  });
});
