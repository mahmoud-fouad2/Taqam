import { NextRequest, NextResponse } from "next/server";

import { requireTenantSession } from "@/lib/api/route-helper";
import { sendPayslipsForPeriod } from "@/lib/payroll/payslips";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireTenantSession(_request);
    if (!auth.ok) return auth.response;
    const { tenantId } = auth;
    const { id } = await params;

    const result = await sendPayslipsForPeriod(tenantId, id);
    if (!result) {
      return NextResponse.json({ error: "Payroll period not found" }, { status: 404 });
    }

    return NextResponse.json({ data: { sent: result.updatedCount, failed: 0 } });
  } catch (error) {
    console.error("Error sending payroll payslips:", error);
    return NextResponse.json({ error: "Failed to send payroll payslips" }, { status: 500 });
  }
}