const LOCALHOST_FALLBACK = "http://localhost:3000";

export type ApiBaseUrlInfo = {
  value: string;
  source: "env" | "fallback";
  isLocalFallback: boolean;
};

export function getApiBaseUrlInfo(): ApiBaseUrlInfo {
  const env = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (env && /^https?:\/\//.test(env)) {
    return {
      value: env.replace(/\/$/, ""),
      source: "env",
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
