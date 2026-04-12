import { NextRequest, NextResponse } from "next/server";

import { logApiError, requireRole } from "@/lib/api/route-helper";
import { buildCsv, sanitizeFilename } from "@/lib/payroll/export";
import { listPayslipsForPeriod } from "@/lib/payroll/payslips";
import { PAYROLL_ALLOWED_ROLES } from "@/lib/payroll/constants";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireRole(request, PAYROLL_ALLOWED_ROLES);
    if (!auth.ok) return auth.response;
    const { tenantId } = auth;
    const { id } = await params;

    const url = new URL(request.url);
    const formatParam = (url.searchParams.get("format") || "csv").toLowerCase();
    const format =
      formatParam === "wps" || formatParam === "sarie" || formatParam === "csv"
        ? formatParam
        : "csv";
    const result = await listPayslipsForPeriod(tenantId, id);
    if (!result.period) {
      return NextResponse.json({ error: "Payroll period not found" }, { status: 404 });
    }

    const paymentDate = result.period.paymentDate
      ? (result.period.paymentDate.toISOString().split("T")[0] ?? "")
      : "";

    const missingAccount = result.payslips.filter(
      (p) => p.paymentMethod === "bank_transfer" && !(p.accountNumber || "").trim()
    );

    if (missingAccount.length > 0) {
      return NextResponse.json(
        {
          error: "Missing bank account numbers for some employees",
          details: {
            employeeNumbers: missingAccount.map((p) => p.employeeNumber)
          }
        },
        { status: 400 }
      );
    }

    const csv =
      format === "wps"
        ? buildCsv(
            ["employeeNumber", "employeeName", "accountNumber", "netSalary", "paymentDate"],
            result.payslips.map((payslip) => [
              payslip.employeeNumber,
              payslip.employeeName,
              payslip.accountNumber || "",
              payslip.netSalary,
              paymentDate
            ])
          )
        : format === "sarie"
          ? buildCsv(
              [
                "beneficiaryName",
                "beneficiaryAccount",
                "amount",
                "currency",
                "paymentDate",
                "reference"
              ],
              result.payslips.map((payslip) => [
                payslip.employeeName,
                payslip.accountNumber || "",
                payslip.netSalary,
                payslip.currency,
                paymentDate,
                result.period.name || result.period.id
              ])
            )
          : buildCsv(
              [
                "employeeNumber",
                "employeeName",
                "bankName",
                "accountNumber",
                "paymentMethod",
                "netSalary",
                "currency",
                "paymentDate"
              ],
              result.payslips.map((payslip) => [
                payslip.employeeNumber,
                payslip.employeeName,
                payslip.bankName || "",
                payslip.accountNumber || "",
                payslip.paymentMethod,
                payslip.netSalary,
                payslip.currency,
                paymentDate
              ])
            );

    return new NextResponse(`\ufeff${csv}`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${sanitizeFilename(`bank-file-${result.period.name || result.period.id}-${format}`)}.csv"`
      }
    });
  } catch (error) {
    logApiError("Error generating bank file", error);
    return NextResponse.json({ error: "Failed to generate bank file" }, { status: 500 });
  }
}
