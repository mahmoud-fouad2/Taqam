import { NextRequest, NextResponse } from "next/server";

import { requireTenantSession } from "@/lib/api/route-helper";
import { getPayslipById, updatePayslipAdjustments } from "@/lib/payroll/payslips";
import type { PayslipDeduction, PayslipEarning } from "@/lib/types/payroll";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireTenantSession(_request);
    if (!auth.ok) return auth.response;
    const { tenantId } = auth;
    const { id } = await params;

    const payslip = await getPayslipById(tenantId, id);
    if (!payslip) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ data: payslip });
  } catch (error) {
    console.error("Error fetching payslip:", error);
    return NextResponse.json({ error: "Failed to fetch payslip" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireTenantSession(request);
    if (!auth.ok) return auth.response;
    const { tenantId } = auth;
    const { id } = await params;

    const body = (await request.json().catch(() => null)) as {
      earnings?: PayslipEarning[];
      deductions?: PayslipDeduction[];
    } | null;

    const updated = await updatePayslipAdjustments({
      tenantId,
      payslipId: id,
      earnings: body?.earnings,
      deductions: body?.deductions
    });

    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("Error updating payslip:", error);
    return NextResponse.json({ error: "Failed to update payslip" }, { status: 500 });
  }
}
