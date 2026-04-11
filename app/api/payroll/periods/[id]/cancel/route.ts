import { NextRequest, NextResponse } from "next/server";

import { requireRole } from "@/lib/api/route-helper";
import {
  getPayrollPeriodStatusTransitionError,
  mapPayrollPeriod,
  updatePayrollPeriodStatus
} from "@/lib/payroll/periods";
import { PAYROLL_ALLOWED_ROLES } from "@/lib/payroll/constants";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireRole(request, PAYROLL_ALLOWED_ROLES);
    if (!auth.ok) return auth.response;
    const { tenantId } = auth;
    const { id } = await params;

    const body = await request.json().catch(() => ({}));
    const reason = typeof body?.reason === "string" ? body.reason.trim() : "";

    const updated = await updatePayrollPeriodStatus({
      tenantId,
      id,
      status: "CANCELLED",
      note: reason ? `Cancellation reason: ${reason}` : body?.notes
    });

    if (!updated.ok) {
      if (updated.error === "not-found") {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      return NextResponse.json(
        { error: getPayrollPeriodStatusTransitionError(updated.currentStatus, "CANCELLED") },
        { status: 400 }
      );
    }

    return NextResponse.json({ data: mapPayrollPeriod(updated.period) });
  } catch (error) {
    console.error("Error cancelling payroll period:", error);
    return NextResponse.json({ error: "Failed to cancel payroll period" }, { status: 500 });
  }
}
