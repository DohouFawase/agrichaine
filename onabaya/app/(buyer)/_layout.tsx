import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HapticTab } from '@/components/haptic-tab';
import { Home, Map, Package, Wallet, User } from 'lucide-react-native';

const NAV_BG = '#1A3A6B';
const ACTIVE = '#FFFFFF';
const INACTIVE = 'rgba(255,255,255,0.65)';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomInset = Platform.OS === 'android' ? Math.max(insets.bottom, 8) : insets.bottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: ACTIVE,
        tabBarInactiveTintColor: INACTIVE,
        tabBarStyle: {
          backgroundColor: NAV_BG,
          borderRadius: 24,
          marginHorizontal: 16,
          marginBottom: bottomInset - 16,
          height: 68,                      // ← assez de place pour icône + label
          position: 'absolute',
          borderTopWidth: 0,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.18,
          shadowRadius: 16,
          paddingBottom: 0,                // ← empêche le padding interne d'écraser le label
          paddingTop: 0,
        },
        tabBarItemStyle: {
          height: 68,
          paddingTop: 10,                  // ← espace au-dessus de l'icône
          paddingBottom: 8,                // ← espace sous le label
          justifyContent: 'center',
          alignItems: 'center',
        },
        tabBarIconStyle: {
          marginBottom: 2,                 // ← écart icône → label
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '400',
          includeFontPadding: false,       // ← supprime l'espace fantôme Android
          textAlignVertical: 'center',
          marginTop: 0,
          lineHeight: 13,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color }) => <Home size={22} color={color} strokeWidth={1.8} />,
        }}
      />
      <Tabs.Screen
        name="mapsScreen"
        options={{
          title: 'Cartes',
          tabBarIcon: ({ color }) => <Map size={22} color={color} strokeWidth={1.8} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Commandes',
          tabBarIcon: ({ color }) => <Package size={22} color={color} strokeWidth={1.8} />,
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Portefeuille',
          tabBarIcon: ({ color }) => <Wallet size={22} color={color} strokeWidth={1.8} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => <User size={22} color={color} strokeWidth={1.8} />,
        }}
      />
    </Tabs>
  );
}