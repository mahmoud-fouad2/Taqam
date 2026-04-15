import { describe, expect, it } from "vitest";

import {
  buildMobileDiagnosticsAuditPayload,
  buildMobileDiagnosticsSummary,
  getMobileDiagnosticsAuditAction,
  parseMobileDiagnosticsReport,
  type MobileDiagnosticsAuditLog
} from "@/lib/mobile-diagnostics";

describe("mobile diagnostics", () => {
  it("parses valid mobile diagnostics payloads and redacts sensitive tags", () => {
    const parsed = parseMobileDiagnosticsReport({
      message: "TypeError: undefined is not a function",
      source: "global",
      severity: "fatal",
      route: "/(tabs)/history",
      tags: {
        build: "54",
        accessToken: "secret-token"
      }
    });

    expect(parsed).toEqual({
      ok: true,
      data: {
        message: "TypeError: undefined is not a function",
        source: "global",
        severity: "fatal",
        route: "/(tabs)/history",
        name: undefined,
        stack: undefined,
        componentStack: undefined,
        tags: {
          build: "54",
          accessToken: "[redacted]"
        }
      }
    });
  });

  it("maps fatal severity to crash audit actions", () => {
    expect(getMobileDiagnosticsAuditAction("fatal")).toBe("MOBILE_APP_CRASH");
    expect(getMobileDiagnosticsAuditAction("error")).toBe("MOBILE_APP_ERROR");
  });

  it("builds audit payloads and localized summaries", () => {
    const parsed = parseMobileDiagnosticsReport({
      name: "TypeError",
      message: "Cannot read property 'map' of undefined",
      source: "error-boundary",
      severity: "error",
      route: "/(tabs)/payslips"
    });

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      throw new Error("Expected parsed mobile diagnostics payload");
    }

    expect(
      buildMobileDiagnosticsAuditPayload({
        report: parsed.data,
        device: {
          deviceId: "device_1",
          platform: "android",
          appVersion: "2.0.0"
        },
        role: "EMPLOYEE",
        employeeId: "emp_1"
      })
    ).toMatchObject({
      message: "Cannot read property 'map' of undefined",
      route: "/(tabs)/payslips",
      platform: "android",
      appVersion: "2.0.0",
      role: "EMPLOYEE",
      employeeId: "emp_1"
    });

    const summary = buildMobileDiagnosticsSummary({
      logs: [
        {
          id: "log_1",
          action: "MOBILE_APP_CRASH",
          tenantId: "tenant_1",
          createdAt: "2026-04-14T00:00:00.000Z",
          newData: {
            message: "App crashed on launch",
            source: "startup",
            route: "/",
            appVersion: "2.0.0",
            platform: "android"
          },
          user: {
            id: "user_1",
            name: "Employee User",
            email: "employee@example.com"
          }
        } satisfies MobileDiagnosticsAuditLog
      ],
      locale: "ar",
      totalEventsLast7Days: 4,
      fatalEventsLast7Days: 2,
      affectedTenantsCount: 1,
      tenantNameById: {
        tenant_1: "شركة الاختبار"
      }
    });

    expect(summary.totalEventsLast7Days).toBe(4);
    expect(summary.fatalEventsLast7Days).toBe(2);
    expect(summary.latestAppVersion).toBe("2.0.0");
    expect(summary.recentEvents[0]?.severityLabel).toBe("انهيار");
    expect(summary.recentEvents[0]?.tenantLabel).toBe("شركة الاختبار");
  });
});
