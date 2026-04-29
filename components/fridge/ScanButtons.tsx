import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '@/components/ui/Button';
import { PremiumGate } from '@/components/ui/PremiumGate';
import { scanFridge, scanReceipt } from '@/lib/claude';
import { Spacing } from '@/constants/theme';
import type { NewFridgeItem } from '@/hooks/useFridge';

interface Props {
  onItemsScanned: (items: NewFridgeItem[]) => Promise<void>;
  /** When true, bypasses the PremiumGate (e.g. during onboarding scan-preview). */
  skipGate?: boolean;
}

async function pickAndEncodeImage(): Promise<string | null> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission needed', 'Camera access is required to scan.');
    return null;
  }
  const result = await ImagePicker.launchCameraAsync({ base64: true, quality: 0.7 });
  if (result.canceled || !result.assets[0]?.base64) return null;
  return result.assets[0].base64;
}

export function ScanButtons({ onItemsScanned, skipGate = false }: Props) {
  const [loadingFridge, setLoadingFridge] = useState(false);
  const [loadingReceipt, setLoadingReceipt] = useState(false);

  async function handleScanFridge() {
    const base64 = await pickAndEncodeImage();
    if (!base64) return;
    setLoadingFridge(true);
    try {
      const items = await scanFridge(base64);
      await onItemsScanned(items);
    } catch {
      Alert.alert('Scan failed', 'Could not read the fridge photo. Please try again.');
    } finally {
      setLoadingFridge(false);
    }
  }

  async function handleScanReceipt() {
    const base64 = await pickAndEncodeImage();
    if (!base64) return;
    setLoadingReceipt(true);
    try {
      const items = await scanReceipt(base64);
      await onItemsScanned(items);
    } catch {
      Alert.alert('Scan failed', 'Could not read the receipt. Please try again.');
    } finally {
      setLoadingReceipt(false);
    }
  }

  const fridgeButton = (
    <Button
      label={loadingFridge ? 'Scanning...' : '📷 Scan Fridge with AI'}
      onPress={handleScanFridge}
      loading={loadingFridge}
    />
  );

  const receiptButton = (
    <Button
      label={loadingReceipt ? 'Scanning...' : '🧾 Scan Receipt'}
      onPress={handleScanReceipt}
      loading={loadingReceipt}
      variant="secondary"
    />
  );

  return (
    <View style={styles.container}>
      {skipGate ? (
        fridgeButton
      ) : (
        <PremiumGate feature="AI fridge scanning">{fridgeButton}</PremiumGate>
      )}
      {skipGate ? (
        receiptButton
      ) : (
        <PremiumGate feature="receipt scanning">{receiptButton}</PremiumGate>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: Spacing.md, gap: Spacing.sm, marginBottom: Spacing.md },
});
