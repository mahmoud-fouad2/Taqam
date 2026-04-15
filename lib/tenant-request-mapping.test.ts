import { describe, expect, it } from "vitest";

import {
  deriveTenantRequestActivationStage,
  mapTenantRequestFromDb,
  mapTenantRequestPlan
} from "@/lib/tenant-request-mapping";

describe("tenant request mapping", () => {
  it("maps pricing plans to the request contract", () => {
    expect(mapTenantRequestPlan("BASIC")).toBe("starter");
    expect(mapTenantRequestPlan("PROFESSIONAL")).toBe("business");
    expect(mapTenantRequestPlan("ENTERPRISE")).toBe("enterprise");
    expect(mapTenantRequestPlan("TRIAL")).toBe("trial");
  });

  it("derives a lead stage for pending requests without a tenant", () => {
    expect(
      deriveTenantRequestActivationStage({
        requestStatus: "PENDING",
        tenantStatus: null,
        setupCompletedAt: null
      })
    ).toBe("lead");
  });

  it("derives a pending-activation stage for approved requests with pending tenants", () => {
    expect(
      deriveTenantRequestActivationStage({
        requestStatus: "APPROVED",
        tenantStatus: "PENDING",
        setupCompletedAt: null
      })
    ).toBe("pending-activation");
  });

  it("derives an activating stage until setup completes", () => {
    expect(
      deriveTenantRequestActivationStage({
        requestStatus: "APPROVED",
        tenantStatus: "ACTIVE",
        setupCompletedAt: null
      })
    ).toBe("activating");
  });

  it("maps request records with tenant activation context", () => {
    expect(
      mapTenantRequestFromDb({
        id: "req_1",
        companyName: "Acme",
        companyNameAr: "أكمي",
        contactName: "Amina",
        contactEmail: "amina@example.com",
        contactPhone: "+966500000000",
        employeeCount: "11-50",
        plan: "PROFESSIONAL",
        status: "APPROVED",
        createdAt: new Date("2026-04-13T00:00:00.000Z"),
        processedAt: new Date("2026-04-14T00:00:00.000Z"),
        tenantId: "tenant_1",
        message: "demo",
        tenant: {
          status: "ACTIVE",
          setupCompletedAt: null
        }
      }).activationStage
    ).toBe("activating");
  });
});
