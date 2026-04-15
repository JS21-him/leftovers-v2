import React from 'react';
import { View, StyleSheet, Linking, Alert } from 'react-native';
import { Button } from '@/components/ui/Button';
import { PremiumGate } from '@/components/ui/PremiumGate';
import { buildInstacartUrl, buildWalmartUrl } from '@/lib/deeplinks';
import { Spacing } from '@/constants/theme';

interface Props {
  itemNames: string[];
}

async function openUrl(url: string, service: string) {
  const supported = await Linking.canOpenURL(url);
  if (supported) {
    await Linking.openURL(url);
  } else {
    Alert.alert('Cannot open', `Unable to open ${service}. Make sure the app is installed or try later.`);
  }
}

export function OrderButtons({ itemNames }: Props) {
  return (
    <PremiumGate feature="Instacart and Walmart ordering">
      <View style={styles.container}>
        <Button
          label="🛍 Order on Instacart"
          onPress={() => openUrl(buildInstacartUrl(itemNames), 'Instacart')}
          style={styles.instacart}
        />
        <Button
          label="🛒 Order on Walmart"
          onPress={() => openUrl(buildWalmartUrl(itemNames), 'Walmart')}
          style={styles.walmart}
        />
      </View>
    </PremiumGate>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.md, gap: Spacing.sm },
  instacart: { backgroundColor: '#1c1917' },
  walmart: { backgroundColor: '#0071ce' },
});
