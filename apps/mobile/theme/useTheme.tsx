import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useColorScheme } from "react-native";

import { useAppSettings } from "@/components/app-settings-provider";
import {
  lightTheme,
  darkTheme,
  type ThemeColors,
  spacing,
  fontSize,
  radius,
  shadows,
} from "./tokens";

export type ThemeMode = "system" | "light" | "dark";

type ThemeContextValue = {
  colors: ThemeColors;
  isDark: boolean;
  spacing: typeof spacing;
  fontSize: typeof fontSize;
  radius: typeof radius;
  shadows: typeof shadows;
};

const ThemeContext = createContext<ThemeContextValue>({
  colors: lightTheme,
  isDark: false,
  spacing,
  fontSize,
  radius,
  shadows,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const { themeMode } = useAppSettings();

  const isDark = useMemo(() => {
    if (themeMode === "light") return false;
    if (themeMode === "dark") return true;
    return systemScheme === "dark";
  }, [themeMode, systemScheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      colors: isDark ? darkTheme : lightTheme,
      isDark,
      spacing,
      fontSize,
      radius,
      shadows,
    }),
    [isDark],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
