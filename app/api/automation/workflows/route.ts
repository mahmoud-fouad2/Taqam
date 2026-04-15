import { NextRequest, NextResponse } from "next/server";
import { getAutomationDashboard, ensureDefaultWorkflows } from "@/lib/automation";
import { logApiError, requireTenantSession } from "@/lib/api/route-helper";

function canManageAutomation(role: string | undefined) {
  return role === "TENANT_ADMIN" || role === "HR_MANAGER";
}

export async function GET(req: NextRequest) {
  try {
    const result = await requireTenantSession(req);
    if (!result.ok) return result.response;

    const { tenantId, session } = result;
    if (!canManageAutomation(session.user.role)) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    const dashboard = await getAutomationDashboard(tenantId);
    return NextResponse.json({ data: dashboard });
  } catch (error) {
    logApiError("GET automation workflows error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const result = await requireTenantSession(req);
    if (!result.ok) return result.response;

    const { tenantId, session } = result;
    if (!canManageAutomation(session.user.role)) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    await ensureDefaultWorkflows(tenantId);
    const dashboard = await getAutomationDashboard(tenantId);
    return NextResponse.json({ data: dashboard });
  } catch (error) {
    logApiError("POST automation workflows seed error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
