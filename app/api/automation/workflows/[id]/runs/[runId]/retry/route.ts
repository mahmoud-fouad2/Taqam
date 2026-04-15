import { NextRequest, NextResponse } from "next/server";
import { retryWorkflowRun } from "@/lib/automation";
import { logApiError, requireTenantSession } from "@/lib/api/route-helper";

type RouteParams = { params: Promise<{ id: string; runId: string }> };

function canManageAutomation(role: string | undefined) {
  return role === "TENANT_ADMIN" || role === "HR_MANAGER";
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id, runId } = await params;
    const result = await requireTenantSession(req);
    if (!result.ok) return result.response;

    const { tenantId, session } = result;
    if (!canManageAutomation(session.user.role)) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    const run = await retryWorkflowRun(tenantId, id, runId);

    return NextResponse.json({
      ok: run.status === "success",
      data: {
        id: run.id,
        status: run.status,
        summary: run.summary ?? null,
        retryCount: run.retryCount,
        startedAt: run.startedAt.toISOString(),
        finishedAt: run.finishedAt?.toISOString() ?? null
      }
    });
  } catch (error) {
    logApiError("POST automation workflow retry error", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
