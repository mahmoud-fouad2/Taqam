import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;
const AUTH_TAG_BYTES = 16;
const ENCRYPTED_SECRET_PREFIX = "enc:v1:";

type OAuthProviderInput = {
  clientId?: string;
  clientSecret?: string;
  enabled?: boolean;
};

type EntraIdProviderInput = OAuthProviderInput & {
  tenantId?: string;
};

type GoogleProviderInput = OAuthProviderInput & {
  hostedDomain?: string;
};

type SamlProviderInput = {
  metadataUrl?: string;
  entityId?: string;
  acsUrl?: string;
  enabled?: boolean;
};

export type TenantSsoInputConfig = {
  entraId?: EntraIdProviderInput;
  google?: GoogleProviderInput;
  saml?: SamlProviderInput;
};

type OAuthProviderStored = {
  clientId?: string;
  clientSecret?: string;
  enabled?: boolean;
};

type EntraIdProviderStored = OAuthProviderStored & {
  tenantId?: string;
};

type GoogleProviderStored = OAuthProviderStored & {
  hostedDomain?: string;
};

type SamlProviderStored = {
  metadataUrl?: string;
  entityId?: string;
  acsUrl?: string;
  enabled?: boolean;
};

export type TenantSsoStoredConfig = {
  entraId?: EntraIdProviderStored;
  google?: GoogleProviderStored;
  saml?: SamlProviderStored;
};

type OAuthProviderClient = {
  clientId?: string;
  clientSecret?: string;
  hasClientSecret?: boolean;
  enabled?: boolean;
};

type EntraIdProviderClient = OAuthProviderClient & {
  tenantId?: string;
};

type GoogleProviderClient = OAuthProviderClient & {
  hostedDomain?: string;
};

type SamlProviderClient = {
  metadataUrl?: string;
  entityId?: string;
  acsUrl?: string;
  enabled?: boolean;
};

export type TenantSsoClientConfig = {
  entraId?: EntraIdProviderClient;
  google?: GoogleProviderClient;
  saml?: SamlProviderClient;
};

function getEncryptionKeyFromBase64(value: string, name: string): Buffer {
  const key = Buffer.from(value, "base64");
  if (key.length !== 32) {
    throw new Error(`${name} must be a base64-encoded 32-byte value`);
  }
  return key;
}

function getTenantSsoEncryptionKey(): Buffer {
  const explicit = process.env.TENANT_SETTINGS_ENCRYPTION_KEY?.trim();
  if (explicit) {
    return getEncryptionKeyFromBase64(explicit, "TENANT_SETTINGS_ENCRYPTION_KEY");
  }

  const integrationKey = process.env.INTEGRATION_CREDENTIALS_KEY?.trim();
  if (integrationKey) {
    return getEncryptionKeyFromBase64(integrationKey, "INTEGRATION_CREDENTIALS_KEY");
  }

  const authSecret = process.env.NEXTAUTH_SECRET?.trim() || process.env.AUTH_SECRET?.trim();
  if (authSecret) {
    return createHash("sha256").update(`tenant-sso:${authSecret}`).digest();
  }

  throw new Error(
    "A tenant settings encryption key is required. Set TENANT_SETTINGS_ENCRYPTION_KEY, INTEGRATION_CREDENTIALS_KEY, or NEXTAUTH_SECRET."
  );
}

function normalizeOptionalString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function encryptSecret(secret: string): string {
  const key = getTenantSsoEncryptionKey();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${ENCRYPTED_SECRET_PREFIX}${Buffer.concat([iv, authTag, ciphertext]).toString("base64")}`;
}

function decryptSecret(secret: string | undefined): string | undefined {
  if (!secret) {
    return undefined;
  }

  if (!secret.startsWith(ENCRYPTED_SECRET_PREFIX)) {
    return secret;
  }

  try {
    const key = getTenantSsoEncryptionKey();
    const buf = Buffer.from(secret.slice(ENCRYPTED_SECRET_PREFIX.length), "base64");

    if (buf.length < IV_BYTES + AUTH_TAG_BYTES + 1) {
      return undefined;
    }

    const iv = buf.subarray(0, IV_BYTES);
    const authTag = buf.subarray(IV_BYTES, IV_BYTES + AUTH_TAG_BYTES);
    const ciphertext = buf.subarray(IV_BYTES + AUTH_TAG_BYTES);

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    const plaintext = decipher.update(ciphertext) + decipher.final("utf8");
    return plaintext.trim().length > 0 ? plaintext : undefined;
  } catch {
    return undefined;
  }
}

function hasDefinedValue(value: unknown) {
  return value !== undefined && value !== null;
}

function pruneEmptyObject<T extends Record<string, unknown>>(value: T): T | undefined {
  return Object.values(value).some(hasDefinedValue) ? value : undefined;
}

function normalizeStoredOAuthProvider<T extends OAuthProviderStored & Record<string, unknown>>(
  value: unknown,
  extraFields: Array<keyof T>
): T | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  const source = value as Record<string, unknown>;
  const normalized = {
    clientId: normalizeOptionalString(source.clientId),
    clientSecret: normalizeOptionalString(source.clientSecret),
    enabled: typeof source.enabled === "boolean" ? source.enabled : undefined
  } as OAuthProviderStored & Record<string, unknown>;

  for (const field of extraFields) {
    normalized[field as string] = normalizeOptionalString(source[field as string]);
  }

  return pruneEmptyObject(normalized as T);
}

function normalizeStoredSamlProvider(value: unknown): SamlProviderStored | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  return pruneEmptyObject({
    metadataUrl: normalizeOptionalString((value as Record<string, unknown>).metadataUrl),
    entityId: normalizeOptionalString((value as Record<string, unknown>).entityId),
    acsUrl: normalizeOptionalString((value as Record<string, unknown>).acsUrl),
    enabled:
      typeof (value as Record<string, unknown>).enabled === "boolean"
        ? ((value as Record<string, unknown>).enabled as boolean)
        : undefined
  });
}

function normalizeStoredTenantSsoConfig(value: unknown): TenantSsoStoredConfig {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const source = value as Record<string, unknown>;
  return {
    entraId: normalizeStoredOAuthProvider<EntraIdProviderStored>(source.entraId, ["tenantId"]),
    google: normalizeStoredOAuthProvider<GoogleProviderStored>(source.google, ["hostedDomain"]),
    saml: normalizeStoredSamlProvider(source.saml)
  };
}

function mergeOAuthProvider<
  TStored extends OAuthProviderStored & Record<string, unknown>,
  TInput extends OAuthProviderInput & Record<string, unknown>
>({
  current,
  incoming,
  extraFields
}: {
  current: TStored | undefined;
  incoming: TInput | undefined;
  extraFields: Array<keyof TStored & keyof TInput>;
}): TStored | undefined {
  if (incoming === undefined) {
    return current;
  }

  const merged = {
    clientId: normalizeOptionalString(incoming.clientId),
    enabled: typeof incoming.enabled === "boolean" ? incoming.enabled : current?.enabled
  } as OAuthProviderStored & Record<string, unknown>;

  for (const field of extraFields) {
    merged[field as string] = normalizeOptionalString(incoming[field]);
  }

  const nextSecret = normalizeOptionalString(incoming.clientSecret)
    ? encryptSecret(incoming.clientSecret!.trim())
    : current?.clientSecret;

  if (nextSecret) {
    merged.clientSecret = nextSecret;
  }

  return pruneEmptyObject(merged as TStored);
}

function mergeSamlProvider({
  current,
  incoming
}: {
  current: SamlProviderStored | undefined;
  incoming: SamlProviderInput | undefined;
}): SamlProviderStored | undefined {
  if (incoming === undefined) {
    return current;
  }

  return pruneEmptyObject({
    metadataUrl: normalizeOptionalString(incoming.metadataUrl),
    entityId: normalizeOptionalString(incoming.entityId),
    acsUrl: normalizeOptionalString(incoming.acsUrl),
    enabled: typeof incoming.enabled === "boolean" ? incoming.enabled : current?.enabled
  });
}

export function mergeTenantSsoSettings(
  currentValue: unknown,
  incomingValue: TenantSsoInputConfig
): TenantSsoStoredConfig {
  const current = normalizeStoredTenantSsoConfig(currentValue);

  return {
    entraId: mergeOAuthProvider<EntraIdProviderStored, EntraIdProviderInput>({
      current: current.entraId,
      incoming: incomingValue.entraId,
      extraFields: ["tenantId"]
    }),
    google: mergeOAuthProvider<GoogleProviderStored, GoogleProviderInput>({
      current: current.google,
      incoming: incomingValue.google,
      extraFields: ["hostedDomain"]
    }),
    saml: mergeSamlProvider({
      current: current.saml,
      incoming: incomingValue.saml
    })
  };
}

export function sanitizeTenantSsoSettingsForClient(value: unknown): TenantSsoClientConfig {
  const stored = normalizeStoredTenantSsoConfig(value);

  return {
    entraId: stored.entraId
      ? {
          tenantId: stored.entraId.tenantId,
          clientId: stored.entraId.clientId,
          hasClientSecret: Boolean(stored.entraId.clientSecret),
          enabled: stored.entraId.enabled
        }
      : undefined,
    google: stored.google
      ? {
          clientId: stored.google.clientId,
          hostedDomain: stored.google.hostedDomain,
          hasClientSecret: Boolean(stored.google.clientSecret),
          enabled: stored.google.enabled
        }
      : undefined,
    saml: stored.saml
      ? {
          metadataUrl: stored.saml.metadataUrl,
          entityId: stored.saml.entityId,
          acsUrl: stored.saml.acsUrl,
          enabled: stored.saml.enabled
        }
      : undefined
  };
}

export function resolveTenantSsoSettingsForServer(value: unknown): TenantSsoStoredConfig {
  const stored = normalizeStoredTenantSsoConfig(value);

  return {
    entraId: stored.entraId
      ? {
          ...stored.entraId,
          clientSecret: decryptSecret(stored.entraId.clientSecret)
        }
      : undefined,
    google: stored.google
      ? {
          ...stored.google,
          clientSecret: decryptSecret(stored.google.clientSecret)
        }
      : undefined,
    saml: stored.saml
  };
}

export function getTenantSsoAuditShape(value: unknown): TenantSsoClientConfig {
  return sanitizeTenantSsoSettingsForClient(value);
}
