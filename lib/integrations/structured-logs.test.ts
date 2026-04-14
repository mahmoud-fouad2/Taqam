import { describe, expect, it } from "vitest";

import {
  buildIntegrationSyncRunLogs,
  buildIntegrationTestRunLogs,
  createIntegrationRunLogEntry,
  parseIntegrationRunLogs
} from "@/lib/integrations/structured-logs";

describe("integration structured logs", () => {
  it("redacts sensitive context keys", () => {
    const entry = createIntegrationRunLogEntry({
      level: "info",
      category: "credentials",
      message: "saved",
      context: {
        clientSecret: "super-secret",
        mode: "NATIVE_API"
      },
      timestamp: new Date("2026-04-14T00:00:00.000Z")
    });

    expect(entry).toEqual({
      timestamp: "2026-04-14T00:00:00.000Z",
      level: "info",
      category: "credentials",
      message: "saved",
      context: {
        clientSecret: "[redacted]",
        mode: "NATIVE_API"
      }
    });
  });

  it("parses only valid log entries", () => {
    expect(
      parseIntegrationRunLogs([
        {
          timestamp: "2026-04-14T00:00:00.000Z",
          level: "info",
          category: "operation",
          message: "valid",
          context: { mode: "MANUAL_BRIDGE" }
        },
        {
          timestamp: 123,
          level: "info",
          category: "operation",
          message: "invalid"
        }
      ])
    ).toEqual([
      {
        timestamp: "2026-04-14T00:00:00.000Z",
        level: "info",
        category: "operation",
        message: "valid",
        context: { mode: "MANUAL_BRIDGE" }
      }
    ]);
  });

  it("builds manual-bridge sync logs without leaking credentials", () => {
    const logs = buildIntegrationSyncRunLogs({
      mode: "MANUAL_BRIDGE",
      trigger: "manual",
      runStatus: "success",
      manualBridgeContext: {
        referenceId: "SIF-88",
        note: "تم الرفع للبنك",
        completedSteps: ["generate-sif", "submit-bank"]
      },
      adapterContext: {
        providerKey: "wps",
        exportType: "bank-file",
        periodId: "period_1",
        periodName: "April 2026",
        rowCount: 12,
        fileName: "bank-file-april-2026-wps.csv",
        downloadPath: "/api/payroll/periods/period_1/bank-file?format=wps"
      }
    });

    expect(logs.map((entry) => entry.message)).toEqual([
      "بدأت المزامنة",
      "تم تسجيل مزامنة يدوية دون استدعاء خارجي",
      "تم توثيق تنفيذ خطوات الربط اليدوي",
      "تم تجهيز ملف التكامل من بيانات الرواتب الحالية",
      "تم تحديث آخر وقت مزامنة بنجاح"
    ]);
    expect(logs[2]?.context).toEqual({
      referenceId: "SIF-88",
      note: "تم الرفع للبنك",
      completedSteps: "generate-sif, submit-bank"
    });
    expect(logs[3]?.context).toEqual({
      providerKey: "wps",
      exportType: "bank-file",
      periodId: "period_1",
      periodName: "April 2026",
      rowCount: "12",
      fileName: "bank-file-april-2026-wps.csv",
      downloadPath: "/api/payroll/periods/period_1/bank-file?format=wps"
    });
  });

  it("builds scheduled partial logs for manual bridge providers", () => {
    const logs = buildIntegrationSyncRunLogs({
      mode: "MANUAL_BRIDGE",
      trigger: "scheduled",
      runStatus: "partial",
      awaitingManualAction: true,
      adapterContext: {
        providerKey: "gosi",
        exportType: "gosi-report",
        periodId: "period_2",
        periodName: "May 2026",
        rowCount: 8,
        fileName: "gosi-may-2026.csv",
        downloadPath: "/api/payroll/periods/period_2/gosi-report"
      }
    });

    expect(logs.map((entry) => entry.message)).toEqual([
      "بدأت المزامنة المجدولة",
      "تم تجهيز ملف التكامل لكن ما زال يتطلب إجراءً يدوياً لاعتماد المزامنة",
      "تم تجهيز ملف التكامل من بيانات الرواتب الحالية",
      "اكتملت المهمة جزئياً وتنتظر إتمام الربط اليدوي"
    ]);
  });

  it("adds retry context when rebuilding test logs", () => {
    const logs = buildIntegrationTestRunLogs({
      mode: "NATIVE_API",
      runStatus: "failed",
      errorMessage: "تحقق من مفتاح التشفير أو أعد حفظ بيانات الاعتماد",
      retryContext: {
        originalRunId: "run_123",
        previousRetryCount: 2,
        connectionStatus: "ERROR"
      }
    });

    expect(logs[0]?.category).toBe("retry");
    expect(logs[0]?.context).toEqual({
      mode: "NATIVE_API",
      originalRunId: "run_123",
      previousRetryCount: "2",
      connectionStatus: "ERROR"
    });
    expect(logs[1]?.message).toBe("تحقق من مفتاح التشفير أو أعد حفظ بيانات الاعتماد");
  });
});