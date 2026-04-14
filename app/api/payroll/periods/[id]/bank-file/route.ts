import { NextRequest, NextResponse } from "next/server";

import { logApiError, requireRole } from "@/lib/api/route-helper";
import {
  buildBankFileExport,
  getBankFileMissingAccountNumbers,
  resolveBankFileFormat
} from "@/lib/payroll/compliance-exports";
import { listPayslipsForPeriod } from "@/lib/payroll/payslips";
import { PAYROLL_ALLOWED_ROLES } from "@/lib/payroll/constants";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireRole(request, PAYROLL_ALLOWED_ROLES);
    if (!auth.ok) return auth.response;
    const { tenantId } = auth;
    const { id } = await params;

    const url = new URL(request.url);
    const format = resolveBankFileFormat(url.searchParams.get("format"));
    const result = await listPayslipsForPeriod(tenantId, id);
    if (!result.period) {
      return NextResponse.json({ error: "Payroll period not found" }, { status: 404 });
    }

    const missingAccount = getBankFileMissingAccountNumbers(result.payslips);

    if (missingAccount.length > 0) {
      return NextResponse.json(
        {
          error: "Missing bank account numbers for some employees",
          details: {
            employeeNumbers: missingAccount
          }
        },
        { status: 400 }
      );
    }

    const exported = buildBankFileExport({
      period: result.period,
      payslips: result.payslips,
      format
    });

    return new NextResponse(`\ufeff${exported.csv}`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${exported.fileName}"`
      }
    });
  } catch (error) {
    logApiError("Error generating bank file", error);
    return NextResponse.json({ error: "Failed to generate bank file" }, { status: 500 });
  }
}
