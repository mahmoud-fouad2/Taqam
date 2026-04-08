import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { I18nManager } from "react-native";
import * as Updates from "expo-updates";

import type { AppLanguage } from "@/lib/settings-storage";
import {
  getStoredBiometricsEnabled,
  getStoredLanguage,
  setStoredBiometricsEnabled,
  setStoredLanguage,
} from "@/lib/settings-storage";

type AppSettings = {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => Promise<void>;
  biometricsEnabled: boolean;
  setBiometricsEnabled: (enabled: boolean) => Promise<void>;
};

const SettingsContext = createContext<AppSettings | null>(null);

export function AppSettingsProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>("ar");
  const [biometricsEnabled, setBiometricsEnabledState] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [storedLanguage, storedBiometrics] = await Promise.all([
        getStoredLanguage(),
        getStoredBiometricsEnabled(),
      ]);
      if (!mounted) return;
      const lang = storedLanguage ?? "ar";
      setLanguageState(lang);
      if (storedBiometrics !== null) setBiometricsEnabledState(storedBiometrics);

      // Ensure RTL matches current language on every cold start
      const shouldBeRtl = lang === "ar";
      if (I18nManager.isRTL !== shouldBeRtl) {
        I18nManager.allowRTL(true);
        I18nManager.forceRTL(shouldBeRtl);
        try { await Updates.reloadAsync(); } catch { /* user can restart manually */ }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const setLanguage = async (lang: AppLanguage) => {
    await setStoredLanguage(lang);

    const rtl = lang === "ar";
    I18nManager.allowRTL(true);
    I18nManager.forceRTL(rtl);

    setLanguageState(lang);

    // Apply direction changes consistently.
    try {
      await Updates.reloadAsync();
    } catch {
      // If reload fails (rare), user can manually restart.
    }
  };

  const setBiometricsEnabled = async (enabled: boolean) => {
    await setStoredBiometricsEnabled(enabled);
    setBiometricsEnabledState(enabled);
  };

  const value = useMemo<AppSettings>(
    () => ({ language, setLanguage, biometricsEnabled, setBiometricsEnabled }),
    [biometricsEnabled, language],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useAppSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useAppSettings must be used within AppSettingsProvider");
  return ctx;
}
