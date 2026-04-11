import { NextRequest, NextResponse } from "next/server";

import { requireRole } from "@/lib/api/route-helper";
import { ensurePayslipsForPeriod, summarizePayrollPeriod } from "@/lib/payroll/payslips";
import {
  canTransitionPayrollPeriodStatus,
  getPayrollPeriodById,
  getPayrollPeriodStatusTransitionError,
  mapPayrollPeriod
} from "@/lib/payroll/periods";
import prisma from "@/lib/db";

const PAYROLL_ALLOWED_ROLES = ["TENANT_ADMIN", "HR_MANAGER"];

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireRole(_request, PAYROLL_ALLOWED_ROLES);
    if (!auth.ok) return auth.response;
    const { tenantId, session } = auth;

    const { id } = await params;
    const existing = await getPayrollPeriodById(tenantId, id);
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (!canTransitionPayrollPeriodStatus(existing.status, "PENDING_APPROVAL")) {
      return NextResponse.json(
        { error: getPayrollPeriodStatusTransitionError(existing.status, "PENDING_APPROVAL") },
        { status: 400 }
      );
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
        processedAt: new Date()
      }
    });

    return NextResponse.json({ data: mapPayrollPeriod(updated) });
  } catch (error) {
    console.error("Error submitting payroll period:", error);
    return NextResponse.json({ error: "Failed to submit payroll period" }, { status: 500 });
  }
}
