import { NextRequest, NextResponse } from "next/server";

import { logApiError, requireRole } from "@/lib/api/route-helper";
import { sendPayslipsForPeriod } from "@/lib/payroll/payslips";
import { PAYROLL_ALLOWED_ROLES } from "@/lib/payroll/constants";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireRole(_request, PAYROLL_ALLOWED_ROLES);
    if (!auth.ok) return auth.response;
    const { tenantId } = auth;
    const { id } = await params;

    const result = await sendPayslipsForPeriod(tenantId, id);
    if (!result) {
      return NextResponse.json({ error: "Payroll period not found" }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        sent: result.sentCount ?? result.updatedCount,
        failed: result.failedCount ?? 0
      }
    });
  } catch (error) {
    logApiError("Error sending payroll payslips", error);
    const message = error instanceof Error ? error.message : "Failed to send payroll payslips";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
