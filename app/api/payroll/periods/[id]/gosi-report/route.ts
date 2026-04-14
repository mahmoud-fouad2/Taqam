import { NextRequest, NextResponse } from "next/server";

import { logApiError, requireRole } from "@/lib/api/route-helper";
import { buildGosiReportExport } from "@/lib/payroll/compliance-exports";
import { listPayslipsForPeriod } from "@/lib/payroll/payslips";
import { PAYROLL_ALLOWED_ROLES } from "@/lib/payroll/constants";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireRole(_request, PAYROLL_ALLOWED_ROLES);
    if (!auth.ok) return auth.response;
    const { tenantId } = auth;
    const { id } = await params;

    const result = await listPayslipsForPeriod(tenantId, id);
    if (!result.period) {
      return NextResponse.json({ error: "Payroll period not found" }, { status: 404 });
    }

    const exported = buildGosiReportExport({
      period: result.period,
      payslips: result.payslips
    });

    return new NextResponse(`\ufeff${exported.csv}`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${exported.fileName}"`
      }
    });
  } catch (error) {
    logApiError("Error generating GOSI report", error);
    return NextResponse.json({ error: "Failed to generate GOSI report" }, { status: 500 });
  }
}
