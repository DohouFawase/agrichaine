import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { Provider } from 'react-redux';
import { useEffect } from 'react';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { store } from '@/stores/index';
import echoManager from '@/utils/echo';
import AsyncStorage from "@react-native-async-storage/async-storage";

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // ✅ Initialise Echo au démarrage de l'app
  useEffect(() => {
    const init = async () => {
      try {
        await echoManager.initialize();
        console.log('✅ Echo connecté');
      } catch (err) {
        console.error('❌ Echo échec:', err);
      }
    };
    init();
  }, []);

  // RootLayout.tsx
  useEffect(() => {
    const init = async () => {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        await echoManager.initialize();
      }
    };
    init();
  }, []);

  return (
    <Provider store={store}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(producer)" options={{ headerShown: false }} />
          <Stack.Screen name="(buyer)" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </Provider>
  );
}