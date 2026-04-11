import { NextRequest, NextResponse } from "next/server";

import { requireTenantSession } from "@/lib/api/route-helper";
import { ensurePayslipsForPeriod, summarizePayrollPeriod } from "@/lib/payroll/payslips";
import { getPayrollPeriodById, mapPayrollPeriod } from "@/lib/payroll/periods";
import prisma from "@/lib/db";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireTenantSession(_request);
    if (!auth.ok) return auth.response;
    const { tenantId, session } = auth;

    const { id } = await params;
    const existing = await getPayrollPeriodById(tenantId, id);
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await ensurePayslipsForPeriod(tenantId, id);
    const summary = await summarizePayrollPeriod(tenantId, id);

    const updated = await prisma.payrollPeriod.update({
      where: { id },
      data: {
        status: "PENDING_APPROVAL",
        employeeCount: summary.employeeCount,
        totalGross: summary.totalGross,
        totalDeductions: summary.totalDeductions,
        totalNet: summary.totalNet,
        processedById: session.user.id,
        processedAt: existing.processedAt ?? new Date()
      }
    });

    return NextResponse.json({ data: mapPayrollPeriod(updated) });
  } catch (error) {
    console.error("Error submitting payroll period:", error);
    return NextResponse.json({ error: "Failed to submit payroll period" }, { status: 500 });
  }
}
