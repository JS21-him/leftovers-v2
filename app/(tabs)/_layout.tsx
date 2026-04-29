import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Colors } from '@/constants/theme';

// Animated tab icon with scale-up on focus
function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  const scale = useSharedValue(focused ? 1.15 : 1);

  React.useEffect(() => {
    scale.value = withSpring(focused ? 1.15 : 1, { damping: 14, stiffness: 200 });
  }, [focused]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.Text style={[styles.tabEmoji, { opacity: focused ? 1 : 0.45 }, animStyle]}>
      {emoji}
    </Animated.Text>
  );
}

function TabBarBackground() {
  if (Platform.OS === 'ios') {
    return (
      <BlurView
        intensity={80}
        tint="light"
        style={StyleSheet.absoluteFill}
      />
    );
  }
  return null;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.tabActive,
        tabBarInactiveTintColor: Colors.tabInactive,
        tabBarStyle: {
          // iOS: transparent so BlurView shows through
          backgroundColor: Platform.OS === 'ios' ? 'transparent' : Colors.background,
          borderTopColor: Colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          // Extra height for safe area feel
          paddingBottom: Platform.OS === 'ios' ? 0 : 4,
        },
        tabBarBackground: () => <TabBarBackground />,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 0.3,
        },
      }}
    >
      <Tabs.Screen
        name="fridge"
        options={{
          title: 'Fridge',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🧊" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="recipes"
        options={{
          title: 'Recipes',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🍳" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="shopping"
        options={{
          title: 'Shopping',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🛒" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabEmoji: { fontSize: 22 },
});
