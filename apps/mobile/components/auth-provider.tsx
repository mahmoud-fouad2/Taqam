import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { ApiError, apiFetch } from "@/lib/api";
import {
  clearStoredSession,
  getStoredAccessToken,
  getStoredRefreshToken,
  setStoredAccessToken,
  setStoredRefreshToken,
} from "@/lib/auth-storage";

type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  role: string;
  tenantId: string | null;
  employeeId: string | null;
};

type AuthState = {
  loading: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  authFetch: <T = any>(pathname: string, init?: RequestInit) => Promise<T>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const refreshInFlight = useRef<Promise<{ accessToken: string; refreshToken: string } | null> | null>(null);

  const refreshSession = useCallback(async (): Promise<{ accessToken: string; refreshToken: string } | null> => {
    const currentRefresh = await getStoredRefreshToken();
    if (!currentRefresh) return null;

    if (!refreshInFlight.current) {
      refreshInFlight.current = (async () => {
        const MAX_ATTEMPTS = 2;
        for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
          try {
            const refreshed = await apiFetch("/api/mobile/auth/refresh", {
              init: { method: "POST", body: JSON.stringify({ refreshToken: currentRefresh }) },
              retries: 0,
            });

            const nextAccess = refreshed?.data?.accessToken as string | undefined;
            const nextRefresh = refreshed?.data?.refreshToken as string | undefined;
            if (!nextAccess || !nextRefresh) return null;

            await setStoredAccessToken(nextAccess);
            await setStoredRefreshToken(nextRefresh);

            setAccessToken(nextAccess);
            setRefreshToken(nextRefresh);

            return { accessToken: nextAccess, refreshToken: nextRefresh };
          } catch (e) {
            const status = e instanceof ApiError ? e.status : 0;
            const isTransient = status === 0 || status >= 500 || status === 429;
            if (isTransient && attempt < MAX_ATTEMPTS - 1) {
              await new Promise((r) => setTimeout(r, 1000));
              continue;
            }
            return null;
          }
        }
        return null;
      })();

      refreshInFlight.current.finally(() => {
        refreshInFlight.current = null;
      });
    }

    return await refreshInFlight.current;
  }, []);

  const authFetch = useCallback(async <T = any,>(pathname: string, init?: RequestInit): Promise<T> => {
    const token = accessToken ?? (await getStoredAccessToken());
    if (!token) throw new Error("Unauthorized");

    try {
      return await apiFetch<T>(pathname, { token, init });
    } catch (e) {
      const status = e instanceof ApiError ? e.status : null;
      if (status !== 401) throw e;

      const refreshed = await refreshSession();
      if (!refreshed) {
        await clearStoredSession();
        setAccessToken(null);
        setRefreshToken(null);
        setUser(null);
        throw new Error("Unauthorized");
      }

      return await apiFetch<T>(pathname, { token: refreshed.accessToken, init });
    }
  }, [accessToken, refreshSession]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const token = await getStoredAccessToken();
        const storedRefresh = await getStoredRefreshToken();
        if (!mounted) return;
        if (token) {
          setAccessToken(token);
          setRefreshToken(storedRefresh);
          try {
            const me = await apiFetch("/api/mobile/me", { token });
            setUser(me.data as User);
          } catch (e) {
            const status = e instanceof ApiError ? e.status : null;
            if (status === 401 && storedRefresh) {
              const refreshed = await refreshSession();
              if (refreshed) {
                try {
                  const me = await apiFetch("/api/mobile/me", { token: refreshed.accessToken });
                  setUser(me.data as User);
                  return;
                } catch {
                  // fall through to clear
                }
              }
            }

            await clearStoredSession();
            setAccessToken(null);
            setRefreshToken(null);
            setUser(null);
          }
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [refreshSession]);

  const signIn = useCallback(async (email: string, password: string) => {
    const res = await apiFetch("/api/mobile/auth/login", {
      init: {
        method: "POST",
        body: JSON.stringify({ email, password }),
      },
    });

    const token = res?.data?.accessToken as string | undefined;
    const nextRefresh = res?.data?.refreshToken as string | undefined;
    const nextUser = res?.data?.user as User | undefined;
    if (!token || !nextRefresh || !nextUser) throw new Error("Login failed");

    await setStoredAccessToken(token);
    await setStoredRefreshToken(nextRefresh);
    setAccessToken(token);
    setRefreshToken(nextRefresh);
    setUser(nextUser);
  }, []);

  const signOut = useCallback(async () => {
    try {
      const currentRefresh = await getStoredRefreshToken();
      if (currentRefresh) {
        await apiFetch("/api/mobile/auth/logout", {
          init: { method: "POST", body: JSON.stringify({ refreshToken: currentRefresh }) },
        });
      }
    } catch {
      // ignore
    }

    await clearStoredSession();
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({ loading, accessToken, refreshToken, user, signIn, signOut, authFetch }),
    [loading, accessToken, refreshToken, user, signIn, signOut, authFetch]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
