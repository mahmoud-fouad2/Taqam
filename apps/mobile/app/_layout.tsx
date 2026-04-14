import FontAwesome from '@expo/vector-icons/FontAwesome';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemeProvider as NavThemeProvider, type Theme } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useMemo } from 'react';
import 'react-native-reanimated';

import { AuthProvider } from '@/components/auth-provider';
import { AppSettingsProvider } from '@/components/app-settings-provider';
import {
  installGlobalMobileErrorReporting,
  MobileRouteErrorBoundary,
  reportMobileError,
  setCurrentMobileRoute,
} from '@/lib/error-monitoring';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { OfflineBanner } from '@/components/offline-banner';
import { ThemeProvider, useTheme } from '@/theme';

export function ErrorBoundary(props: React.ComponentProps<typeof MobileRouteErrorBoundary>) {
  return <MobileRouteErrorBoundary {...props} />;
}

export const unstable_settings = {
  initialRouteName: 'index',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
    ...Ionicons.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) {
      void reportMobileError(error, {
        source: 'startup',
        severity: 'fatal',
      });
      throw error;
    }
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  return (
    <AppSettingsProvider>
      <ThemeProvider>
        <ThemedNavigator />
      </ThemeProvider>
    </AppSettingsProvider>
  );
}

/** Bridges our design tokens to react-navigation's theme format */
function ThemedNavigator() {
  const { colors, isDark } = useTheme();
  const pathname = usePathname();

  useEffect(() => {
    installGlobalMobileErrorReporting();
  }, []);

  useEffect(() => {
    setCurrentMobileRoute(pathname);
  }, [pathname]);

  const navTheme = useMemo<Theme>(
    () => ({
      dark: isDark,
      colors: {
        primary: colors.primary,
        background: colors.background,
        card: colors.surface,
        text: colors.text,
        border: colors.border,
        notification: colors.error,
      },
      fonts: {
        regular: { fontFamily: 'System', fontWeight: '400' as const },
        medium: { fontFamily: 'System', fontWeight: '500' as const },
        bold: { fontFamily: 'System', fontWeight: '700' as const },
        heavy: { fontFamily: 'System', fontWeight: '900' as const },
      },
    }),
    [colors, isDark],
  );

  return (
    <NavThemeProvider value={navTheme}>
      <AuthProvider>
        <PushHooks />
        <OfflineBanner />
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </AuthProvider>
    </NavThemeProvider>
  );
}

function PushHooks() {
  usePushNotifications();
  return null;
}
