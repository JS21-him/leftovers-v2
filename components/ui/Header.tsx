import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Logo } from '@/components/Logo';
import { Colors, Spacing, Typography } from '@/constants/theme';

interface HeaderProps {
  title?: string;
  showLogo?: boolean;
  showSettings?: boolean;
}

export function Header({ title, showLogo = false, showSettings = true }: HeaderProps) {
  const router = useRouter();
  return (
    <View style={styles.header}>
      {showLogo ? <Logo size="sm" /> : <Text style={styles.title}>{title}</Text>}
      {showSettings && (
        <TouchableOpacity onPress={() => router.push('/settings')} hitSlop={8}>
          <Text style={styles.gear}>⚙️</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  title: { ...Typography.heading },
  gear: { fontSize: 22 },
});
