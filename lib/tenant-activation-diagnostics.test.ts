import { describe, expect, it } from "vitest";

import {
  buildTenantActivationDiagnostics,
  formatTenantActivationAuditSummary,
  formatTenantActivationAuditTitle,
  isTenantActivationAuditAction,
  type TenantActivationAuditLog
} from "@/lib/tenant-activation-diagnostics";

const baseLog: TenantActivationAuditLog = {
  id: "log_1",
  action: "SETUP_STEP_SAVED",
  entity: "SetupWizard",
  entityId: "tenant_1",
  oldData: null,
  newData: {
    step: 3,
    stepTitleAr: "الهيكل الأساسي",
    stepTitleEn: "Org structure",
    completionPercent: 60
  },
  createdAt: "2026-04-14T00:00:00.000Z",
  user: {
    id: "user_1",
    name: "Admin User",
    email: "admin@example.com"
  }
};

describe("tenant activation diagnostics", () => {
  it("recognizes activation-related audit actions", () => {
    expect(isTenantActivationAuditAction("SETUP_CHECKLIST_VIEWED")).toBe(true);
    expect(isTenantActivationAuditAction("LOGIN")).toBe(false);
  });

  it("formats localized titles and summaries for setup events", () => {
    expect(formatTenantActivationAuditTitle(baseLog, "ar")).toBe("حفظ خطوة الإعداد 3");
    expect(formatTenantActivationAuditSummary(baseLog, "en")).toBe(
      "Org structure • 60% progress"
    );
  });

  it("builds activation diagnostics stats and timeline", () => {
    const result = buildTenantActivationDiagnostics({
      auditLogs: [
        {
          ...baseLog,
          id: "log_2",
          action: "SETUP_COMPLETED",
          newData: {
            completionPercent: 100,
            completedSteps: ["step1", "step2", "step3", "step4", "step5"]
          },
          createdAt: "2026-04-15T00:00:00.000Z"
        },
        baseLog,
        {
          ...baseLog,
          id: "log_3",
          action: "LOGIN"
        }
      ],
      locale: "ar",
      setupStep: 3,
      setupCompletedAt: null
    });

    expect(result.activationEventCount).toBe(2);
    expect(result.savedSetupStepCount).toBe(1);
    expect(result.latestActivationProgress).toBe(100);
    expect(result.timeline[0]?.title).toBe("أكمل رحلة الإعداد");
  });
});