import { NextRequest, NextResponse } from "next/server";

import { requireTenantSession } from "@/lib/api/route-helper";
import { buildCsv, sanitizeFilename } from "@/lib/payroll/export";
import { listPayslipsForPeriod } from "@/lib/payroll/payslips";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireTenantSession(_request);
    if (!auth.ok) return auth.response;
    const { tenantId } = auth;
    const { id } = await params;

    const result = await listPayslipsForPeriod(tenantId, id);
    if (!result.period) {
      return NextResponse.json({ error: "Payroll period not found" }, { status: 404 });
    }

    const csv = buildCsv(
      [
        "employeeNumber",
        "employeeName",
        "department",
        "basicSalary",
        "gosiEmployee",
        "gosiEmployer",
        "totalGosi"
      ],
      result.payslips.map((payslip) => [
        payslip.employeeNumber,
        payslip.employeeName,
        payslip.department,
        payslip.basicSalary,
        payslip.gosiEmployee,
        payslip.gosiEmployer,
        payslip.gosiEmployee + payslip.gosiEmployer
      ])
    );

    return new NextResponse(`\ufeff${csv}`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${sanitizeFilename(`gosi-report-${result.period.name || result.period.id}`)}.csv"`
      }
    });
  } catch (error) {
    console.error("Error generating GOSI report:", error);
    return NextResponse.json({ error: "Failed to generate GOSI report" }, { status: 500 });
  }
}
