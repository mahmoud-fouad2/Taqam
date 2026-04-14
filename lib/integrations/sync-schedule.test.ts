import { describe, expect, it } from "vitest";

import {
  getNextIntegrationSyncDueAt,
  mergeIntegrationConnectionConfigUpdate,
  recordIntegrationSyncScheduleExecution,
  validateIntegrationConnectionConfig
} from "@/lib/integrations/sync-schedule";

describe("integration sync schedule", () => {
  it("rejects invalid schedule payloads", () => {
    expect(
      validateIntegrationConnectionConfig({
        syncSchedule: {
          enabled: true,
          frequency: "hourly"
        }
      })
    ).toEqual({
      ok: false,
      error: "Invalid integration sync schedule"
    });
  });

  it("adds enabledAt when schedule is first enabled and preserves run state", () => {
    expect(
      mergeIntegrationConnectionConfigUpdate({
        currentConfig: {
          syncSchedule: {
            enabled: false,
            frequency: "weekly",
            lastTriggeredAt: "2026-04-10T08:00:00.000Z",
            lastOutcome: "partial",
            lastSummary: "بانتظار الإرسال اليدوي"
          }
        },
        nextConfig: {
          syncSchedule: {
            enabled: true,
            frequency: "daily"
          }
        },
        now: new Date("2026-04-12T09:30:00.000Z")
      })
    ).toEqual({
      syncSchedule: {
        enabled: true,
        frequency: "daily",
        enabledAt: "2026-04-12T09:30:00.000Z",
        lastTriggeredAt: "2026-04-10T08:00:00.000Z",
        lastOutcome: "partial",
        lastSummary: "بانتظار الإرسال اليدوي"
      }
    });
  });

  it("records scheduled execution metadata", () => {
    expect(
      recordIntegrationSyncScheduleExecution({
        config: {
          syncSchedule: {
            enabled: true,
            frequency: "weekly",
            enabledAt: "2026-04-01T00:00:00.000Z"
          }
        },
        executedAt: new Date("2026-04-08T00:00:00.000Z"),
        outcome: "success",
        summary: "تم تجهيز تقرير GOSI"
      })
    ).toEqual({
      syncSchedule: {
        enabled: true,
        frequency: "weekly",
        enabledAt: "2026-04-01T00:00:00.000Z",
        lastTriggeredAt: "2026-04-08T00:00:00.000Z",
        lastOutcome: "success",
        lastSummary: "تم تجهيز تقرير GOSI"
      }
    });
  });

  it("computes the next due time from the latest sync anchor", () => {
    expect(
      getNextIntegrationSyncDueAt({
        config: {
          syncSchedule: {
            enabled: true,
            frequency: "weekly",
            enabledAt: "2026-04-01T00:00:00.000Z",
            lastTriggeredAt: "2026-04-08T00:00:00.000Z"
          }
        },
        createdAt: "2026-03-20T00:00:00.000Z",
        lastConnectedAt: "2026-04-02T00:00:00.000Z",
        lastSyncAt: "2026-04-10T00:00:00.000Z"
      })?.toISOString()
    ).toBe("2026-04-17T00:00:00.000Z");
  });
});