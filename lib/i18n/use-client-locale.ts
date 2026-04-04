"use client";

import { useSyncExternalStore } from "react";
import type { AppLocale } from "./types";

/**
 * Hook that safely returns the current locale after hydration.
 * Returns a default value during SSR to prevent hydration mismatches.
 */
export function useClientLocale(defaultLocale: AppLocale = "ar"): AppLocale {
  return useSyncExternalStore(
    // Locale changes are applied via full reload in this app, so no subscription needed.
    () => () => {},
    () => {
      // Get locale from cookie first
      const match = document.cookie.match(/(?:^|; )taqam_locale=([^;]+)/);
      const cookieValue = match?.[1];
      const cookieLocale = cookieValue === "en" ? "en" : cookieValue === "ar" ? "ar" : undefined;

      if (cookieLocale) return cookieLocale;

      // Fallback to <html lang>
      const lang = document.documentElement.lang;
      return lang === "en" ? "en" : "ar";
    },
    () => defaultLocale
  );
}

/**
 * Hook that returns true after the component has mounted.
 * Useful for preventing hydration mismatches.
 */
export function useHydrated(): boolean {
  // During SSR + hydration: false, after hydration: true
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}
