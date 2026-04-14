import React from 'react';
import { Text } from 'react-native';
import { Tabs } from 'expo-router';
import { Colors } from '@/constants/theme';

function TabIcon({ emoji, active }: { emoji: string; active: boolean }) {
  return <Text style={{ fontSize: 22, opacity: active ? 1 : 0.45 }}>{emoji}</Text>;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.tabActive,
        tabBarInactiveTintColor: Colors.tabInactive,
        tabBarStyle: {
          backgroundColor: Colors.background,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="fridge"
        options={{
          title: 'Fridge',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🧊" active={focused} />,
        }}
      />
      <Tabs.Screen
        name="recipes"
        options={{
          title: 'Recipes',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🍳" active={focused} />,
        }}
      />
      <Tabs.Screen
        name="shopping"
        options={{
          title: 'Shopping',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🛒" active={focused} />,
        }}
      />
    </Tabs>
  );
}
