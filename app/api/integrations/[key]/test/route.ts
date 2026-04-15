/**
 * Test Integration Connection
 * POST /api/integrations/[key]/test
 *
 * Verifies saved credentials by attempting a lightweight connection check.
 * For MANUAL_BRIDGE providers, immediately marks CONNECTED (no remote API).
 * For NATIVE_API providers: reserved for real adapter checks (stubbed).
 * Always creates an IntegrationRun record.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireTenantSession, logApiError } from "@/lib/api/route-helper";
import prisma from "@/lib/db";
import { buildIntegrationConnectionTestResponse } from "@/lib/integrations/contracts";
import { resolveIntegrationTestRunResult } from "@/lib/integrations/run-policy";
import { buildIntegrationTestRunLogs } from "@/lib/integrations/structured-logs";

type Params = { params: Promise<{ key: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const { key } = await params;
    const result = await requireTenantSession();
    if (!result.ok) return result.response;
    const { tenantId } = result;

    const connection = await prisma.integrationConnection.findUnique({
      where: { tenantId_providerKey: { tenantId, providerKey: key } },
      select: {
        id: true,
        mode: true,
        status: true,
        credentialsEncrypted: true
      }
    });

    if (!connection) {
      return NextResponse.json({ error: "Integration not connected" }, { status: 404 });
    }

    const startedAt = new Date();
    const { runStatus, summary, errorMessage } = resolveIntegrationTestRunResult({
      mode: connection.mode,
      credentialsEncrypted: connection.credentialsEncrypted
    });
    const logs = buildIntegrationTestRunLogs({
      mode: connection.mode,
      runStatus,
      errorMessage
    });

    const finishedAt = new Date();
    const durationMs = finishedAt.getTime() - startedAt.getTime();

    // ── Persist run record ──────────────────────────────────────────────────

    const [run] = await prisma.$transaction([
      prisma.integrationRun.create({
        data: {
          connectionId: connection.id,
          operation: "test",
          status: runStatus,
          summary,
          ...(errorMessage ? { errorMessage } : {}),
          logs,
          durationMs,
          startedAt,
          finishedAt
        }
      }),
      prisma.integrationConnection.update({
        where: { id: connection.id },
        data: {
          status: runStatus === "success" ? "CONNECTED" : "ERROR",
          lastHealthCheckAt: finishedAt,
          lastConnectedAt: runStatus === "success" ? finishedAt : undefined,
          lastError: runStatus === "failed" ? (errorMessage ?? null) : null
        }
      })
    ]);

    return NextResponse.json(
      buildIntegrationConnectionTestResponse({
        ok: runStatus === "success",
        runId: run.id,
        status: runStatus === "success" ? "CONNECTED" : "ERROR",
        summary,
        durationMs,
        logs,
        ...(errorMessage ? { error: errorMessage } : {})
      })
    );
  } catch (error) {
    logApiError("POST integration test error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
