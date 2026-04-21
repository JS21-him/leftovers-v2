import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { SignUpModal } from '@/components/SignUpModal';

const mockUpdateUser = jest.fn().mockResolvedValue({ error: null });
jest.mock('@/lib/supabase', () => ({
  supabase: { auth: { updateUser: (...args: any[]) => mockUpdateUser(...args) } },
}));

describe('SignUpModal', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders headline and buttons', () => {
    const { getByText } = render(
      <SignUpModal visible onSkip={jest.fn()} onSuccess={jest.fn()} />
    );
    expect(getByText('Your fridge is ready')).toBeTruthy();
    expect(getByText('Create Free Account')).toBeTruthy();
    expect(getByText('Skip for now')).toBeTruthy();
  });

  it('calls onSkip when skip tapped', () => {
    const onSkip = jest.fn();
    const { getByText } = render(
      <SignUpModal visible onSkip={onSkip} onSuccess={jest.fn()} />
    );
    fireEvent.press(getByText('Skip for now'));
    expect(onSkip).toHaveBeenCalled();
  });

  it('calls updateUser and onSuccess when form submitted', async () => {
    const onSuccess = jest.fn();
    const { getByPlaceholderText, getByText } = render(
      <SignUpModal visible onSkip={jest.fn()} onSuccess={onSuccess} />
    );
    fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'secret123');
    fireEvent.press(getByText('Create Free Account'));
    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith({ email: 'test@example.com', password: 'secret123' });
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('shows error if password under 6 chars', async () => {
    const { getByPlaceholderText, getByText } = render(
      <SignUpModal visible onSkip={jest.fn()} onSuccess={jest.fn()} />
    );
    fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), '123');
    fireEvent.press(getByText('Create Free Account'));
    await waitFor(() => {
      expect(getByText('Must be at least 6 characters')).toBeTruthy();
      expect(mockUpdateUser).not.toHaveBeenCalled();
    });
  });
});
