import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { Provider } from 'react-redux';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { store } from '@/stores/index';
export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    // 3. Enveloppe le tout avec le Provider
    <Provider store={store}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(producer)" options={{ headerShown: false }} />
          <Stack.Screen name="(buyer)" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style='auto'/>
      </ThemeProvider>
    </Provider>
  );
}
