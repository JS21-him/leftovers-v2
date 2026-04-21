import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Line } from 'react-native-svg';
import { Colors } from '@/constants/theme';

export type LogoSize = 'sm' | 'md' | 'lg';

const SIZES: Record<LogoSize, { fontSize: number; iconW: number; iconH: number }> = {
  sm: { fontSize: 28, iconW: 17, iconH: 28 },
  md: { fontSize: 42, iconW: 25, iconH: 42 },
  lg: { fontSize: 52, iconW: 31, iconH: 52 },
};

function FridgeIcon({ width, height }: { width: number; height: number }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 28 54">
      {/* Outer body */}
      <Rect x="1" y="1" width="22" height="52" rx="2.5" stroke={Colors.primary} strokeWidth="2.5" fill="none" />
      {/* Freezer divider */}
      <Line x1="1" y1="15" x2="23" y2="15" stroke={Colors.primary} strokeWidth="2" />
      {/* Shelf 1 */}
      <Line x1="5" y1="26" x2="18" y2="26" stroke={Colors.primary} strokeWidth="1.5" strokeLinecap="round" />
      {/* Shelf 2 */}
      <Line x1="5" y1="35" x2="18" y2="35" stroke={Colors.primary} strokeWidth="1.5" strokeLinecap="round" />
      {/* Shelf 3 */}
      <Line x1="5" y1="43" x2="18" y2="43" stroke={Colors.primary} strokeWidth="1.5" strokeLinecap="round" />
      {/* Freezer handle */}
      <Rect x="17" y="3" width="3" height="8" rx="1.5" fill={Colors.primary} />
      {/* Fridge handle */}
      <Rect x="17" y="18" width="3" height="10" rx="1.5" fill={Colors.primary} />
    </Svg>
  );
}

interface LogoProps {
  size: LogoSize;
  showTagline?: boolean;
}

export function Logo({ size, showTagline = false }: LogoProps) {
  const { fontSize, iconW, iconH } = SIZES[size];
  const letterStyle = { fontSize, fontWeight: '900' as const, color: Colors.textPrimary, fontFamily: 'System', lineHeight: fontSize };

  return (
    <View style={styles.wrapper}>
      <View style={styles.wordmark}>
        <Text style={letterStyle}>L</Text>
        <FridgeIcon width={iconW} height={iconH} />
        <Text style={letterStyle}>FTOVERS</Text>
      </View>
      {showTagline && (
        <>
          <View style={[styles.divider, { marginTop: size === 'lg' ? 14 : 10 }]} />
          <Text style={styles.tagline}>Stop wasting food.</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center' },
  wordmark: { flexDirection: 'row', alignItems: 'flex-end', gap: 0 },
  divider: { width: 44, height: 3, backgroundColor: Colors.primary, borderRadius: 2, marginTop: 10 },
  tagline: { color: Colors.textMuted, fontSize: 13, marginTop: 6 },
});
