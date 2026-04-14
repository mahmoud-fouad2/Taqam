/**
 * Trigger Integration Sync
 * POST /api/integrations/[key]/sync
 *
 * For MANUAL_BRIDGE: records a manual sync completion (user confirms data was
 * exported/submitted manually). Updates lastSyncAt and creates a run record.
 * For NATIVE_API: reserved for real adapter calls (stubbed with a placeholder).
 */

import { NextRequest, NextResponse } from "next/server";
import { requireTenantSession, logApiError } from "@/lib/api/route-helper";
import prisma from "@/lib/db";
import { buildIntegrationSyncResponse } from "@/lib/integrations/contracts";
import {
  type ManualBridgeSyncSubmission,
  validateManualBridgeSyncSubmission
} from "@/lib/integrations/manual-bridge";
import { executeIntegrationSync } from "@/lib/integrations/sync-executor";

type Params = { params: Promise<{ key: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { key } = await params;
    const result = await requireTenantSession();
    if (!result.ok) return result.response;
    const { tenantId } = result;
    const body = await req.json().catch(() => ({}));

    const connection = await prisma.integrationConnection.findUnique({
      where: { tenantId_providerKey: { tenantId, providerKey: key } },
      select: { id: true, mode: true, status: true }
    });

    if (!connection) {
      return NextResponse.json({ error: "Integration not connected" }, { status: 404 });
    }

    if (connection.status === "DISCONNECTED") {
      return NextResponse.json(
        { error: "لا يمكن المزامنة — التكامل غير مربوط" },
        { status: 409 }
      );
    }

    let manualBridgeSubmission: ManualBridgeSyncSubmission | undefined;
    if (connection.mode === "MANUAL_BRIDGE") {
      const validation = validateManualBridgeSyncSubmission({
        providerKey: key,
        input: body
      });

      if (!validation.ok) {
        return NextResponse.json({ error: validation.error }, { status: validation.status });
      }

      manualBridgeSubmission = validation.data;
    }

    const syncResult = await executeIntegrationSync({
      tenantId,
      providerKey: key,
      trigger: "manual",
      manualBridgeSubmission
    });

    if (!syncResult.ok) {
      return NextResponse.json({ error: syncResult.error }, { status: syncResult.status });
    }

    return NextResponse.json(
      buildIntegrationSyncResponse({
        runId: syncResult.runId,
        runStatus: syncResult.runStatus,
        summary: syncResult.summary,
        durationMs: syncResult.durationMs,
        logs: syncResult.logs,
        lastSyncAt: syncResult.lastSyncAt
      })
    );
  } catch (error) {
    logApiError("POST integration sync error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
