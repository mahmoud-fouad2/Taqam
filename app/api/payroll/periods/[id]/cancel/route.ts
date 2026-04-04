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
      status: "CANCELLED",
      note: reason ? `Cancellation reason: ${reason}` : body?.notes,
    });

    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ data: mapPayrollPeriod(updated) });
  } catch (error) {
    console.error("Error cancelling payroll period:", error);
    return NextResponse.json({ error: "Failed to cancel payroll period" }, { status: 500 });
  }
}