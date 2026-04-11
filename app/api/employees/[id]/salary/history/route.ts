import { NextRequest, NextResponse } from "next/server";

import {
  dataResponse,
  errorResponse,
  logApiError,
  requireTenantSession
} from "@/lib/api/route-helper";
import { listEmployeeSalaryHistory } from "@/lib/payroll/compensation";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireTenantSession(request);
    if (!auth.ok) return auth.response;

    const { tenantId, session } = auth;
    const { id } = await params;
    const result = await listEmployeeSalaryHistory({
      tenantId,
      employeeId: id,
      userId: session.user.id,
      role: session.user.role
    });

    if ("error" in result) {
      const { error } = result;
      return errorResponse(error.message, error.status);
    }

    return dataResponse(result.history);
  } catch (error) {
    logApiError("Error fetching employee salary history", error);
    return errorResponse("Failed to fetch employee salary history");
  }
}
