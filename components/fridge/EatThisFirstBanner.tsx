import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Radius, Spacing } from '@/constants/theme';
import type { FridgeItem } from '@/hooks/useFridge';

interface Props {
  items: FridgeItem[]; // items expiring within 2 days
}

function daysUntil(dateStr: string): number {
  const ms = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export function EatThisFirstBanner({ items }: Props) {
  const router = useRouter();
  if (items.length === 0) return null;

  // Most urgent first (already sorted by expiry in useFridge)
  const urgent = items[0];
  const days = urgent.expiry_date ? daysUntil(urgent.expiry_date) : null;
  const urgencyLabel = days === null ? '' : days <= 0 ? 'Expired' : days === 1 ? 'Expires tomorrow' : `Expires in ${days} days`;

  return (
    <TouchableOpacity
      onPress={() => router.push('/(tabs)/recipes')}
      activeOpacity={0.85}
      style={styles.wrapper}
      accessibilityLabel="View recipe suggestions for expiring items"
    >
      <LinearGradient
        colors={['#ef4444', '#f97316']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.banner}
      >
        <View style={styles.left}>
          <Text style={styles.eyebrow}>EAT THIS FIRST</Text>
          <Text style={styles.itemName} numberOfLines={1}>{urgent.name}</Text>
          {urgencyLabel ? <Text style={styles.urgency}>{urgencyLabel}</Text> : null}
          {items.length > 1 && (
            <Text style={styles.more}>+{items.length - 1} more item{items.length > 2 ? 's' : ''}</Text>
          )}
        </View>
        <View style={styles.right}>
          <Text style={styles.cta}>Find Recipes</Text>
          <Text style={styles.arrow}>→</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    paddingVertical: Spacing.md + 2,
  },
  left: { flex: 1 },
  eyebrow: {
    fontSize: 9,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: 1.2,
    marginBottom: 3,
  },
  itemName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 2,
  },
  urgency: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
  },
  more: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  right: {
    alignItems: 'center',
    marginLeft: Spacing.md,
  },
  cta: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  arrow: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '300',
  },
});
