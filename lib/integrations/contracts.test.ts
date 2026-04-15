import { describe, expect, it } from "vitest";

import {
  buildIntegrationConnectionSnapshot,
  buildIntegrationConnectionTestResponse,
  buildIntegrationRetryResponse,
  buildIntegrationRunRecord,
  buildIntegrationSyncResponse,
  getIntegrationApiErrorMessage,
  parseIntegrationConnectionTestResponse,
  parseIntegrationRetryResponse,
  parseIntegrationSyncResponse
} from "@/lib/integrations/contracts";

describe("integration contracts", () => {
  it("normalizes run records and filters invalid logs", () => {
    const run = buildIntegrationRunRecord({
      id: "run_1",
      operation: "test",
      status: "success",
      summary: "ok",
      errorMessage: null,
      logs: [
        {
          timestamp: "2026-04-14T00:00:00.000Z",
          level: "info",
          category: "operation",
          message: "valid"
        },
        {
          timestamp: 123,
          level: "info",
          category: "operation",
          message: "invalid"
        }
      ],
      durationMs: 42,
      retryCount: 0,
      startedAt: new Date("2026-04-14T00:00:00.000Z"),
      finishedAt: new Date("2026-04-14T00:00:42.000Z")
    });

    expect(run.logs).toEqual([
      {
        timestamp: "2026-04-14T00:00:00.000Z",
        level: "info",
        category: "operation",
        message: "valid"
      }
    ]);
    expect(run.finishedAt).toBe("2026-04-14T00:00:42.000Z");
  });

  it("builds connection snapshots with normalized config and runs", () => {
    const snapshot = buildIntegrationConnectionSnapshot({
      providerKey: "gosi",
      mode: "MANUAL_BRIDGE",
      status: "CONNECTED",
      config: {
        syncSchedule: {
          enabled: true,
          frequency: "weekly",
          lastSummary: "last sync"
        }
      },
      lastConnectedAt: new Date("2026-04-14T00:00:00.000Z"),
      lastSyncAt: null,
      lastError: null,
      hasCredentials: true,
      runs: [
        {
          id: "run_1",
          operation: "sync",
          status: "partial",
          summary: "waiting manual confirmation",
          errorMessage: null,
          logs: [],
          durationMs: 12,
          retryCount: 0,
          startedAt: "2026-04-14T00:00:00.000Z",
          finishedAt: null
        }
      ]
    });

    expect(snapshot.config?.syncSchedule).toEqual({
      enabled: true,
      frequency: "weekly",
      lastSummary: "last sync"
    });
    expect(snapshot.runs[0]?.operation).toBe("sync");
  });

  it("parses typed operation responses and surfaces fallback errors", () => {
    const testResponse = buildIntegrationConnectionTestResponse({
      ok: true,
      runId: "run_test_1",
      status: "CONNECTED",
      summary: "test ok",
      durationMs: 10,
      logs: []
    });

    const syncResponse = buildIntegrationSyncResponse({
      runId: "run_sync_1",
      runStatus: "success",
      summary: "sync ok",
      durationMs: 24,
      logs: [],
      lastSyncAt: "2026-04-14T00:00:00.000Z"
    });

    const retryResponse = buildIntegrationRetryResponse({
      ok: false,
      runId: "run_retry_1",
      retryCount: 2,
      error: "retry failed",
      logs: []
    });

    expect(parseIntegrationConnectionTestResponse(testResponse).success).toBe(true);
    expect(parseIntegrationSyncResponse(syncResponse).success).toBe(true);
    expect(parseIntegrationRetryResponse(retryResponse).success).toBe(true);
    expect(getIntegrationApiErrorMessage({ error: "server failed" }, "fallback message")).toBe(
      "server failed"
    );
    expect(getIntegrationApiErrorMessage(null, "fallback message")).toBe("fallback message");
  });
});
