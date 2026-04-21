import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/Button';
import { Colors, Spacing, Typography } from '@/constants/theme';

export default function OnboardingScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleScan() {
    setLoading(true);
    try {
      await supabase.auth.signInAnonymously();
      router.replace('/scan-preview');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Logo size="lg" showTagline />
      <Text style={styles.value}>See what you can cook with what you have.</Text>
      <Button
        label={loading ? 'Getting ready...' : 'Scan My Fridge'}
        onPress={handleScan}
        loading={loading}
        style={styles.cta}
      />
      <TouchableOpacity onPress={() => router.push('/(auth)/login')} style={styles.loginBtn}>
        <Text style={styles.loginText}>I already have an account</Text>
      </TouchableOpacity>
      <Text style={styles.finePrint}>No account needed to get started</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  value: {
    ...Typography.body,
    textAlign: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
    fontSize: 16,
    lineHeight: 24,
  },
  cta: { width: '100%' },
  loginBtn: { marginTop: Spacing.md, padding: Spacing.sm },
  loginText: { ...Typography.body, color: Colors.textMuted },
  finePrint: { ...Typography.caption, color: Colors.textMuted, marginTop: Spacing.sm },
});
