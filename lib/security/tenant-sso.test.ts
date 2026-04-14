import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  getTenantSsoAuditShape,
  mergeTenantSsoSettings,
  resolveTenantSsoSettingsForServer,
  sanitizeTenantSsoSettingsForClient
} from "@/lib/security/tenant-sso";

const TEST_KEY_BASE64 = Buffer.alloc(32, 0xee).toString("base64");

describe("tenant SSO settings security helpers", () => {
  beforeEach(() => {
    process.env.TENANT_SETTINGS_ENCRYPTION_KEY = TEST_KEY_BASE64;
  });

  afterEach(() => {
    delete process.env.TENANT_SETTINGS_ENCRYPTION_KEY;
  });

  it("encrypts new client secrets and keeps them off the client payload", () => {
    const stored = mergeTenantSsoSettings({}, {
      entraId: {
        tenantId: "tenant-123",
        clientId: "client-123",
        clientSecret: "super-secret"
      }
    });

    expect(stored.entraId?.clientSecret).toBeDefined();
    expect(stored.entraId?.clientSecret).not.toBe("super-secret");

    expect(resolveTenantSsoSettingsForServer(stored).entraId?.clientSecret).toBe("super-secret");
    expect(sanitizeTenantSsoSettingsForClient(stored)).toEqual({
      entraId: {
        tenantId: "tenant-123",
        clientId: "client-123",
        hasClientSecret: true,
        enabled: undefined
      },
      google: undefined,
      saml: undefined
    });
  });

  it("preserves an existing stored secret when a blank replacement is submitted", () => {
    const current = mergeTenantSsoSettings({}, {
      google: {
        clientId: "google-client",
        clientSecret: "existing-secret",
        hostedDomain: "company.com"
      }
    });

    const merged = mergeTenantSsoSettings(current, {
      google: {
        clientId: "google-client-updated",
        clientSecret: "",
        hostedDomain: "company.com"
      }
    });

    expect(resolveTenantSsoSettingsForServer(merged).google?.clientSecret).toBe("existing-secret");
    expect(merged.google?.clientId).toBe("google-client-updated");
  });

  it("supports legacy plaintext secrets when resolving server-side config", () => {
    expect(
      resolveTenantSsoSettingsForServer({
        entraId: {
          tenantId: "legacy-tenant",
          clientId: "legacy-client",
          clientSecret: "legacy-plain-secret"
        }
      }).entraId?.clientSecret
    ).toBe("legacy-plain-secret");
  });

  it("produces an audit-safe shape with secret presence only", () => {
    const auditShape = getTenantSsoAuditShape({
      google: {
        clientId: "google-client",
        clientSecret: "plain-secret",
        hostedDomain: "company.com",
        enabled: true
      }
    });

    expect(auditShape).toEqual({
      entraId: undefined,
      google: {
        clientId: "google-client",
        hostedDomain: "company.com",
        hasClientSecret: true,
        enabled: true
      },
      saml: undefined
    });
  });
});