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

type Params = { params: Promise<{ key: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const { key } = await params;
    const result = await requireTenantSession();
    if (!result.ok) return result.response;
    const { tenantId } = result;

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

    const startedAt = new Date();
    let summary: string;

    if (connection.mode === "MANUAL_BRIDGE") {
      summary = "تم تسجيل المزامنة اليدوية بنجاح";
    } else {
      // NATIVE_API / EMBEDDED — placeholder until real adapters are wired
      summary = "تمت المزامنة (وضع محاكاة — سيتحول لمزامنة حقيقية عند تفعيل الـ adapter)";
    }

    const finishedAt = new Date();
    const durationMs = finishedAt.getTime() - startedAt.getTime();

    await prisma.$transaction([
      prisma.integrationRun.create({
        data: {
          connectionId: connection.id,
          operation: "sync",
          status: "success",
          summary,
          durationMs,
          startedAt,
          finishedAt
        }
      }),
      prisma.integrationConnection.update({
        where: { id: connection.id },
        data: {
          lastSyncAt: finishedAt,
          lastError: null
        }
      })
    ]);

    return NextResponse.json({
      ok: true,
      summary,
      durationMs,
      lastSyncAt: finishedAt.toISOString()
    });
  } catch (error) {
    logApiError("POST integration sync error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
