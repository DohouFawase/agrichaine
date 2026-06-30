import { Tabs } from 'expo-router';
import React from 'react';
import { Home, Truck, Wifi, Wallet, CircleUser } from 'lucide-react-native';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';

const BRAND = '#BA7517';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.55)',
        tabBarStyle: {
          position: 'absolute',
          bottom: 24,
          left: 20,
          right: 20,
          backgroundColor: BRAND,
          borderRadius: 24,
          height: 68,
          paddingBottom: 10,
          paddingTop: 10,
          borderTopWidth: 0,
          elevation: 12,
          shadowColor: BRAND,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.45,
          shadowRadius: 16,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="trajects"
        options={{
          title: 'Trajects',
          tabBarIcon: ({ color }) => <Truck size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="status"
        options={{
          title: 'Status',
          tabBarIcon: ({ color }) => <Wifi size={24} color={color} />,
        }}
      />
       <Tabs.Screen
        name="orders"
        options={{
          title: 'Commande',
          tabBarIcon: ({ color }) => <Wifi size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Portefeuille',
          tabBarIcon: ({ color }) => <Wallet size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <CircleUser size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}