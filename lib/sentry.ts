function readEnv(name: string): string | undefined {
  const value = process.env[name];

  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function parseSampleRate(name: string, fallback: number): number {
  const rawValue = readEnv(name);

  if (!rawValue) {
    return fallback;
  }

  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(Math.max(parsed, 0), 1);
}

export function getSentryDsn(runtime: "server" | "client" = "server"): string | undefined {
  if (runtime === "client") {
    return readEnv("NEXT_PUBLIC_SENTRY_DSN") ?? readEnv("SENTRY_DSN");
  }

  return readEnv("SENTRY_DSN") ?? readEnv("NEXT_PUBLIC_SENTRY_DSN");
}

export function getSentryEnvironment(): string {
  return readEnv("SENTRY_ENVIRONMENT") ?? process.env.NODE_ENV ?? "development";
}

export function getSentryTracesSampleRate(): number {
  const fallback = process.env.NODE_ENV === "production" ? 0.1 : 1.0;
  return parseSampleRate("SENTRY_TRACES_SAMPLE_RATE", fallback);
}

export function getSentryReplaySessionSampleRate(): number {
  const fallback = process.env.NODE_ENV === "production" ? 0.1 : 1.0;
  return parseSampleRate("NEXT_PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE", fallback);
}

export function getSentryReplayOnErrorSampleRate(): number {
  return parseSampleRate("NEXT_PUBLIC_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE", 1.0);
}

export function isSentryEnabled(runtime: "server" | "client" = "server"): boolean {
  return Boolean(getSentryDsn(runtime));
}
