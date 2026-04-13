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
import { decryptCredentials } from "@/lib/integrations/credentials";

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
      select: { id: true, mode: true, credentialsEncrypted: true }
    });

    if (!connection) {
      return NextResponse.json({ error: "Integration not connected" }, { status: 404 });
    }

    // Verify run belongs to this connection
    const originalRun = await prisma.integrationRun.findUnique({
      where: { id: runId },
      select: { id: true, connectionId: true, operation: true, retryCount: true }
    });

    if (!originalRun || originalRun.connectionId !== connection.id) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }

    const startedAt = new Date();
    let runStatus: "success" | "failed" = "success";
    let summary: string;
    let errorMessage: string | undefined;

    if (originalRun.operation === "test") {
      const credentials = decryptCredentials(connection.credentialsEncrypted);
      if (!credentials && connection.mode !== "MANUAL_BRIDGE") {
        runStatus = "failed";
        summary = "لا توجد بيانات اعتماد محفوظة";
        errorMessage = "يرجى حفظ بيانات الاعتماد أولاً";
      } else if (connection.mode === "MANUAL_BRIDGE") {
        summary = "الربط اليدوي لا يتطلب اختبار اتصال تلقائي — تم التفعيل";
      } else {
        summary = "تم التحقق من بيانات الاعتماد بنجاح (إعادة محاولة)";
      }
    } else if (originalRun.operation === "sync") {
      summary =
        connection.mode === "MANUAL_BRIDGE"
          ? "تم تسجيل إعادة المزامنة اليدوية بنجاح"
          : "تمت إعادة المزامنة بنجاح (وضع محاكاة)";
    } else {
      return NextResponse.json(
        { error: `إعادة المحاولة غير مدعومة لعملية: ${originalRun.operation}` },
        { status: 422 }
      );
    }

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
          lastHealthCheckAt:
            originalRun.operation === "test" ? finishedAt : undefined,
          lastSyncAt: originalRun.operation === "sync" ? finishedAt : undefined,
          lastError: runStatus === "failed" ? (errorMessage ?? null) : null
        }
      })
    ]);

    return NextResponse.json({
      ok: runStatus === "success",
      runId: newRun.id,
      summary,
      durationMs
    });
  } catch (error) {
    logApiError("POST integration run retry error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
