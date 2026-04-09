import { NextRequest, NextResponse } from "next/server";
import { requireMobileEmployeeAuthWithDevice } from "@/lib/mobile/auth";
import prisma from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/mobile/payslips/[id]
 * Full payslip details for the authenticated employee.
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const payloadOrRes = await requireMobileEmployeeAuthWithDevice(request);
  if (payloadOrRes instanceof NextResponse) return payloadOrRes;

  const { tenantId, employeeId } = payloadOrRes;
  const { id } = await context.params;

  try {
    const payslip = await prisma.payrollPayslip.findFirst({
      where: { id, tenantId, employeeId },
      include: {
        payrollPeriod: {
          select: {
            name: true,
            nameAr: true,
            startDate: true,
            endDate: true,
            paymentDate: true,
          },
        },
      },
    });

    if (!payslip) {
      return NextResponse.json({ error: "Payslip not found" }, { status: 404 });
    }

    // Mark as viewed
    if (!payslip.viewedAt) {
      await prisma.payrollPayslip.update({
        where: { id },
        data: { viewedAt: new Date(), status: "VIEWED" },
      }).catch(() => {});
    }

    return NextResponse.json({
      data: {
        id: payslip.id,
        periodName: payslip.payrollPeriod.nameAr || payslip.payrollPeriod.name,
        periodStart: payslip.payrollPeriod.startDate.toISOString().slice(0, 10),
        periodEnd: payslip.payrollPeriod.endDate.toISOString().slice(0, 10),
        paymentDate: payslip.payrollPeriod.paymentDate.toISOString().slice(0, 10),
        currency: payslip.currency,
        paymentMethod: payslip.paymentMethod,
        bankName: payslip.bankName,
        basicSalary: Number(payslip.basicSalary),
        earnings: payslip.earnings as any[],
        totalEarnings: Number(payslip.totalEarnings),
        deductions: payslip.deductions as any[],
        totalDeductions: Number(payslip.totalDeductions),
        netSalary: Number(payslip.netSalary),
        workingDays: payslip.workingDays,
        actualWorkDays: payslip.actualWorkDays,
        absentDays: payslip.absentDays,
        lateDays: payslip.lateDays,
        overtimeHours: payslip.overtimeHours,
        gosiEmployee: payslip.gosiEmployee,
        gosiEmployer: payslip.gosiEmployer,
        status: payslip.status,
      },
    });
  } catch (error) {
    console.error("Mobile payslip detail error:", error);
    return NextResponse.json({ error: "Failed to load payslip" }, { status: 500 });
  }
}
