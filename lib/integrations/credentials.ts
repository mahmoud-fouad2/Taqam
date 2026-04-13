/**
 * Integration Credentials — Encrypted Store
 *
 * Encrypts/decrypts integration credentials using AES-256-GCM.
 * The encryption key is read from INTEGRATION_CREDENTIALS_KEY env var (base64-encoded 32 bytes).
 *
 * Security properties:
 * - AES-256-GCM provides authenticated encryption (protects against tampering).
 * - A random IV is generated per encryption call; stored alongside the ciphertext.
 * - The key never leaves the server; only the encrypted blob is persisted in DB.
 * - `encryptCredentials` returns null when credentials are empty.
 * - `decryptCredentials` returns null when the stored value is missing/invalid.
 *
 * Usage:
 *   const blob = encryptCredentials({ apiKey: "..." });
 *   await prisma.integrationConnection.update({ data: { credentialsEncrypted: blob } });
 *
 *   const creds = decryptCredentials(connection.credentialsEncrypted);
 */

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12; // 96-bit IV recommended for GCM
const AUTH_TAG_BYTES = 16;

function getEncryptionKey(): Buffer {
  const raw = process.env.INTEGRATION_CREDENTIALS_KEY;
  if (!raw) {
    throw new Error(
      "INTEGRATION_CREDENTIALS_KEY environment variable is not set. " +
        "Generate a key with: node -e \"console.log(require('crypto').randomBytes(32).toString('base64'))\""
    );
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error(
      `INTEGRATION_CREDENTIALS_KEY must be a base64-encoded 32-byte value, got ${key.length} bytes`
    );
  }
  return key;
}

/**
 * Encrypt a credentials object. Returns base64-encoded blob: iv | authTag | ciphertext.
 * Returns null if the credentials object is empty (no keys).
 */
export function encryptCredentials(
  credentials: Record<string, string>
): string | null {
  if (Object.keys(credentials).length === 0) return null;

  const key = getEncryptionKey();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const plaintext = JSON.stringify(credentials);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Layout: iv (12) | authTag (16) | ciphertext (variable)
  const blob = Buffer.concat([iv, authTag, encrypted]);
  return blob.toString("base64");
}

/**
 * Decrypt a credentials blob previously returned by encryptCredentials.
 * Returns null if the input is null/undefined/empty or decryption fails.
 */
export function decryptCredentials(
  blob: string | null | undefined
): Record<string, string> | null {
  if (!blob) return null;

  try {
    const key = getEncryptionKey();
    const buf = Buffer.from(blob, "base64");

    if (buf.length < IV_BYTES + AUTH_TAG_BYTES + 1) return null;

    const iv = buf.subarray(0, IV_BYTES);
    const authTag = buf.subarray(IV_BYTES, IV_BYTES + AUTH_TAG_BYTES);
    const ciphertext = buf.subarray(IV_BYTES + AUTH_TAG_BYTES);

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    const plaintext = decipher.update(ciphertext) + decipher.final("utf8");
    const parsed = JSON.parse(plaintext);

    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return null;
    return parsed as Record<string, string>;
  } catch {
    // Decryption failed (wrong key, corrupted data, or tamper attempt)
    return null;
  }
}

/**
 * Returns true if INTEGRATION_CREDENTIALS_KEY is configured and valid.
 * Use this for health checks or startup validation.
 */
export function isCredentialStoreConfigured(): boolean {
  try {
    getEncryptionKey();
    return true;
  } catch {
    return false;
  }
}
