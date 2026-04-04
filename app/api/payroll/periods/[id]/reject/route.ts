import { NextRequest, NextResponse } from "next/server";

import { requireTenantSession } from "@/lib/api/route-helper";
import { mapPayrollPeriod, updatePayrollPeriodStatus } from "@/lib/payroll/periods";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireTenantSession(request);
    if (!auth.ok) return auth.response;
    const { tenantId } = auth;
    const { id } = await params;

    const body = await request.json().catch(() => ({}));
    const reason = typeof body?.reason === "string" ? body.reason.trim() : "";
    const updated = await updatePayrollPeriodStatus({
      tenantId,
      id,
      status: "DRAFT",
      note: reason ? `Rejection reason: ${reason}` : "Returned to draft for review.",
    });

    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ data: mapPayrollPeriod(updated) });
  } catch (error) {
    console.error("Error rejecting payroll period:", error);
    return NextResponse.json({ error: "Failed to reject payroll period" }, { status: 500 });
  }
}