import "server-only";

import { PDFDocument, PageSizes, StandardFonts, rgb } from "pdf-lib";

import type { Payslip } from "@/lib/types/payroll";

function safeText(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

function toPdfSafeText(value: unknown, fallback = ""): string {
  const raw = safeText(value);
  const ascii = raw
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return ascii || fallback;
}

function formatMoney(amount: number, currency: string): string {
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number.isFinite(amount) ? amount : 0);

  return `${currency} ${formatted}`;
}

function getLineLabel(value: string, fallback: string): string {
  const trimmed = value.trim();
  return trimmed ? trimmed : fallback;
}

export async function buildPayslipPdfBytes(input: { payslip: Payslip }): Promise<Uint8Array> {
  const payslip = input.payslip;

  const pdfDoc = await PDFDocument.create();

  let page = pdfDoc.addPage(PageSizes.A4);
  let { width, height } = page.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const marginX = 50;
  const marginY = 56;
  const fontSize = 11;
  const lineGap = 16;

  let y = height - marginY;

  const addPage = () => {
    page = pdfDoc.addPage(PageSizes.A4);
    ({ width, height } = page.getSize());
    y = height - marginY;
  };

  const ensureSpace = (minHeight: number) => {
    if (y - minHeight < marginY) {
      addPage();
    }
  };

  const drawTextLine = (
    text: string,
    opts?: { bold?: boolean; size?: number; color?: { r: number; g: number; b: number } }
  ) => {
    ensureSpace(lineGap);

    const size = opts?.size ?? fontSize;
    const fontToUse = opts?.bold ? fontBold : font;
    const color = opts?.color ?? { r: 0.11, g: 0.14, b: 0.2 };

    page.drawText(text, {
      x: marginX,
      y,
      size,
      font: fontToUse,
      color: rgb(color.r, color.g, color.b)
    });

    y -= lineGap;
  };

  const drawSectionHeader = (title: string) => {
    ensureSpace(28);

    y -= 6;
    page.drawLine({
      start: { x: marginX, y },
      end: { x: width - marginX, y },
      thickness: 1,
      color: rgb(0.89, 0.9, 0.92)
    });
    y -= 16;

    page.drawText(title, {
      x: marginX,
      y,
      size: 13,
      font: fontBold,
      color: rgb(0.11, 0.14, 0.2)
    });

    y -= 18;
  };

  const drawKeyValue = (label: string, value: string) => {
    const labelText = `${label}: `;
    const valueText = toPdfSafeText(value, "-");

    ensureSpace(lineGap);

    page.drawText(labelText, {
      x: marginX,
      y,
      size: fontSize,
      font: fontBold,
      color: rgb(0.11, 0.14, 0.2)
    });

    const labelWidth = fontBold.widthOfTextAtSize(labelText, fontSize);
    page.drawText(valueText, {
      x: marginX + labelWidth,
      y,
      size: fontSize,
      font,
      color: rgb(0.11, 0.14, 0.2)
    });

    y -= lineGap;
  };

  const drawAmountRow = (label: string, amountText: string, opts?: { bold?: boolean }) => {
    ensureSpace(lineGap);

    const leftFont = opts?.bold ? fontBold : font;
    const rightFont = opts?.bold ? fontBold : font;

    page.drawText(label, {
      x: marginX,
      y,
      size: fontSize,
      font: leftFont,
      color: rgb(0.11, 0.14, 0.2)
    });

    const amountWidth = rightFont.widthOfTextAtSize(amountText, fontSize);
    const amountX = width - marginX - amountWidth;

    page.drawText(amountText, {
      x: amountX,
      y,
      size: fontSize,
      font: rightFont,
      color: rgb(0.11, 0.14, 0.2)
    });

    y -= lineGap;
  };

  // Header
  drawTextLine("Payslip", { bold: true, size: 18 });

  const periodLabel = payslip.periodName || payslip.periodStartDate || payslip.payrollPeriodId;

  drawTextLine(`Period: ${toPdfSafeText(periodLabel, "-")}`, {
    size: 11,
    color: { r: 0.42, g: 0.45, b: 0.51 }
  });

  y -= 6;

  // Employee info
  drawKeyValue("Employee", toPdfSafeText(payslip.employeeName, payslip.employeeNumber));
  drawKeyValue("Employee No", toPdfSafeText(payslip.employeeNumber, "-"));
  drawKeyValue("Department", toPdfSafeText(payslip.department, "-"));
  drawKeyValue("Job Title", toPdfSafeText(payslip.jobTitle, "-"));

  if (payslip.paymentDate) {
    drawKeyValue("Payment Date", toPdfSafeText(payslip.paymentDate, "-"));
  }

  if (payslip.paymentMethod) {
    drawKeyValue("Payment Method", toPdfSafeText(payslip.paymentMethod, "-"));
  }

  if (payslip.bankName) {
    drawKeyValue("Bank", toPdfSafeText(payslip.bankName, "-"));
  }

  if (payslip.accountNumber) {
    drawKeyValue("Account", toPdfSafeText(payslip.accountNumber, "-"));
  }

  // Earnings
  drawSectionHeader("Earnings");

  for (const earning of payslip.earnings) {
    const label = getLineLabel(
      toPdfSafeText(earning.name || ""),
      toPdfSafeText(earning.type || "", "Earning")
    );
    const amountText = formatMoney(Number(earning.amount ?? 0), payslip.currency);
    drawAmountRow(label, amountText);
  }

  drawAmountRow("Total Earnings", formatMoney(payslip.totalEarnings, payslip.currency), {
    bold: true
  });

  // Deductions
  drawSectionHeader("Deductions");

  if (payslip.deductions.length === 0) {
    drawTextLine("No deductions.", { color: { r: 0.42, g: 0.45, b: 0.51 } });
  } else {
    for (const deduction of payslip.deductions) {
      const label = getLineLabel(
        toPdfSafeText(deduction.name || ""),
        toPdfSafeText(deduction.type || "", "Deduction")
      );
      const amountText = formatMoney(Number(deduction.amount ?? 0), payslip.currency);
      drawAmountRow(label, amountText);
    }
  }

  drawAmountRow("Total Deductions", formatMoney(payslip.totalDeductions, payslip.currency), {
    bold: true
  });

  // Net
  drawSectionHeader("Summary");

  drawAmountRow("Net Salary", formatMoney(payslip.netSalary, payslip.currency), { bold: true });

  return await pdfDoc.save();
}
