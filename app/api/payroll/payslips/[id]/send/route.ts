/**
 * Payroll Payslip send API
 * POST /api/payroll/payslips/:id/send
 */

import { NextRequest, NextResponse } from "next/server";
import { requireTenantSession } from "@/lib/api/route-helper";
import { sendSinglePayslip } from "@/lib/payroll/payslips";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireTenantSession(_request);
    if (!auth.ok) return auth.response;
    const { tenantId } = auth;

    const { id } = await params;

    const updated = await sendSinglePayslip(tenantId, id);
    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ data: { id: updated.id } });
  } catch (error) {
    console.error("Error sending payslip:", error);
    return NextResponse.json({ error: "Failed to send payslip" }, { status: 500 });
  }
}
