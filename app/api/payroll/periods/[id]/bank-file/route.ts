import { NextRequest, NextResponse } from "next/server";

import { requireTenantSession } from "@/lib/api/route-helper";
import { buildCsv, sanitizeFilename } from "@/lib/payroll/export";
import { listPayslipsForPeriod } from "@/lib/payroll/payslips";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireTenantSession(request);
    if (!auth.ok) return auth.response;
    const { tenantId } = auth;
    const { id } = await params;

    const url = new URL(request.url);
    const format = (url.searchParams.get("format") || "csv").toLowerCase();
    const result = await listPayslipsForPeriod(tenantId, id);
    if (!result.period) {
      return NextResponse.json({ error: "Payroll period not found" }, { status: 404 });
    }

    const csv = buildCsv(
      ["format", "employeeNumber", "employeeName", "bankName", "accountNumber", "paymentMethod", "netSalary"],
      result.payslips.map((payslip) => [
        format,
        payslip.employeeNumber,
        payslip.employeeName,
        payslip.bankName || "",
        payslip.accountNumber || "",
        payslip.paymentMethod,
        payslip.netSalary,
      ])
    );

    return new NextResponse(`\ufeff${csv}`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${sanitizeFilename(`bank-file-${result.period.name || result.period.id}-${format}`)}.csv"`,
      },
    });
  } catch (error) {
    console.error("Error generating bank file:", error);
    return NextResponse.json({ error: "Failed to generate bank file" }, { status: 500 });
  }
}