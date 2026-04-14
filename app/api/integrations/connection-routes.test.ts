import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const routeHelperMocks = vi.hoisted(() => ({
  requireTenantSession: vi.fn(),
  logApiError: vi.fn()
}));

const dbMocks = vi.hoisted(() => ({
  integrationConnectionFindUnique: vi.fn(),
  integrationConnectionUpdate: vi.fn(),
  integrationConnectionUpdateMany: vi.fn(),
  integrationRunFindUnique: vi.fn(),
  integrationRunCreate: vi.fn(),
  transaction: vi.fn()
}));

const syncExecutorMocks = vi.hoisted(() => ({
  executeIntegrationSync: vi.fn()
}));

const credentialsMocks = vi.hoisted(() => ({
  encryptCredentials: vi.fn()
}));

vi.mock("@/lib/api/route-helper", () => ({
  requireTenantSession: routeHelperMocks.requireTenantSession,
  logApiError: routeHelperMocks.logApiError
}));

vi.mock("@/lib/db", () => ({
  default: {
    integrationConnection: {
      findUnique: dbMocks.integrationConnectionFindUnique,
      update: dbMocks.integrationConnectionUpdate,
      updateMany: dbMocks.integrationConnectionUpdateMany
    },
    integrationRun: {
      findUnique: dbMocks.integrationRunFindUnique,
      create: dbMocks.integrationRunCreate
    },
    $transaction: dbMocks.transaction
  }
}));

vi.mock("@/lib/integrations/sync-executor", () => ({
  executeIntegrationSync: syncExecutorMocks.executeIntegrationSync
}));

vi.mock("@/lib/integrations/credentials", () => ({
  encryptCredentials: credentialsMocks.encryptCredentials
}));

import {
  DELETE as deleteIntegrationConnection,
  GET as getIntegrationConnection,
  PATCH as patchIntegrationConnection
} from "./[key]/route";
import { POST as retryIntegrationRunPost } from "./[key]/runs/[runId]/retry/route";
import { POST as syncIntegrationPost } from "./[key]/sync/route";
import { POST as testIntegrationConnectionPost } from "./[key]/test/route";

function createRequest(url: string, body?: unknown, method = "POST") {
  return new Request(url, {
    method,
    ...(body === undefined
      ? {}
      : {
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(body)
        })
  }) as NextRequest;
}

function buildTenantSessionResult() {
  return {
    ok: true as const,
    tenantId: "tenant_1",
    session: {
      user: {
        id: "user_1",
        email: "admin@example.com",
        role: "TENANT_ADMIN",
        tenantId: "tenant_1",
        firstName: "Admin",
        lastName: "User",
        permissions: []
      }
    }
  };
}

describe("integration connection routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    routeHelperMocks.requireTenantSession.mockResolvedValue(buildTenantSessionResult());

    dbMocks.integrationConnectionFindUnique.mockResolvedValue({
      id: "conn_1",
      mode: "MANUAL_BRIDGE",
      status: "CONNECTED",
      credentialsEncrypted: null,
      config: null
    });

    dbMocks.integrationRunFindUnique.mockResolvedValue({
      id: "run_1",
      connectionId: "conn_1",
      operation: "test",
      status: "failed",
      retryCount: 1
    });

    dbMocks.integrationRunCreate.mockResolvedValue({
      id: "run_2",
      retryCount: 2
    });

    dbMocks.integrationConnectionUpdate.mockResolvedValue({
      id: "conn_1"
    });

    dbMocks.integrationConnectionUpdateMany.mockResolvedValue({
      count: 1
    });

    dbMocks.transaction.mockImplementation(async (operations: Promise<unknown>[]) =>
      Promise.all(operations)
    );

    syncExecutorMocks.executeIntegrationSync.mockReset();
    credentialsMocks.encryptCredentials.mockReset();
    credentialsMocks.encryptCredentials.mockReturnValue("encrypted-credentials");
  });

  it("returns provider metadata when no tenant connection exists yet", async () => {
    dbMocks.integrationConnectionFindUnique.mockResolvedValueOnce(null);

    const response = await getIntegrationConnection(createRequest("http://localhost/api/integrations/gosi", undefined, "GET"), {
      params: Promise.resolve({ key: "gosi" })
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.connection).toBeNull();
    expect(body.data.provider).toMatchObject({
      key: "gosi",
      nameEn: "GOSI"
    });
  });

  it("returns a normalized connection snapshot with parsed run logs", async () => {
    dbMocks.integrationConnectionFindUnique.mockResolvedValueOnce({
      id: "conn_1",
      providerKey: "gosi",
      mode: "MANUAL_BRIDGE",
      status: "CONNECTED",
      lastConnectedAt: new Date("2026-04-14T00:00:00.000Z"),
      lastSyncAt: new Date("2026-04-14T01:00:00.000Z"),
      lastHealthCheckAt: new Date("2026-04-14T01:05:00.000Z"),
      lastError: null,
      config: {
        syncSchedule: {
          enabled: true,
          frequency: "weekly",
          enabledAt: "2026-04-01T00:00:00.000Z",
          lastOutcome: "success",
          lastSummary: "آخر مزامنة"
        }
      },
      createdAt: new Date("2026-04-01T00:00:00.000Z"),
      updatedAt: new Date("2026-04-14T01:05:00.000Z"),
      credentialsEncrypted: "blob",
      runs: [
        {
          id: "run_1",
          operation: "sync",
          status: "partial",
          summary: "بانتظار الإرسال اليدوي",
          errorMessage: null,
          logs: [
            {
              timestamp: "2026-04-14T01:00:00.000Z",
              level: "info",
              category: "operation",
              message: "بدأت المزامنة"
            },
            {
              timestamp: 123,
              level: "info",
              category: "operation",
              message: "invalid"
            }
          ],
          durationMs: 42,
          retryCount: 1,
          startedAt: new Date("2026-04-14T01:00:00.000Z"),
          finishedAt: null
        }
      ]
    });

    const response = await getIntegrationConnection(createRequest("http://localhost/api/integrations/gosi", undefined, "GET"), {
      params: Promise.resolve({ key: "gosi" })
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.providerKey).toBe("gosi");
    expect(body.data.hasCredentials).toBe(true);
    expect(body.data.credentialsEncrypted).toBeUndefined();
    expect(body.data.config.syncSchedule).toMatchObject({
      enabled: true,
      frequency: "weekly",
      lastOutcome: "success"
    });
    expect(body.data.lastConnectedAt).toBe("2026-04-14T00:00:00.000Z");
    expect(body.data.runs).toHaveLength(1);
    expect(body.data.runs[0]).toMatchObject({
      id: "run_1",
      operation: "sync",
      status: "partial",
      retryCount: 1
    });
    expect(body.data.runs[0].logs).toEqual([
      {
        timestamp: "2026-04-14T01:00:00.000Z",
        level: "info",
        category: "operation",
        message: "بدأت المزامنة"
      }
    ]);
  });

  it("rejects invalid integration config updates", async () => {
    dbMocks.integrationConnectionFindUnique.mockResolvedValueOnce({
      id: "conn_1",
      config: null
    });

    const response = await patchIntegrationConnection(
      createRequest(
        "http://localhost/api/integrations/gosi",
        {
          config: {
            syncSchedule: {
              enabled: true,
              frequency: "hourly"
            }
          }
        },
        "PATCH"
      ),
      {
        params: Promise.resolve({ key: "gosi" })
      }
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: "Invalid integration sync schedule" });
    expect(dbMocks.integrationConnectionUpdate).not.toHaveBeenCalled();
  });

  it("merges schedule config updates and reverts status to pending when credentials change", async () => {
    dbMocks.integrationConnectionFindUnique.mockResolvedValueOnce({
      id: "conn_1",
      config: {
        syncSchedule: {
          enabled: true,
          frequency: "weekly",
          enabledAt: "2026-04-01T00:00:00.000Z",
          lastTriggeredAt: "2026-04-10T00:00:00.000Z",
          lastOutcome: "success",
          lastSummary: "آخر مزامنة ناجحة"
        }
      }
    });

    dbMocks.integrationConnectionUpdate.mockResolvedValueOnce({
      id: "conn_1",
      providerKey: "gosi",
      mode: "NATIVE_API",
      status: "PENDING",
      updatedAt: new Date("2026-04-14T02:00:00.000Z")
    });

    const response = await patchIntegrationConnection(
      createRequest(
        "http://localhost/api/integrations/gosi",
        {
          mode: "NATIVE_API",
          credentials: { apiKey: "secret" },
          config: {
            syncSchedule: {
              enabled: true,
              frequency: "daily"
            }
          }
        },
        "PATCH"
      ),
      {
        params: Promise.resolve({ key: "gosi" })
      }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toMatchObject({
      id: "conn_1",
      providerKey: "gosi",
      mode: "NATIVE_API",
      status: "PENDING"
    });
    expect(credentialsMocks.encryptCredentials).toHaveBeenCalledWith({ apiKey: "secret" });
    expect(dbMocks.integrationConnectionUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "conn_1" },
        data: expect.objectContaining({
          mode: "NATIVE_API",
          status: "PENDING",
          credentialsEncrypted: "encrypted-credentials",
          config: {
            syncSchedule: {
              enabled: true,
              frequency: "daily",
              enabledAt: "2026-04-01T00:00:00.000Z",
              lastTriggeredAt: "2026-04-10T00:00:00.000Z",
              lastOutcome: "success",
              lastSummary: "آخر مزامنة ناجحة"
            }
          }
        })
      })
    );
  });

  it("disconnects the integration while preserving historical runs", async () => {
    const response = await deleteIntegrationConnection(
      createRequest("http://localhost/api/integrations/gosi", undefined, "DELETE"),
      {
        params: Promise.resolve({ key: "gosi" })
      }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true });
    expect(dbMocks.integrationConnectionUpdateMany).toHaveBeenCalledWith({
      where: { tenantId: "tenant_1", providerKey: "gosi" },
      data: {
        status: "DISCONNECTED",
        credentialsEncrypted: null,
        lastConnectedAt: null,
        lastError: null
      }
    });
  });

  it("records a successful manual-bridge connection test", async () => {
    const response = await testIntegrationConnectionPost(createRequest("http://localhost/api/integrations/wps/test"), {
      params: Promise.resolve({ key: "wps" })
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.status).toBe("CONNECTED");
    expect(body.summary).toBe("الربط اليدوي لا يتطلب اختبار اتصال تلقائي — تم التفعيل");

    expect(dbMocks.integrationRunCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          connectionId: "conn_1",
          operation: "test",
          status: "success"
        })
      })
    );

    expect(dbMocks.integrationConnectionUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "conn_1" },
        data: expect.objectContaining({
          status: "CONNECTED",
          lastError: null,
          lastHealthCheckAt: expect.any(Date),
          lastConnectedAt: expect.any(Date)
        })
      })
    );
  });

  it("returns ok false when saved credentials are missing in a native test run", async () => {
    dbMocks.integrationConnectionFindUnique.mockResolvedValueOnce({
      id: "conn_1",
      mode: "NATIVE_API",
      status: "ERROR",
      credentialsEncrypted: null
    });

    const response = await testIntegrationConnectionPost(createRequest("http://localhost/api/integrations/gosi/test"), {
      params: Promise.resolve({ key: "gosi" })
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(false);
    expect(body.status).toBe("ERROR");
    expect(body.error).toBe("يرجى حفظ بيانات الاعتماد أولاً");

    expect(dbMocks.integrationConnectionUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "ERROR",
          lastError: "يرجى حفظ بيانات الاعتماد أولاً"
        })
      })
    );
  });

  it("rejects retrying a run that did not fail", async () => {
    dbMocks.integrationRunFindUnique.mockResolvedValueOnce({
      id: "run_1",
      connectionId: "conn_1",
      operation: "test",
      status: "success",
      retryCount: 0
    });

    const response = await retryIntegrationRunPost(
      createRequest("http://localhost/api/integrations/gosi/runs/run_1/retry"),
      {
        params: Promise.resolve({ key: "gosi", runId: "run_1" })
      }
    );
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body).toEqual({ error: "لا يمكن إعادة المحاولة إلا للتشغيلات الفاشلة" });
    expect(syncExecutorMocks.executeIntegrationSync).not.toHaveBeenCalled();
    expect(dbMocks.integrationRunCreate).not.toHaveBeenCalled();
  });

  it("blocks sync attempts for disconnected integrations", async () => {
    dbMocks.integrationConnectionFindUnique.mockResolvedValueOnce({
      id: "conn_1",
      mode: "MANUAL_BRIDGE",
      status: "DISCONNECTED"
    });

    const response = await syncIntegrationPost(createRequest("http://localhost/api/integrations/wps/sync"), {
      params: Promise.resolve({ key: "wps" })
    });
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body).toEqual({ error: "لا يمكن المزامنة — التكامل غير مربوط" });
    expect(syncExecutorMocks.executeIntegrationSync).not.toHaveBeenCalled();
  });

  it("validates manual bridge sync payloads before executing sync", async () => {
    dbMocks.integrationConnectionFindUnique.mockResolvedValueOnce({
      id: "conn_1",
      mode: "MANUAL_BRIDGE",
      status: "CONNECTED"
    });

    const response = await syncIntegrationPost(
      createRequest("http://localhost/api/integrations/wps/sync", {
        confirmed: true,
        completedSteps: []
      }),
      {
        params: Promise.resolve({ key: "wps" })
      }
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: "أدخل مرجعًا أو ملاحظة واحدة على الأقل لتوثيق المزامنة اليدوية"
    });
    expect(syncExecutorMocks.executeIntegrationSync).not.toHaveBeenCalled();
  });

  it("passes validated manual bridge submissions to sync execution", async () => {
    dbMocks.integrationConnectionFindUnique.mockResolvedValueOnce({
      id: "conn_1",
      mode: "MANUAL_BRIDGE",
      status: "CONNECTED"
    });

    syncExecutorMocks.executeIntegrationSync.mockResolvedValueOnce({
      ok: true,
      runId: "run_sync_1",
      runStatus: "success",
      summary: "تم تسجيل المزامنة اليدوية لـ نظام حماية الأجور (WPS) بنجاح",
      durationMs: 44,
      logs: [
        {
          timestamp: "2026-04-14T00:00:00.000Z",
          level: "info",
          category: "operation",
          message: "بدأت المزامنة"
        }
      ],
      lastSyncAt: "2026-04-14T00:00:00.000Z"
    });

    const response = await syncIntegrationPost(
      createRequest("http://localhost/api/integrations/wps/sync", {
        confirmed: true,
        completedSteps: ["generate-sif", "submit-bank", "confirm-acceptance"],
        referenceId: "BATCH-2026-04",
        note: "تم الإرسال إلى البنك"
      }),
      {
        params: Promise.resolve({ key: "wps" })
      }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.runId).toBe("run_sync_1");
    expect(body.runStatus).toBe("success");

    expect(syncExecutorMocks.executeIntegrationSync).toHaveBeenCalledWith({
      tenantId: "tenant_1",
      providerKey: "wps",
      trigger: "manual",
      manualBridgeSubmission: {
        confirmed: true,
        completedSteps: ["generate-sif", "submit-bank", "confirm-acceptance"],
        referenceId: "BATCH-2026-04",
        note: "تم الإرسال إلى البنك"
      }
    });
  });

  it("delegates sync retries to the sync executor with retry context", async () => {
    dbMocks.integrationConnectionFindUnique.mockResolvedValueOnce({
      id: "conn_1",
      mode: "EMBEDDED",
      status: "ERROR",
      credentialsEncrypted: "encrypted-value"
    });

    dbMocks.integrationRunFindUnique.mockResolvedValueOnce({
      id: "run_9",
      connectionId: "conn_1",
      operation: "sync",
      status: "failed",
      retryCount: 2
    });

    syncExecutorMocks.executeIntegrationSync.mockResolvedValueOnce({
      ok: true,
      runId: "run_10",
      runStatus: "success",
      summary: "تمت إعادة المزامنة بنجاح",
      durationMs: 55,
      logs: [
        {
          timestamp: "2026-04-14T00:00:00.000Z",
          level: "info",
          category: "retry",
          message: "بدأت إعادة المزامنة"
        }
      ],
      lastSyncAt: "2026-04-14T00:00:00.000Z"
    });

    const response = await retryIntegrationRunPost(
      createRequest("http://localhost/api/integrations/gosi/runs/run_9/retry"),
      {
        params: Promise.resolve({ key: "gosi", runId: "run_9" })
      }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.runId).toBe("run_10");
    expect(body.retryCount).toBe(3);

    expect(syncExecutorMocks.executeIntegrationSync).toHaveBeenCalledWith({
      tenantId: "tenant_1",
      providerKey: "gosi",
      trigger: "retry",
      retryContext: {
        originalRunId: "run_9",
        previousRetryCount: 2,
        connectionStatus: "ERROR"
      }
    });
  });

  it("creates a new test run when retrying a failed connection test", async () => {
    dbMocks.integrationConnectionFindUnique.mockResolvedValueOnce({
      id: "conn_1",
      mode: "MANUAL_BRIDGE",
      status: "ERROR",
      credentialsEncrypted: null
    });

    dbMocks.integrationRunFindUnique.mockResolvedValueOnce({
      id: "run_4",
      connectionId: "conn_1",
      operation: "test",
      status: "failed",
      retryCount: 2
    });

    dbMocks.integrationRunCreate.mockResolvedValueOnce({
      id: "run_5",
      retryCount: 3
    });

    const response = await retryIntegrationRunPost(
      createRequest("http://localhost/api/integrations/wps/runs/run_4/retry"),
      {
        params: Promise.resolve({ key: "wps", runId: "run_4" })
      }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.runId).toBe("run_5");
    expect(body.retryCount).toBe(3);
    expect(body.summary).toBe("الربط اليدوي لا يتطلب اختبار اتصال تلقائي — تم التفعيل");

    expect(dbMocks.integrationRunCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          connectionId: "conn_1",
          operation: "test",
          status: "success",
          retryCount: 3
        })
      })
    );

    expect(dbMocks.integrationConnectionUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "CONNECTED",
          lastError: null,
          lastHealthCheckAt: expect.any(Date),
          lastConnectedAt: expect.any(Date)
        })
      })
    );
  });
});