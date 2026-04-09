/**
 * Taqam Mobile Design Tokens — V2
 * Matches web design-tokens.ts for brand consistency.
 */

export const palette = {
  blue50: "#eff6ff",
  blue100: "#dbeafe",
  blue200: "#bfdbfe",
  blue300: "#93c5fd",
  blue400: "#60a5fa",
  blue500: "#3b82f6",
  blue600: "#2563eb",
  blue700: "#1d4ed8",
  blue800: "#1e40af",
  blue900: "#1e3a8a",

  green50: "#f0fdf4",
  green500: "#22c55e",
  green600: "#16a34a",

  amber50: "#fffbeb",
  amber500: "#f59e0b",
  amber600: "#d97706",

  red50: "#fef2f2",
  red500: "#ef4444",
  red600: "#dc2626",

  slate50: "#f8fafc",
  slate100: "#f1f5f9",
  slate200: "#e2e8f0",
  slate300: "#cbd5e1",
  slate400: "#94a3b8",
  slate500: "#64748b",
  slate600: "#475569",
  slate700: "#334155",
  slate800: "#1e293b",
  slate900: "#0f172a",
  slate950: "#020617",

  white: "#ffffff",
  black: "#000000",
} as const;

export type ThemeColors = {
  primary: string;
  primaryLight: string;
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  error: string;
  errorLight: string;
  background: string;
  surface: string;
  surfaceSecondary: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  borderLight: string;
  tabActive: string;
  tabInactive: string;
};

export const lightTheme: ThemeColors = {
  primary: palette.blue600,
  primaryLight: palette.blue50,
  success: palette.green500,
  successLight: palette.green50,
  warning: palette.amber500,
  warningLight: palette.amber50,
  error: palette.red500,
  errorLight: palette.red50,
  background: palette.slate50,
  surface: palette.white,
  surfaceSecondary: palette.slate100,
  text: palette.slate900,
  textSecondary: palette.slate500,
  textMuted: palette.slate400,
  border: palette.slate200,
  borderLight: palette.slate100,
  tabActive: palette.blue500,
  tabInactive: palette.slate400,
};

export const darkTheme: ThemeColors = {
  primary: palette.blue500,
  primaryLight: palette.blue900,
  success: palette.green500,
  successLight: "rgba(34,197,94,0.15)",
  warning: palette.amber500,
  warningLight: "rgba(245,158,11,0.15)",
  error: palette.red500,
  errorLight: "rgba(239,68,68,0.15)",
  background: palette.slate950,
  surface: palette.slate900,
  surfaceSecondary: palette.slate800,
  text: palette.slate100,
  textSecondary: "rgba(255,255,255,0.55)",
  textMuted: palette.slate600,
  border: "rgba(255,255,255,0.08)",
  borderLight: "rgba(255,255,255,0.04)",
  tabActive: palette.blue500,
  tabInactive: palette.slate600,
};

export const fontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  lg: 17,
  xl: 20,
  "2xl": 24,
  "3xl": 30,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

export const shadows = {
  sm: {
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  md: {
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  lg: {
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
} as const;
