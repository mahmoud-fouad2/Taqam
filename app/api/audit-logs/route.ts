/**
 * Audit Log API Routes
 * GET /api/audit-logs - List audit logs with filters
 * GET /api/audit-logs/stats - Get audit log statistics
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasRole, isSuperAdminRole } from "@/lib/access-control";
import { getAuditLogs, type AuditAction, type AuditLogFilters } from "@/lib/audit/logger";

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

    const filters: AuditLogFilters = {
      tenantId: searchParams.get("tenantId") || session.user.tenantId || undefined,
      userId: searchParams.get("userId") || undefined,
      action: (searchParams.get("action") as AuditAction | null) || undefined,
      entity: searchParams.get("entity") || undefined,
      entityId: searchParams.get("entityId") || undefined,
      startDate: searchParams.get("startDate")
        ? new Date(searchParams.get("startDate")!)
        : undefined,
      endDate: searchParams.get("endDate") ? new Date(searchParams.get("endDate")!) : undefined,
      page: searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1,
      pageSize: searchParams.get("pageSize") ? parseInt(searchParams.get("pageSize")!) : 50,
    };

    if (!isSuperAdminRole(session.user.role)) {
      filters.tenantId = session.user.tenantId || undefined;
    }

    const result = await getAuditLogs(filters);

    return NextResponse.json({
      data: result.logs,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 });
  }
}
