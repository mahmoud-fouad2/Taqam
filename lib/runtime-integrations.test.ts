import { afterEach, describe, expect, it } from "vitest";

import {
  getEmailRuntimeStatus,
  getRecaptchaRuntimeStatus,
  getRedisRuntimeStatus,
  getStorageRuntimeStatus,
} from "@/lib/runtime-integrations";

const originalEnv = { ...process.env };

function resetEnv() {
  for (const key of Object.keys(process.env)) {
    delete process.env[key];
  }

  Object.assign(process.env, originalEnv);
}

describe("runtime integration status", () => {
  afterEach(() => {
    resetEnv();
  });

  it("marks integrations as missing when required env vars are absent", () => {
    delete process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
    delete process.env.RECAPTCHA_SECRET_KEY;
    delete process.env.R2_ENDPOINT;
    delete process.env.R2_ACCOUNT_ID;
    delete process.env.R2_ACCESS_KEY_ID;
    delete process.env.R2_SECRET_ACCESS_KEY;
    delete process.env.R2_BUCKET_NAME;
    delete process.env.R2_PUBLIC_URL;
    delete process.env.SMTP_URL;
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PORT;
    delete process.env.SMTP_FROM;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASSWORD;
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;

    expect(getRecaptchaRuntimeStatus().mode).toBe("missing");
    expect(getStorageRuntimeStatus().mode).toBe("missing");
    expect(getEmailRuntimeStatus().mode).toBe("missing");
    expect(getRedisRuntimeStatus().mode).toBe("missing");
  });

  it("marks integrations as partial when only some env vars are present", () => {
    process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = "site-key";
    process.env.R2_BUCKET_NAME = "bucket";
    process.env.SMTP_HOST = "smtp.example.com";
    process.env.UPSTASH_REDIS_REST_URL = "https://redis.example.com";

    expect(getRecaptchaRuntimeStatus().mode).toBe("partial");
    expect(getStorageRuntimeStatus().mode).toBe("partial");
    expect(getEmailRuntimeStatus().mode).toBe("partial");
    expect(getRedisRuntimeStatus().mode).toBe("partial");
  });

  it("marks integrations as configured when all required env vars are present", () => {
    process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = "site-key";
    process.env.RECAPTCHA_SECRET_KEY = "secret-key";

    process.env.R2_ACCOUNT_ID = "account";
    process.env.R2_ACCESS_KEY_ID = "access";
    process.env.R2_SECRET_ACCESS_KEY = "secret";
    process.env.R2_BUCKET_NAME = "bucket";
    process.env.R2_PUBLIC_URL = "https://cdn.example.com";

    process.env.SMTP_HOST = "smtp.example.com";
    process.env.SMTP_PORT = "587";
    process.env.SMTP_FROM = "noreply@example.com";

    process.env.UPSTASH_REDIS_REST_URL = "https://redis.example.com";
    process.env.UPSTASH_REDIS_REST_TOKEN = "token";

    expect(getRecaptchaRuntimeStatus().configured).toBe(true);
    expect(getStorageRuntimeStatus().configured).toBe(true);
    expect(getEmailRuntimeStatus().configured).toBe(true);
    expect(getRedisRuntimeStatus().configured).toBe(true);
  });
});