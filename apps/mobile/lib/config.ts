const LOCALHOST_FALLBACK = "http://localhost:3000";
const PRODUCTION_DEFAULT = "https://taqam.net";

export type ApiBaseUrlInfo = {
  value: string;
  source: "env" | "default" | "fallback";
  isLocalFallback: boolean;
};

function normalizeApiBaseUrl(candidate?: string): string | null {
  const value = candidate?.trim();
  if (!value || !/^https?:\/\//.test(value)) return null;
  return value.replace(/\/$/, "");
}

export function getApiBaseUrlInfo(): ApiBaseUrlInfo {
  const env = normalizeApiBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL);
  if (env) {
    return {
      value: env,
      source: "env",
      isLocalFallback: false,
    };
  }

  if (process.env.NODE_ENV === "production") {
    return {
      value: PRODUCTION_DEFAULT,
      source: "default",
      isLocalFallback: false,
    };
  }

  return {
    value: LOCALHOST_FALLBACK,
    source: "fallback",
    isLocalFallback: true,
  };
}

export function getApiBaseUrl(): string {
  return getApiBaseUrlInfo().value;
}
