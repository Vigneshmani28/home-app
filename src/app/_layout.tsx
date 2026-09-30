import { DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import { QueryClientProvider } from '@tanstack/react-query';
import { Provider as ReduxProvider } from 'react-redux';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthProvider } from '@/features/auth/services/auth-context';
import { DistrictBootstrap } from '@/features/district/components/district-bootstrap';
import { queryClient } from '@/lib/query/query-client';
import { store } from '@/stores';
import { paperTheme } from '@/theme/paper-theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>
        <PaperProvider theme={paperTheme}>
          <SafeAreaProvider>
            <AuthProvider>
              <ThemeProvider value={DefaultTheme}>
                <StatusBar style="dark" />
                <DistrictBootstrap />
                <AnimatedSplashOverlay />
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="index" />
                  <Stack.Screen name="(auth)" />
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="listing/[id]" />
                  <Stack.Screen name="my-listings/index" />
                  <Stack.Screen name="my-listings/[id]" />
                  <Stack.Screen name="edit-listing/[id]" />
                  <Stack.Screen name="account-settings" />
                  <Stack.Screen name="edit-profile" />
                  <Stack.Screen name="legal/privacy" />
                  <Stack.Screen name="legal/terms" />
                </Stack>
              </ThemeProvider>
            </AuthProvider>
          </SafeAreaProvider>
        </PaperProvider>
      </QueryClientProvider>
    </ReduxProvider>
  );
}
