import React, { useEffect } from "react";
import { ErrorBoundary as ExpoRouterErrorBoundary } from "expo-router";

import { apiFetch } from "@/lib/api";
import { getStoredAccessToken } from "@/lib/auth-storage";

type MobileErrorSource = "global" | "error-boundary" | "startup" | "api";
type MobileErrorSeverity = "error" | "fatal";

type MobileErrorTagValue = string | number | boolean | null | undefined;

const RECENT_ERROR_WINDOW_MS = 30_000;
const recentErrors = new Map<string, number>();

let globalHandlersInstalled = false;
let currentRoute = "/";

function normalizeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name || "Error",
      message: error.message || "Unknown error",
      stack: error.stack || undefined
    };
  }

  if (typeof error === "string") {
    return {
      name: "Error",
      message: error,
      stack: undefined
    };
  }

  return {
    name: "Error",
    message: "Unknown mobile runtime error",
    stack: undefined
  };
}

function shouldReportError(fingerprint: string) {
  const now = Date.now();

  for (const [key, timestamp] of recentErrors.entries()) {
    if (now - timestamp > RECENT_ERROR_WINDOW_MS) {
      recentErrors.delete(key);
    }
  }

  const previousTimestamp = recentErrors.get(fingerprint);
  if (previousTimestamp && now - previousTimestamp < RECENT_ERROR_WINDOW_MS) {
    return false;
  }

  recentErrors.set(fingerprint, now);
  return true;
}

function sanitizeTags(tags?: Record<string, MobileErrorTagValue>) {
  if (!tags) {
    return undefined;
  }

  const entries = Object.entries(tags).filter(
    ([key, value]) => key.trim().length > 0 && value !== undefined
  );

  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

export function setCurrentMobileRoute(route: string | null | undefined) {
  currentRoute = route?.trim() || "/";
}

export async function reportMobileError(
  error: unknown,
  options?: {
    source?: MobileErrorSource;
    severity?: MobileErrorSeverity;
    route?: string | null;
    componentStack?: string;
    tags?: Record<string, MobileErrorTagValue>;
  }
) {
  const normalized = normalizeError(error);
  const source = options?.source ?? "global";
  const severity = options?.severity ?? "error";
  const route = options?.route?.trim() || currentRoute;
  const fingerprint = `${severity}:${source}:${normalized.name}:${normalized.message}:${route}`;

  if (!shouldReportError(fingerprint)) {
    return;
  }

  try {
    const token = await getStoredAccessToken();

    await apiFetch("/api/mobile/diagnostics/errors", {
      token: token ?? undefined,
      retries: 0,
      timeoutMs: 5_000,
      init: {
        method: "POST",
        body: JSON.stringify({
          name: normalized.name,
          message: normalized.message,
          stack: normalized.stack,
          componentStack: options?.componentStack,
          route,
          source,
          severity,
          tags: sanitizeTags(options?.tags)
        })
      }
    });
  } catch {
    // Diagnostics reporting must not break the mobile runtime.
  }
}

type GlobalErrorHandler = (error: unknown, isFatal?: boolean) => void;

export function installGlobalMobileErrorReporting() {
  if (globalHandlersInstalled) {
    return;
  }

  globalHandlersInstalled = true;

  const errorUtils = (globalThis as {
    ErrorUtils?: {
      getGlobalHandler?: () => GlobalErrorHandler | undefined;
      setGlobalHandler?: (handler: GlobalErrorHandler) => void;
    };
  }).ErrorUtils;

  const previousHandler = errorUtils?.getGlobalHandler?.();

  errorUtils?.setGlobalHandler?.((error, isFatal) => {
    void reportMobileError(error, {
      source: "global",
      severity: isFatal ? "fatal" : "error"
    });

    previousHandler?.(error, isFatal);
  });

  const addEventListener = (globalThis as {
    addEventListener?: (type: string, listener: (event: { reason?: unknown }) => void) => void;
  }).addEventListener;

  if (typeof addEventListener === "function") {
    addEventListener("unhandledrejection", (event) => {
      void reportMobileError(event.reason ?? "Unhandled promise rejection", {
        source: "global",
        severity: "error"
      });
    });
  }
}

export function MobileRouteErrorBoundary(
  props: React.ComponentProps<typeof ExpoRouterErrorBoundary>
) {
  useEffect(() => {
    void reportMobileError(props.error, {
      source: "error-boundary",
      severity: "error"
    });
  }, [props.error]);

  return React.createElement(ExpoRouterErrorBoundary, props);
}