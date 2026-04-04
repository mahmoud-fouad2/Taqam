import { NextRequest, NextResponse } from "next/server";

import { requireTenantSession } from "@/lib/api/route-helper";
import { listPayslipsForPeriod } from "@/lib/payroll/payslips";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireTenantSession(request);
    if (!auth.ok) return auth.response;
    const { tenantId } = auth;
    const { id } = await params;

    const url = new URL(request.url);
    const status = url.searchParams.get("status") || undefined;
    const q = url.searchParams.get("q") || undefined;

    const result = await listPayslipsForPeriod(tenantId, id, { status, q });
    if (!result.period) {
      return NextResponse.json({ error: "Payroll period not found" }, { status: 404 });
    }

    return NextResponse.json({ data: result.payslips });
  } catch (error) {
    console.error("Error fetching period payslips:", error);
    return NextResponse.json({ error: "Failed to fetch period payslips" }, { status: 500 });
  }
}