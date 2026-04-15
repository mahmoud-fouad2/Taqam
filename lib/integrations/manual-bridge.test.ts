import { describe, expect, it } from "vitest";

import {
  buildManualBridgeSyncSummary,
  getManualBridgeWorkflow,
  validateManualBridgeSyncSubmission
} from "@/lib/integrations/manual-bridge";

describe("manual bridge workflow validation", () => {
  it("exposes workflow definitions for manual providers", () => {
    expect(getManualBridgeWorkflow("gosi")?.steps.map((step) => step.id)).toEqual([
      "prepare-export",
      "submit-gosi-portal",
      "verify-gosi-response"
    ]);
  });

  it("rejects submissions that do not complete all required steps", () => {
    expect(
      validateManualBridgeSyncSubmission({
        providerKey: "wps",
        input: {
          confirmed: true,
          completedSteps: ["generate-sif"],
          note: "تم الإرسال"
        }
      })
    ).toEqual({
      ok: false,
      status: 400,
      error: "أكمل جميع خطوات الربط اليدوي قبل تسجيل المزامنة"
    });
  });

  it("rejects submissions that provide no reference and no note", () => {
    expect(
      validateManualBridgeSyncSubmission({
        providerKey: "gosi",
        input: {
          confirmed: true,
          completedSteps: ["prepare-export", "submit-gosi-portal", "verify-gosi-response"],
          note: "",
          referenceId: ""
        }
      })
    ).toEqual({
      ok: false,
      status: 400,
      error: "أدخل مرجعًا أو ملاحظة واحدة على الأقل لتوثيق المزامنة اليدوية"
    });
  });

  it("accepts valid submissions and normalizes optional fields", () => {
    expect(
      validateManualBridgeSyncSubmission({
        providerKey: "gosi",
        input: {
          confirmed: true,
          completedSteps: [
            "prepare-export",
            "submit-gosi-portal",
            "verify-gosi-response",
            "prepare-export"
          ],
          referenceId: "  GOSI-2026-04  ",
          note: "  تم رفع الملف  "
        }
      })
    ).toEqual({
      ok: true,
      data: {
        confirmed: true,
        completedSteps: ["prepare-export", "submit-gosi-portal", "verify-gosi-response"],
        referenceId: "GOSI-2026-04",
        note: "تم رفع الملف"
      }
    });
  });

  it("builds a readable manual sync summary", () => {
    expect(
      buildManualBridgeSyncSummary({
        providerKey: "wps",
        referenceId: "SIF-7788"
      })
    ).toBe("تم تسجيل المزامنة اليدوية لـ نظام حماية الأجور (WPS) بنجاح (مرجع: SIF-7788)");
  });
});
