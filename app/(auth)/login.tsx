import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';

export default function LoginScreen() {
  const params = useLocalSearchParams<{ dietary?: string; householdSize?: string }>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  async function handleSubmit() {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter your email and password.');
      return;
    }
    setLoading(true);

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) Alert.alert('Error', error.message);
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        Alert.alert('Error', error.message);
      } else if (data.user && params.dietary) {
        await supabase.from('profiles').update({
          dietary_preferences: JSON.parse(params.dietary),
          household_size: parseInt(params.householdSize ?? '2', 10),
        }).eq('id', data.user.id);
      }
    }

    setLoading(false);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.emoji}>🧊</Text>
      <Text style={styles.title}>{mode === 'login' ? 'Welcome back' : 'Create account'}</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholderTextColor={Colors.textMuted}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholderTextColor={Colors.textMuted}
      />
      <Button
        label={mode === 'login' ? 'Log In' : 'Sign Up'}
        onPress={handleSubmit}
        loading={loading}
        style={styles.button}
      />
      <Button
        label={mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
        onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}
        variant="ghost"
        style={{ marginTop: Spacing.sm }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: Spacing.xl, justifyContent: 'center' },
  emoji: { fontSize: 48, textAlign: 'center', marginBottom: Spacing.md },
  title: { ...Typography.heading, fontSize: 24, textAlign: 'center', marginBottom: Spacing.xl },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Typography.body,
    color: Colors.textPrimary,
  },
  button: { marginTop: Spacing.md },
});
