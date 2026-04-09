import { NextRequest, NextResponse } from "next/server";
import { requireMobileEmployeeAuthWithDevice } from "@/lib/mobile/auth";
import { listPayslipsForEmployee } from "@/lib/payroll/payslips";

/**
 * GET /api/mobile/payslips
 * List payslips for the authenticated employee.
 * Query params: ?year=2025&status=SENT
 */
export async function GET(request: NextRequest) {
  const payloadOrRes = await requireMobileEmployeeAuthWithDevice(request);
  if (payloadOrRes instanceof NextResponse) return payloadOrRes;

  const { tenantId, employeeId } = payloadOrRes;

  try {
    const { searchParams } = request.nextUrl;
    const yearParam = searchParams.get("year");
    const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();
    const status = searchParams.get("status") ?? undefined;

    const payslips = await listPayslipsForEmployee(tenantId, employeeId, {
      year: isNaN(year) ? undefined : year,
      status,
    });

    // Return a mobile-friendly projection
    return NextResponse.json({
      data: payslips.map((p) => ({
        id: p.id,
        periodName: p.periodNameAr || p.periodName,
        periodStart: p.periodStartDate,
        periodEnd: p.periodEndDate,
        paymentDate: p.paymentDate,
        basicSalary: p.basicSalary,
        totalEarnings: p.totalEarnings,
        totalDeductions: p.totalDeductions,
        netSalary: p.netSalary,
        currency: p.currency,
        status: p.status,
        workingDays: p.workingDays,
        actualWorkDays: p.actualWorkDays,
      })),
    });
  } catch (error) {
    console.error("Mobile payslips GET error:", error);
    return NextResponse.json(
      { error: "Failed to load payslips" },
      { status: 500 }
    );
  }
}
