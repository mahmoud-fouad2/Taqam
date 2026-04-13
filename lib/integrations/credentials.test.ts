import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  decryptCredentials,
  encryptCredentials,
  isCredentialStoreConfigured
} from "@/lib/integrations/credentials";

// Use a deterministic 32-byte test key (never used in production)
const TEST_KEY_BASE64 = Buffer.alloc(32, 0xab).toString("base64");

describe("encryptCredentials / decryptCredentials", () => {
  beforeEach(() => {
    process.env.INTEGRATION_CREDENTIALS_KEY = TEST_KEY_BASE64;
  });

  afterEach(() => {
    delete process.env.INTEGRATION_CREDENTIALS_KEY;
  });

  it("roundtrip: encrypts and decrypts correctly", () => {
    const creds = { api_key: "secret-123", endpoint: "https://api.example.com" };
    const blob = encryptCredentials(creds);
    expect(blob).not.toBeNull();
    expect(typeof blob).toBe("string");

    const result = decryptCredentials(blob);
    expect(result).toEqual(creds);
  });

  it("returns null for empty credentials object", () => {
    expect(encryptCredentials({})).toBeNull();
  });

  it("produces different ciphertexts for same input (random IV per call)", () => {
    const creds = { key: "value" };
    const b1 = encryptCredentials(creds);
    const b2 = encryptCredentials(creds);
    expect(b1).not.toBe(b2);
  });

  it("decryptCredentials: returns null for null input", () => {
    expect(decryptCredentials(null)).toBeNull();
  });

  it("decryptCredentials: returns null for undefined input", () => {
    expect(decryptCredentials(undefined)).toBeNull();
  });

  it("decryptCredentials: returns null for empty string", () => {
    expect(decryptCredentials("")).toBeNull();
  });

  it("decryptCredentials: returns null for tampered blob (GCM auth check fails)", () => {
    const blob = encryptCredentials({ key: "value" })!;
    // Flip last byte of the base64 payload
    const buf = Buffer.from(blob, "base64");
    buf[buf.length - 1] ^= 0xff;
    const tampered = buf.toString("base64");
    expect(decryptCredentials(tampered)).toBeNull();
  });

  it("decryptCredentials: returns null for truncated blob", () => {
    const blob = encryptCredentials({ key: "value" })!;
    // Strip trailing chars so buffer is too short
    const truncated = blob.slice(0, 10);
    expect(decryptCredentials(truncated)).toBeNull();
  });

  it("decryptCredentials: returns null when key is wrong", () => {
    const blob = encryptCredentials({ key: "value" })!;
    // Switch to a different key for decryption
    const differentKey = Buffer.alloc(32, 0x11).toString("base64");
    process.env.INTEGRATION_CREDENTIALS_KEY = differentKey;
    expect(decryptCredentials(blob)).toBeNull();
  });
});

describe("isCredentialStoreConfigured", () => {
  afterEach(() => {
    delete process.env.INTEGRATION_CREDENTIALS_KEY;
  });

  it("returns true when key is set and valid", () => {
    process.env.INTEGRATION_CREDENTIALS_KEY = TEST_KEY_BASE64;
    expect(isCredentialStoreConfigured()).toBe(true);
  });

  it("returns false when key is not set", () => {
    expect(isCredentialStoreConfigured()).toBe(false);
  });

  it("returns false when key is wrong length", () => {
    process.env.INTEGRATION_CREDENTIALS_KEY = Buffer.alloc(16).toString("base64"); // 16 bytes, not 32
    expect(isCredentialStoreConfigured()).toBe(false);
  });
});
