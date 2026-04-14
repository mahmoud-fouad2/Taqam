/**
 * Retry Failed Integration Run
 * POST /api/integrations/[key]/runs/[runId]/retry
 *
 * Re-runs the same operation that previously failed.
 * Supported operations: test, sync.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireTenantSession, logApiError } from "@/lib/api/route-helper";
import prisma from "@/lib/db";
import { buildIntegrationRetryResponse } from "@/lib/integrations/contracts";
import {
  getIntegrationRetryValidationError,
  resolveIntegrationTestRunResult
} from "@/lib/integrations/run-policy";
import { executeIntegrationSync } from "@/lib/integrations/sync-executor";
import { buildIntegrationTestRunLogs } from "@/lib/integrations/structured-logs";

type Params = { params: Promise<{ key: string; runId: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const { key, runId } = await params;
    const result = await requireTenantSession();
    if (!result.ok) return result.response;
    const { tenantId } = result;

    // Verify connection belongs to tenant
    const connection = await prisma.integrationConnection.findUnique({
      where: { tenantId_providerKey: { tenantId, providerKey: key } },
      select: { id: true, mode: true, status: true, credentialsEncrypted: true }
    });

    if (!connection) {
      return NextResponse.json({ error: "Integration not connected" }, { status: 404 });
    }

    // Verify run belongs to this connection
    const originalRun = await prisma.integrationRun.findUnique({
      where: { id: runId },
      select: {
        id: true,
        connectionId: true,
        operation: true,
        status: true,
        retryCount: true
      }
    });

    if (!originalRun || originalRun.connectionId !== connection.id) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }

    const retryValidationError = getIntegrationRetryValidationError({
      operation: originalRun.operation,
      runRecordStatus: originalRun.status,
      retryCount: originalRun.retryCount,
      connectionStatus: connection.status
    });

    if (retryValidationError) {
      return NextResponse.json(
        { error: retryValidationError.error },
        { status: retryValidationError.status }
      );
    }

    if (originalRun.operation === "sync") {
      const syncResult = await executeIntegrationSync({
        tenantId,
        providerKey: key,
        trigger: "retry",
        retryContext: {
          originalRunId: originalRun.id,
          previousRetryCount: originalRun.retryCount,
          connectionStatus: connection.status
        }
      });

      if (!syncResult.ok) {
        return NextResponse.json(
          buildIntegrationRetryResponse({
            ok: false,
            runId: syncResult.runId,
            retryCount: originalRun.retryCount + 1,
            error: syncResult.error,
            durationMs: syncResult.durationMs,
            logs: syncResult.logs,
            runStatus: syncResult.runStatus
          }),
          { status: syncResult.status }
        );
      }

      return NextResponse.json(
        buildIntegrationRetryResponse({
          ok: true,
          runId: syncResult.runId,
          retryCount: originalRun.retryCount + 1,
          summary: syncResult.summary,
          durationMs: syncResult.durationMs,
          logs: syncResult.logs,
          runStatus: syncResult.runStatus
        })
      );
    }

    const startedAt = new Date();
    const executionResult = resolveIntegrationTestRunResult({
      mode: connection.mode,
      credentialsEncrypted: connection.credentialsEncrypted,
      isRetry: true
    });

    const { runStatus, summary, errorMessage } = executionResult;
    const logs = buildIntegrationTestRunLogs({
      mode: connection.mode,
      runStatus,
      errorMessage,
      retryContext: {
        originalRunId: originalRun.id,
        previousRetryCount: originalRun.retryCount,
        connectionStatus: connection.status
      }
    });

    const finishedAt = new Date();
    const durationMs = finishedAt.getTime() - startedAt.getTime();

    const [newRun] = await prisma.$transaction([
      prisma.integrationRun.create({
        data: {
          connectionId: connection.id,
          operation: originalRun.operation,
          status: runStatus,
          summary,
          ...(errorMessage ? { errorMessage } : {}),
          logs,
          durationMs,
          retryCount: originalRun.retryCount + 1,
          startedAt,
          finishedAt
        }
      }),
      prisma.integrationConnection.update({
        where: { id: connection.id },
        data: {
          status: runStatus === "success" ? "CONNECTED" : "ERROR",
          lastConnectedAt: runStatus === "success" ? finishedAt : undefined,
          lastHealthCheckAt: finishedAt,
          lastError: runStatus === "failed" ? (errorMessage ?? null) : null
        }
      })
    ]);

    return NextResponse.json(
      buildIntegrationRetryResponse({
        ok: runStatus === "success",
        runId: newRun.id,
        retryCount: newRun.retryCount,
        summary,
        durationMs,
        logs,
        runStatus,
        ...(errorMessage ? { error: errorMessage } : {})
      })
    );
  } catch (error) {
    logApiError("POST integration run retry error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
