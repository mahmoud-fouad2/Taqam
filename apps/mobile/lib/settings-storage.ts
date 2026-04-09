import * as SecureStore from "expo-secure-store";

const KEY_LANG = "app_language";
const KEY_BIOMETRICS_ENABLED = "app_biometrics_enabled";
const KEY_THEME_MODE = "app_theme_mode";
const KEY_ONBOARDING_DONE = "app_onboarding_done";

export type AppLanguage = "ar" | "en";
export type ThemeMode = "system" | "light" | "dark";

export async function getStoredLanguage(): Promise<AppLanguage | null> {
  const v = await SecureStore.getItemAsync(KEY_LANG);
  if (v === "ar" || v === "en") return v;
  return null;
}

export async function setStoredLanguage(lang: AppLanguage): Promise<void> {
  await SecureStore.setItemAsync(KEY_LANG, lang);
}

export async function getStoredBiometricsEnabled(): Promise<boolean | null> {
  const value = await SecureStore.getItemAsync(KEY_BIOMETRICS_ENABLED);
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

export async function setStoredBiometricsEnabled(enabled: boolean): Promise<void> {
  await SecureStore.setItemAsync(KEY_BIOMETRICS_ENABLED, enabled ? "true" : "false");
}

export async function getStoredThemeMode(): Promise<ThemeMode | null> {
  const v = await SecureStore.getItemAsync(KEY_THEME_MODE);
  if (v === "system" || v === "light" || v === "dark") return v;
  return null;
}

export async function setStoredThemeMode(mode: ThemeMode): Promise<void> {
  await SecureStore.setItemAsync(KEY_THEME_MODE, mode);
}

export async function getOnboardingDone(): Promise<boolean> {
  const v = await SecureStore.getItemAsync(KEY_ONBOARDING_DONE);
  return v === "true";
}

export async function setOnboardingDone(): Promise<void> {
  await SecureStore.setItemAsync(KEY_ONBOARDING_DONE, "true");
}
