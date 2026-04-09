import { getApiBaseUrl } from "@/lib/config";
import { Platform } from "react-native";
import Constants from "expo-constants";
import { getOrCreateDeviceId } from "@/lib/auth-storage";

const DEFAULT_TIMEOUT_MS = 15_000;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1_000;

export class ApiError extends Error {
  status: number;
  body: any;

  constructor(message: string, status: number, body: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

function isTransient(e: unknown): boolean {
  if (e instanceof ApiError) return e.status >= 500 || e.status === 429;
  if (e instanceof TypeError) return true; // network failure
  if (e instanceof DOMException && e.name === "AbortError") return false;
  return false;
}

function wait(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

export async function apiFetch<T = any>(
  pathname: string,
  opts?: { token?: string; init?: RequestInit; retries?: number; timeoutMs?: number },
): Promise<T> {
  const base = getApiBaseUrl();
  const url = pathname.startsWith("http") ? pathname : `${base}${pathname.startsWith("/") ? "" : "/"}${pathname}`;

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(opts?.init?.headers as any),
  };

  const deviceId = await getOrCreateDeviceId();
  headers["x-device-id"] = deviceId;
  headers["x-device-platform"] = Platform.OS;
  const appVersion =
    (Constants.expoConfig as any)?.version ??
    (Constants as any).nativeAppVersion ??
    (Constants as any).manifest?.version ??
    undefined;
  if (typeof appVersion === "string" && appVersion) {
    headers["x-app-version"] = appVersion;
  }

  if (!headers["Content-Type"] && opts?.init?.body) {
    headers["Content-Type"] = "application/json";
  }

  if (opts?.token) {
    headers.Authorization = `Bearer ${opts.token}`;
  }

  const maxRetries = opts?.retries ?? MAX_RETRIES;
  const timeoutMs = opts?.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timer = timeoutMs > 0 ? setTimeout(() => controller.abort(), timeoutMs) : null;

    try {
      const res = await fetch(url, {
        ...opts?.init,
        headers,
        signal: controller.signal,
      });

      if (timer) clearTimeout(timer);

      const text = await res.text();
      let json: any = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {
        json = null;
      }

      if (!res.ok) {
        const message = json?.error || `Request failed (${res.status})`;
        throw new ApiError(message, res.status, json);
      }

      return json as T;
    } catch (e) {
      if (timer) clearTimeout(timer);
      lastError = e;

      if (e instanceof DOMException && e.name === "AbortError") {
        lastError = new ApiError("Request timed out", 0, null);
      }

      if (attempt < maxRetries && isTransient(e)) {
        await wait(RETRY_DELAY_MS * (attempt + 1));
        continue;
      }

      throw lastError;
    }
  }

  throw lastError;
}
