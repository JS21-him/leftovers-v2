import React from 'react';
import { render } from '@testing-library/react-native';
import { Logo } from '@/components/Logo';

jest.mock('react-native-svg', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: ({ children, ...props }: any) => <View {...props}>{children}</View>,
    Rect: (props: any) => <View {...props} />,
    Line: (props: any) => <View {...props} />,
    Svg: ({ children, ...props }: any) => <View {...props}>{children}</View>,
  };
});

describe('Logo', () => {
  it('renders sm without crashing', () => {
    const { getByText } = render(<Logo size="sm" />);
    expect(getByText('L')).toBeTruthy();
    expect(getByText('FTOVERS')).toBeTruthy();
  });

  it('renders md without crashing', () => {
    const { getByText } = render(<Logo size="md" />);
    expect(getByText('L')).toBeTruthy();
  });

  it('renders lg without crashing', () => {
    const { getByText } = render(<Logo size="lg" />);
    expect(getByText('L')).toBeTruthy();
  });

  it('shows tagline when showTagline=true', () => {
    const { getByText } = render(<Logo size="md" showTagline />);
    expect(getByText('Stop wasting food.')).toBeTruthy();
  });

  it('hides tagline by default', () => {
    const { queryByText } = render(<Logo size="md" />);
    expect(queryByText('Stop wasting food.')).toBeNull();
  });
});
