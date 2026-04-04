/**
 * Audit Log Statistics API
 * GET /api/audit-logs/stats - Get audit log statistics
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasRole, isSuperAdminRole } from "@/lib/access-control";
import { getAuditLogStats } from "@/lib/audit/logger";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasRole(session.user.role, ["SUPER_ADMIN", "TENANT_ADMIN"])) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!isSuperAdminRole(session.user.role) && !session.user.tenantId) {
      return NextResponse.json({ error: "Tenant required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId") || undefined;

    const finalTenantId = isSuperAdminRole(session.user.role)
      ? tenantId
      : session.user.tenantId || undefined;

    const stats = await getAuditLogStats(finalTenantId);

    return NextResponse.json({ data: stats });
  } catch (error) {
    console.error("Error fetching audit log stats:", error);
    return NextResponse.json({ error: "Failed to fetch audit log stats" }, { status: 500 });
  }
}
