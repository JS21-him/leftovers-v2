import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '@/components/ui/Button';
import { PremiumGate } from '@/components/ui/PremiumGate';
import { useToast } from '@/components/ui/Toast';
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
  if (status !== 'granted') return 'PERMISSION_DENIED';
  const result = await ImagePicker.launchCameraAsync({ base64: true, quality: 0.7 });
  if (result.canceled || !result.assets[0]?.base64) return null;
  return result.assets[0].base64;
}

export function ScanButtons({ onItemsScanned, skipGate = false }: Props) {
  const { showToast } = useToast();
  const [loadingFridge, setLoadingFridge] = useState(false);
  const [loadingReceipt, setLoadingReceipt] = useState(false);

  async function handleScanFridge() {
    const result = await pickAndEncodeImage();
    if (result === 'PERMISSION_DENIED') {
      showToast({ message: 'Camera permission is required to scan your fridge.', type: 'error' });
      return;
    }
    if (!result) return;
    setLoadingFridge(true);
    try {
      const items = await scanFridge(result);
      await onItemsScanned(items);
    } catch {
      showToast({ message: 'Could not read the fridge photo. Please try again.', type: 'error' });
    } finally {
      setLoadingFridge(false);
    }
  }

  async function handleScanReceipt() {
    const result = await pickAndEncodeImage();
    if (result === 'PERMISSION_DENIED') {
      showToast({ message: 'Camera permission is required to scan a receipt.', type: 'error' });
      return;
    }
    if (!result) return;
    setLoadingReceipt(true);
    try {
      const items = await scanReceipt(result);
      await onItemsScanned(items);
    } catch {
      showToast({ message: 'Could not read the receipt. Please try again.', type: 'error' });
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
