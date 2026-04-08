import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { apiFetch } from "../lib/api";
import { deleteSecureItem, getSecureItem, setSecureItem } from "../lib/storage";
import { isBiometricsAvailable, promptBiometrics } from "../lib/biometrics";

type MobileUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  role: string;
  tenantId: string | null;
  tenant?: { id: string; slug: string; name: string; nameAr: string | null; status: string; plan: string } | null;
  employee?: { id: string; employeeNumber: string; firstName: string; lastName: string } | null;
};

type AuthState = {
  status: "boot" | "signedOut" | "signedIn";
  accessToken: string | null;
  refreshToken: string | null;
  user: MobileUser | null;
  biometricsEnabled: boolean;

  signIn: (email: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  signOut: () => Promise<void>;
  enableBiometrics: () => Promise<{ ok: true } | { ok: false; error: string }>;
  disableBiometrics: () => Promise<void>;
  refreshSession: () => Promise<string | null>;
};

const ACCESS_KEY = "taqam_access_token";
const REFRESH_KEY = "taqam_refresh_token";
const BIO_KEY = "taqam_bio_enabled";

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthState["status"]>("boot");
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [user, setUser] = useState<MobileUser | null>(null);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);

  const loadStored = useCallback(async () => {
    const [a, r, b] = await Promise.all([
      getSecureItem(ACCESS_KEY),
      getSecureItem(REFRESH_KEY),
      getSecureItem(BIO_KEY),
    ]);

    setAccessToken(a);
    setRefreshToken(r);
    setBiometricsEnabled(b === "1");

    // If we have refresh token, we can refresh and fetch /me.
    if (r) {
      setStatus("signedIn");
    } else {
      setStatus("signedOut");
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadStored();
  }, [loadStored]);

  const signOut = useCallback(async () => {
    setStatus("signedOut");
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    setBiometricsEnabled(false);

    await Promise.all([
      deleteSecureItem(ACCESS_KEY),
      deleteSecureItem(REFRESH_KEY),
      deleteSecureItem(BIO_KEY),
    ]);
  }, []);

  const refreshSession = useCallback(async (): Promise<string | null> => {
    if (!refreshToken) return null;

    if (biometricsEnabled) {
      const ok = await promptBiometrics("Unlock Taqam");
      if (!ok) {
        await signOut();
        return null;
      }
    }

    const refreshed = await apiFetch<{ accessToken: string; refreshToken: string }>(
      "/api/mobile/auth/refresh",
      { method: "POST", body: { refreshToken } }
    );

    if (!refreshed.ok) {
      await signOut();
      return null;
    }

    setAccessToken(refreshed.data.accessToken);
    setRefreshToken(refreshed.data.refreshToken);
    await Promise.all([
      setSecureItem(ACCESS_KEY, refreshed.data.accessToken),
      setSecureItem(REFRESH_KEY, refreshed.data.refreshToken),
    ]);

    const me = await apiFetch<MobileUser>("/api/mobile/me", { accessToken: refreshed.data.accessToken });
    if (me.ok) {
      setUser(me.data);
      setStatus("signedIn");
    }

    return refreshed.data.accessToken;
  }, [refreshToken, biometricsEnabled, signOut]);

  const signIn = useCallback(async (email: string, password: string) => {
    const res = await apiFetch<{ accessToken: string; refreshToken: string; user: MobileUser }>(
      "/api/mobile/auth/login",
      { method: "POST", body: { email, password } }
    );

    if (!res.ok) return { ok: false as const, error: res.error };

    setAccessToken(res.data.accessToken);
    setRefreshToken(res.data.refreshToken);
    setUser(res.data.user);
    setStatus("signedIn");

    await Promise.all([
      setSecureItem(ACCESS_KEY, res.data.accessToken),
      setSecureItem(REFRESH_KEY, res.data.refreshToken),
    ]);

    return { ok: true as const };
  }, []);

  const enableBiometrics = useCallback(async () => {
    const available = await isBiometricsAvailable();
    if (!available) {
      return { ok: false as const, error: "Biometrics not available on this device" };
    }

    const ok = await promptBiometrics("Enable biometrics");
    if (!ok) {
      return { ok: false as const, error: "Biometrics verification failed" };
    }

    setBiometricsEnabled(true);
    await setSecureItem(BIO_KEY, "1");
    return { ok: true as const };
  }, []);

  const disableBiometrics = useCallback(async () => {
    setBiometricsEnabled(false);
    await deleteSecureItem(BIO_KEY);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      status,
      accessToken,
      refreshToken,
      user,
      biometricsEnabled,
      signIn,
      signOut,
      enableBiometrics,
      disableBiometrics,
      refreshSession,
    }),
    [
      status,
      accessToken,
      refreshToken,
      user,
      biometricsEnabled,
      signIn,
      signOut,
      enableBiometrics,
      disableBiometrics,
      refreshSession,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
