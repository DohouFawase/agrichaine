import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, Platform } from 'react-native';
import { HapticTab } from '@/components/haptic-tab';
import { Home, Box, ShoppingBag, Wallet, User } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FFFFFF',          
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.5)', 
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarIconStyle: styles.tabBarIcon,
      }}>
      
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color }) => <Home size={22} color={color} strokeWidth={2} />,
        }}
      />

      <Tabs.Screen
        name="products"
        options={{
          title: 'Produits', // Corrigé en français si vous le souhaitez
          tabBarIcon: ({ color }) => <Box size={22} color={color} strokeWidth={2} />,
        }}
      />

      <Tabs.Screen
        name="orders"
        options={{
          title: 'Commandes',
          tabBarIcon: ({ color }) => <ShoppingBag size={22} color={color} strokeWidth={2} />,
        }}
      />

      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Portefeuille',
          tabBarIcon: ({ color }) => <Wallet size={22} color={color} strokeWidth={2} />,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => <User size={22} color={color} strokeWidth={2} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    // 🎨 L'effet flottant
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16, // Décollé du bas de l'écran
    left: 16,
    right: 16,
    
    // Style visuel (Pilule)
    backgroundColor: '#1D9E75', 
    borderRadius: 24,           // Arrondi prononcé style "Flottant"
    height: 68,
    borderTopWidth: 0,          // Supprime la bordure native du haut
    
    // Aligner le contenu proprement
    paddingBottom: Platform.OS === 'ios' ? 5 : 10,
    paddingTop: 10,
    
    // 🌌 Ombres douces pour accentuer l'effet de flottaison
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  tabBarLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
  },
  tabBarIcon: {
    marginBottom: -2,
  }
});