import { NextRequest, NextResponse } from "next/server";

import { requireTenantSession } from "@/lib/api/route-helper";
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
      role: session.user.role,
    });

    if ("error" in result) {
      const { error } = result;
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ data: result.history });
  } catch (error) {
    console.error("Error fetching employee salary history:", error);
    return NextResponse.json({ error: "Failed to fetch employee salary history" }, { status: 500 });
  }
}