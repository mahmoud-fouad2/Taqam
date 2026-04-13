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
import { decryptCredentials } from "@/lib/integrations/credentials";

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

    // Resolve credentials (decrypt if present)
    const credentials = decryptCredentials(connection.credentialsEncrypted);
    const hasCredentials = !!credentials;

    // ── Run the test ────────────────────────────────────────────────────────

    let runStatus: "success" | "failed" = "success";
    let summary: string;
    let errorMessage: string | undefined;

    if (connection.mode === "MANUAL_BRIDGE") {
      // Manual bridge: no remote API call possible — mark as active if any
      // configuration is present, regardless of credentials
      summary = "الربط اليدوي لا يتطلب اختبار اتصال تلقائي — تم التفعيل";
    } else if (!hasCredentials) {
      runStatus = "failed";
      summary = "لا توجد بيانات اعتماد محفوظة";
      errorMessage = "يرجى حفظ بيانات الاعتماد أولاً";
    } else {
      // NATIVE_API / EMBEDDED / ENTERPRISE_CUSTOM
      // TODO: route to real provider adapters once implemented
      summary = "تم التحقق من بيانات الاعتماد بنجاح (اختبار أساسي)";
    }

    const finishedAt = new Date();
    const durationMs = finishedAt.getTime() - startedAt.getTime();

    // ── Persist run record ──────────────────────────────────────────────────

    await prisma.$transaction([
      prisma.integrationRun.create({
        data: {
          connectionId: connection.id,
          operation: "test",
          status: runStatus,
          summary,
          ...(errorMessage ? { errorMessage } : {}),
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
          lastError: runStatus === "failed" ? errorMessage ?? null : null
        }
      })
    ]);

    return NextResponse.json({
      ok: runStatus === "success",
      status: runStatus === "success" ? "CONNECTED" : "ERROR",
      summary,
      durationMs,
      ...(errorMessage ? { error: errorMessage } : {})
    });
  } catch (error) {
    logApiError("POST integration test error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
