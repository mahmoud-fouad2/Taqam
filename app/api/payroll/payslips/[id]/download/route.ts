import { NextRequest, NextResponse } from "next/server";

import { requireTenantSession } from "@/lib/api/route-helper";
import { getPayslipById } from "@/lib/payroll/payslips";
import { buildPayslipHtmlDocument, escapeHtml, sanitizeFilename } from "@/lib/payroll/export";
import { buildPayslipPdfBytes } from "@/lib/payroll/payslip-pdf.server";
import { formatCurrency } from "@/lib/types/payroll";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireTenantSession(request);
    if (!auth.ok) return auth.response;
    const { tenantId } = auth;
    const { id } = await params;

    const payslip = await getPayslipById(tenantId, id);
    if (!payslip) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const url = new URL(request.url);
    const format = (url.searchParams.get("format") || "").toLowerCase();
    const accept = (request.headers.get("accept") || "").toLowerCase();

    const wantsHtml =
      format === "html" ||
      (format !== "pdf" && accept.includes("text/html") && !accept.includes("application/pdf"));

    const baseFilename = sanitizeFilename(
      `payslip-${payslip.employeeNumber}-${payslip.periodName || payslip.periodStartDate || payslip.id}`
    );

    if (!wantsHtml) {
      const pdfBytes = await buildPayslipPdfBytes({ payslip });

      return new NextResponse(Buffer.from(pdfBytes), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${baseFilename}.pdf"`
        }
      });
    }

    const earningsRows = payslip.earnings
      .map(
        (earning) =>
          `<tr><td>${escapeHtml(earning.nameAr || earning.name)}</td><td>${escapeHtml(formatCurrency(earning.amount))}</td></tr>`
      )
      .join("");
    const deductionsRows = payslip.deductions
      .map(
        (deduction) =>
          `<tr><td>${escapeHtml(deduction.nameAr || deduction.name)}</td><td>${escapeHtml(formatCurrency(deduction.amount))}</td></tr>`
      )
      .join("");

    const title = `قسيمة راتب ${payslip.employeeNameAr}`;
    const periodLabel =
      payslip.periodNameAr || payslip.periodName || payslip.periodStartDate || "فترة غير محددة";
    const html = buildPayslipHtmlDocument({
      title,
      employeeName: payslip.employeeNameAr,
      employeeNumber: payslip.employeeNumber,
      department: payslip.departmentAr,
      jobTitle: payslip.jobTitleAr,
      periodLabel,
      paymentDate: payslip.paymentDate,
      earningsRows,
      deductionsRows,
      totalEarnings: formatCurrency(payslip.totalEarnings),
      totalDeductions: formatCurrency(payslip.totalDeductions),
      netSalary: formatCurrency(payslip.netSalary)
    });

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename="${baseFilename}.html"`
      }
    });
  } catch (error) {
    console.error("Error downloading payslip:", error);
    return NextResponse.json({ error: "Failed to download payslip" }, { status: 500 });
  }
}
