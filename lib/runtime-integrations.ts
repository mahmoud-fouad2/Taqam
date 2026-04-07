export type RuntimeIntegrationId = "recaptcha" | "storage" | "email" | "redis";
export type RuntimeIntegrationMode = "configured" | "partial" | "missing";

export type RuntimeIntegrationStatusSnapshot = {
  id: RuntimeIntegrationId;
  name: string;
  configured: boolean;
  mode: RuntimeIntegrationMode;
  missing: string[];
  features: string[];
};

export type RuntimeIntegrationReport = {
  items: RuntimeIntegrationStatusSnapshot[];
  summary: {
    total: number;
    configured: number;
    partial: number;
    missing: number;
  };
};

function hasEnv(name: string) {
  return Boolean(process.env[name]?.trim());
}

function resolveMode(configured: boolean, hasAnyInput: boolean) {
  if (configured) {
    return "configured" satisfies RuntimeIntegrationMode;
  }

  return hasAnyInput ? "partial" : "missing";
}

function createStatus(
  id: RuntimeIntegrationId,
  name: string,
  missing: string[],
  hasAnyInput: boolean,
  features: string[]
): RuntimeIntegrationStatusSnapshot {
  const configured = missing.length === 0;

  return {
    id,
    name,
    configured,
    mode: resolveMode(configured, hasAnyInput),
    missing,
    features,
  };
}

export function getRecaptchaRuntimeStatus() {
  const hasAnyInput = hasEnv("NEXT_PUBLIC_RECAPTCHA_SITE_KEY") || hasEnv("RECAPTCHA_SECRET_KEY");
  const missing: string[] = [];

  if (!hasEnv("NEXT_PUBLIC_RECAPTCHA_SITE_KEY")) {
    missing.push("NEXT_PUBLIC_RECAPTCHA_SITE_KEY");
  }

  if (!hasEnv("RECAPTCHA_SECRET_KEY")) {
    missing.push("RECAPTCHA_SECRET_KEY");
  }

  return createStatus("recaptcha", "Google reCAPTCHA", missing, hasAnyInput, ["request-demo form"]);
}

export function getStorageRuntimeStatus() {
  const hasAnyInput = [
    "R2_ENDPOINT",
    "R2_ACCOUNT_ID",
    "R2_ACCESS_KEY_ID",
    "R2_SECRET_ACCESS_KEY",
    "R2_BUCKET_NAME",
    "R2_PUBLIC_URL",
  ].some(hasEnv);
  const missing: string[] = [];

  if (!(hasEnv("R2_ENDPOINT") || hasEnv("R2_ACCOUNT_ID"))) {
    missing.push("R2_ENDPOINT or R2_ACCOUNT_ID");
  }

  if (!hasEnv("R2_ACCESS_KEY_ID")) {
    missing.push("R2_ACCESS_KEY_ID");
  }

  if (!hasEnv("R2_SECRET_ACCESS_KEY")) {
    missing.push("R2_SECRET_ACCESS_KEY");
  }

  if (!hasEnv("R2_BUCKET_NAME")) {
    missing.push("R2_BUCKET_NAME");
  }

  if (!hasEnv("R2_PUBLIC_URL")) {
    missing.push("R2_PUBLIC_URL");
  }

  return createStatus("storage", "Cloudflare R2", missing, hasAnyInput, ["avatars", "documents", "career resumes"]);
}

export function getEmailRuntimeStatus() {
  if (hasEnv("SMTP_URL")) {
    return createStatus("email", "SMTP email", [], true, ["password reset", "tenant activation", "payslip delivery"]);
  }

  const hasAnyInput = ["SMTP_HOST", "SMTP_PORT", "SMTP_FROM", "SMTP_USER", "SMTP_PASSWORD"].some(hasEnv);
  const missing: string[] = [];

  if (!hasEnv("SMTP_HOST")) {
    missing.push("SMTP_HOST");
  }

  if (!hasEnv("SMTP_PORT")) {
    missing.push("SMTP_PORT");
  }

  if (!hasEnv("SMTP_FROM")) {
    missing.push("SMTP_FROM");
  }

  if (hasEnv("SMTP_USER") && !hasEnv("SMTP_PASSWORD")) {
    missing.push("SMTP_PASSWORD");
  }

  if (hasEnv("SMTP_PASSWORD") && !hasEnv("SMTP_USER")) {
    missing.push("SMTP_USER");
  }

  return createStatus("email", "SMTP email", missing, hasAnyInput, ["password reset", "tenant activation", "payslip delivery"]);
}

export function getRedisRuntimeStatus() {
  const hasAnyInput = hasEnv("UPSTASH_REDIS_REST_URL") || hasEnv("UPSTASH_REDIS_REST_TOKEN");
  const missing: string[] = [];

  if (!hasEnv("UPSTASH_REDIS_REST_URL")) {
    missing.push("UPSTASH_REDIS_REST_URL");
  }

  if (!hasEnv("UPSTASH_REDIS_REST_TOKEN")) {
    missing.push("UPSTASH_REDIS_REST_TOKEN");
  }

  return createStatus("redis", "Upstash Redis", missing, hasAnyInput, ["rate limiting", "burst protection"]);
}

export function getRuntimeIntegrationReport(): RuntimeIntegrationReport {
  const items = [
    getRecaptchaRuntimeStatus(),
    getStorageRuntimeStatus(),
    getEmailRuntimeStatus(),
    getRedisRuntimeStatus(),
  ];

  return {
    items,
    summary: {
      total: items.length,
      configured: items.filter((item) => item.mode === "configured").length,
      partial: items.filter((item) => item.mode === "partial").length,
      missing: items.filter((item) => item.mode === "missing").length,
    },
  };
}