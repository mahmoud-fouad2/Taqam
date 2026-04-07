import * as SecureStore from "expo-secure-store";

const KEY_LANG = "app_language";
const KEY_BIOMETRICS_ENABLED = "app_biometrics_enabled";

export type AppLanguage = "ar" | "en";

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
