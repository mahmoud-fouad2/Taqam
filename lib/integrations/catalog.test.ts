import { describe, expect, it } from "vitest";

import {
  INTEGRATION_PROVIDERS,
  getEnterpriseIntegrations,
  getIntegrationProvider,
  getLiveIntegrations
} from "@/lib/integrations/catalog";

describe("INTEGRATION_PROVIDERS catalog", () => {
  it("contains at least one provider", () => {
    expect(INTEGRATION_PROVIDERS.length).toBeGreaterThan(0);
  });

  it("every provider has required fields", () => {
    for (const p of INTEGRATION_PROVIDERS) {
      expect(p.key, `provider key missing`).toBeTruthy();
      expect(p.nameAr, `${p.key}: nameAr missing`).toBeTruthy();
      expect(p.nameEn, `${p.key}: nameEn missing`).toBeTruthy();
      expect(["live", "coming-soon", "enterprise-custom"], `${p.key}: invalid availability`).toContain(
        p.availability
      );
      expect(
        ["NATIVE_API", "EMBEDDED", "MANUAL_BRIDGE", "ENTERPRISE_CUSTOM"],
        `${p.key}: invalid defaultMode`
      ).toContain(p.defaultMode);
    }
  });

  it("all provider keys are unique", () => {
    const keys = INTEGRATION_PROVIDERS.map((p) => p.key);
    const unique = new Set(keys);
    expect(unique.size).toBe(keys.length);
  });
});

describe("getIntegrationProvider", () => {
  it("returns the GOSI provider by key", () => {
    const p = getIntegrationProvider("gosi");
    expect(p).toBeDefined();
    expect(p!.key).toBe("gosi");
    expect(p!.category).toBe("payroll-compliance");
  });

  it("returns the WPS provider by key", () => {
    const p = getIntegrationProvider("wps");
    expect(p).toBeDefined();
    expect(p!.credentialFields).toBeDefined();
    expect(p!.credentialFields!.length).toBeGreaterThan(0);
  });

  it("returns undefined for an unknown key", () => {
    expect(getIntegrationProvider("nonexistent-abc-xyz")).toBeUndefined();
  });
});

describe("getLiveIntegrations", () => {
  it("returns only live integrations", () => {
    const live = getLiveIntegrations();
    expect(live.length).toBeGreaterThan(0);
    for (const p of live) {
      expect(p.availability).toBe("live");
    }
  });

  it("all live integrations have credentialFields defined", () => {
    for (const p of getLiveIntegrations()) {
      expect(Array.isArray(p.credentialFields), `${p.key}: credentialFields should be an array`).toBe(
        true
      );
      expect(p.credentialFields!.length, `${p.key}: credentialFields should not be empty`).toBeGreaterThan(
        0
      );
    }
  });
});

describe("getEnterpriseIntegrations", () => {
  it("returns only enterprise-custom integrations", () => {
    const ent = getEnterpriseIntegrations();
    expect(ent.length).toBeGreaterThan(0);
    for (const p of ent) {
      expect(p.availability).toBe("enterprise-custom");
    }
  });

  it("enterprise integrations have ENTERPRISE_CUSTOM defaultMode", () => {
    for (const p of getEnterpriseIntegrations()) {
      expect(p.defaultMode).toBe("ENTERPRISE_CUSTOM");
    }
  });
});
