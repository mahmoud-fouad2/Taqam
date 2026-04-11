import * as SecureStore from "expo-secure-store";

const ACCESS_KEY = "taqam_mobile_access_token";
const REFRESH_KEY = "taqam_mobile_refresh_token";
const DEVICE_KEY = "taqam_mobile_device_id";

function generateDeviceId(): string {
  const c: any = (globalThis as any).crypto;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}-${Math.random().toString(16).slice(2)}`;
}

export async function getStoredAccessToken(): Promise<string | null> {
  return (await SecureStore.getItemAsync(ACCESS_KEY)) ?? null;
}

export async function setStoredAccessToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(ACCESS_KEY, token);
}

async function clearStoredAccessToken(): Promise<void> {
  await SecureStore.deleteItemAsync(ACCESS_KEY);
}

export async function getStoredRefreshToken(): Promise<string | null> {
  return (await SecureStore.getItemAsync(REFRESH_KEY)) ?? null;
}

export async function setStoredRefreshToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(REFRESH_KEY, token);
}

async function clearStoredRefreshToken(): Promise<void> {
  await SecureStore.deleteItemAsync(REFRESH_KEY);
}

export async function getOrCreateDeviceId(): Promise<string> {
  const existing = (await SecureStore.getItemAsync(DEVICE_KEY)) ?? null;
  if (existing) return existing;
  const created = generateDeviceId();
  await SecureStore.setItemAsync(DEVICE_KEY, created);
  return created;
}

export async function clearStoredSession(): Promise<void> {
  await Promise.all([clearStoredAccessToken(), clearStoredRefreshToken()]);
}
