"use client";

export type MobileUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatar: string | null;
  role: string;
  permissions: any;
  tenantId: string | null;
  tenant?: {
    id: string;
    slug: string;
    name: string;
    nameAr: string | null;
    status: string;
    plan: string;
  } | null;
  employeeId: string | null;
};

export type MobileAuthState = {
  accessToken: string;
  refreshToken?: string;
  user: MobileUser;
};

const AUTH_KEY = "taqam:mobileAuth";
const LEGACY_AUTH_KEY = "ujoor:mobileAuth";
const DEVICE_ID_KEY = "taqam:deviceId";
const LEGACY_DEVICE_ID_KEY = "ujoor:deviceId";

function safeJsonParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function migrateStorageValue(nextKey: string, legacyKey: string): string | null {
  if (typeof window === "undefined") return null;

  const currentValue = window.localStorage.getItem(nextKey);
  if (currentValue) return currentValue;

  const legacyValue = window.localStorage.getItem(legacyKey);
  if (!legacyValue) return null;

  window.localStorage.setItem(nextKey, legacyValue);
  window.localStorage.removeItem(legacyKey);
  return legacyValue;
}

export function getOrCreateDeviceId(): string {
  if (typeof window === "undefined") return "";

  const existing = migrateStorageValue(DEVICE_ID_KEY, LEGACY_DEVICE_ID_KEY);
  if (existing && existing.length >= 8) return existing;

  const generated =
    (globalThis.crypto as any)?.randomUUID?.() ??
    `dev-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  window.localStorage.setItem(DEVICE_ID_KEY, generated);
  return generated;
}

export function getMobileDeviceHeaders(): Record<string, string> {
  const deviceId = getOrCreateDeviceId();

  return {
    "x-device-id": deviceId,
    "x-device-platform": "capacitor-web",
    "x-device-name": "Taqam Mobile",
    "x-app-version": process.env.NEXT_PUBLIC_APP_VERSION || "web"
  };
}

export function loadMobileAuth(): MobileAuthState | null {
  if (typeof window === "undefined") return null;

  const current = safeJsonParse<MobileAuthState>(window.localStorage.getItem(AUTH_KEY));
  if (current) return current;

  const migrated = safeJsonParse<MobileAuthState>(migrateStorageValue(AUTH_KEY, LEGACY_AUTH_KEY));
  if (migrated) return migrated;

  window.localStorage.removeItem(AUTH_KEY);
  return null;
}

export function saveMobileAuth(state: MobileAuthState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUTH_KEY, JSON.stringify(state));
}

export function clearMobileAuth() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_KEY);
  window.localStorage.removeItem(LEGACY_AUTH_KEY);
  window.localStorage.removeItem(LEGACY_DEVICE_ID_KEY);
}

export async function mobileLogin(email: string, password: string): Promise<MobileAuthState> {
  const res = await fetch("/api/mobile/auth/login", {
    method: "POST",
    credentials: "include",
    headers: {
      "content-type": "application/json",
      ...getMobileDeviceHeaders()
    },
    body: JSON.stringify({ email, password })
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json?.error || "فشل تسجيل الدخول");
  }

  const data = json?.data as MobileAuthState | undefined;
  if (!data?.accessToken || !data?.user) {
    throw new Error("استجابة تسجيل الدخول غير صالحة");
  }

  // For WebView clients, refresh token is also stored in an httpOnly cookie.
  // To reduce risk, we avoid persisting refreshToken in localStorage.
  saveMobileAuth({ accessToken: data.accessToken, user: data.user });
  return data;
}

async function refreshMobileToken(
  refreshToken: string
): Promise<{ accessToken: string; refreshToken: string }> {
  const res = await fetch("/api/mobile/auth/refresh", {
    method: "POST",
    credentials: "include",
    headers: {
      "content-type": "application/json",
      ...getMobileDeviceHeaders()
    },
    body: JSON.stringify(refreshToken ? { refreshToken } : {})
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json?.error || "انتهت الجلسة");
  }

  const data = json?.data as { accessToken?: string; refreshToken?: string } | undefined;
  if (!data?.accessToken || !data?.refreshToken) {
    throw new Error("فشل تجديد الجلسة");
  }

  return { accessToken: data.accessToken, refreshToken: data.refreshToken };
}

export async function mobileAuthFetch<T>(
  path: string,
  init?: RequestInit,
  opts?: { retry?: boolean }
): Promise<T> {
  const auth = loadMobileAuth();
  if (!auth?.accessToken) throw new Error("غير مسجل الدخول");

  const res = await fetch(path, {
    ...init,
    credentials: "include",
    headers: {
      ...(init?.headers || {}),
      authorization: `Bearer ${auth.accessToken}`,
      ...getMobileDeviceHeaders()
    }
  });

  if (res.status === 401 && opts?.retry !== false) {
    const rotated = await refreshMobileToken(auth.refreshToken || "");
    const nextAuth = { ...auth, accessToken: rotated.accessToken };
    saveMobileAuth(nextAuth);

    const res2 = await fetch(path, {
      ...init,
      credentials: "include",
      headers: {
        ...(init?.headers || {}),
        authorization: `Bearer ${rotated.accessToken}`,
        ...getMobileDeviceHeaders()
      }
    });

    const json2 = await res2.json().catch(() => ({}));
    if (!res2.ok) throw new Error(json2?.error || "فشل الطلب");
    return json2 as T;
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as any)?.error || "فشل الطلب");
  return json as T;
}

export async function mobileLogoutAll() {
  const auth = loadMobileAuth();
  if (!auth) return;

  try {
    await mobileAuthFetch("/api/mobile/auth/logout-all", { method: "POST" });
  } finally {
    clearMobileAuth();
  }
}

export async function mobileChallenge(): Promise<string> {
  const res = await mobileAuthFetch<{ data: { nonce: string } }>("/api/mobile/auth/challenge", {
    method: "POST"
  });
  const nonce = res?.data?.nonce;
  if (!nonce) throw new Error("فشل إنشاء التحدي");
  return nonce;
}
