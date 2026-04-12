import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

import * as fontkit from "@pdf-lib/fontkit";
import { ArabicShaper } from "arabic-persian-reshaper";
import { PDFDocument, PageSizes, rgb } from "pdf-lib";

import type { Payslip } from "@/lib/types/payroll";

const FONT_REGULAR_PATH = path.join(
  process.cwd(),
  "app",
  "fonts",
  "ibm-plex-sans-arabic",
  "ibm-plex-sans-arabic-arabic-400-normal.woff2"
);
const FONT_BOLD_PATH = path.join(
  process.cwd(),
  "app",
  "fonts",
  "ibm-plex-sans-arabic",
  "ibm-plex-sans-arabic-arabic-600-normal.woff2"
);
const ARABIC_CHAR_REGEX = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

let cachedFontBytesPromise: Promise<{ regular: Uint8Array; bold: Uint8Array }> | null = null;

function loadPdfFontBytes() {
  if (!cachedFontBytesPromise) {
    cachedFontBytesPromise = Promise.all([
      readFile(FONT_REGULAR_PATH),
      readFile(FONT_BOLD_PATH)
    ]).then(([regular, bold]) => ({ regular, bold }));
  }

  return cachedFontBytesPromise;
}

function safeText(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

function normalizeText(value: unknown, fallback = ""): string {
  const normalized = safeText(value).replace(/\s+/g, " ").trim();
  return normalized || fallback;
}

function formatPdfText(value: unknown, fallback = "-"): string {
  const normalized = normalizeText(value, fallback);

  if (!ARABIC_CHAR_REGEX.test(normalized)) {
    return normalized;
  }

  const shaped = ArabicShaper.convertArabic(normalized);
  return [...shaped].reverse().join("");
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
  pdfDoc.registerFontkit(fontkit);

  const fontBytes = await loadPdfFontBytes();

  let page = pdfDoc.addPage(PageSizes.A4);
  let { width, height } = page.getSize();

  const font = await pdfDoc.embedFont(fontBytes.regular);
  const fontBold = await pdfDoc.embedFont(fontBytes.bold);

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

  const drawAlignedText = (
    text: string,
    opts?: {
      align?: "left" | "right";
      bold?: boolean;
      size?: number;
      color?: { r: number; g: number; b: number };
      boxX?: number;
      boxWidth?: number;
    }
  ) => {
    const size = opts?.size ?? fontSize;
    const fontToUse = opts?.bold ? fontBold : font;
    const color = opts?.color ?? { r: 0.11, g: 0.14, b: 0.2 };
    const boxX = opts?.boxX ?? marginX;
    const boxWidth = opts?.boxWidth ?? width - marginX * 2;
    const textWidth = fontToUse.widthOfTextAtSize(text, size);
    const x = opts?.align === "right" ? boxX + boxWidth - textWidth : boxX;

    page.drawText(text, {
      x,
      y,
      size,
      font: fontToUse,
      color: rgb(color.r, color.g, color.b)
    });
  };

  const drawTextLine = (
    text: string,
    opts?: {
      align?: "left" | "right";
      bold?: boolean;
      size?: number;
      color?: { r: number; g: number; b: number };
    }
  ) => {
    ensureSpace(lineGap);

    drawAlignedText(text, opts);

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

    drawAlignedText(formatPdfText(title), {
      align: "right",
      bold: true,
      size: 13,
      color: { r: 0.11, g: 0.14, b: 0.2 }
    });

    y -= 18;
  };

  const drawKeyValue = (label: string, value: string) => {
    const labelText = formatPdfText(label);
    const valueText = formatPdfText(value, "-");

    ensureSpace(lineGap * 2 + 4);

    drawAlignedText(labelText, {
      align: "right",
      bold: true
    });

    y -= lineGap;

    drawAlignedText(valueText, {
      align: "right",
      color: { r: 0.28, g: 0.33, b: 0.4 }
    });

    y -= lineGap + 4;
  };

  const drawAmountRow = (label: string, amountText: string, opts?: { bold?: boolean }) => {
    ensureSpace(lineGap);

    drawAlignedText(formatPdfText(label), {
      align: "right",
      bold: opts?.bold
    });

    drawAlignedText(amountText, {
      align: "left",
      bold: opts?.bold
    });

    y -= lineGap;
  };

  // Header
  drawTextLine(formatPdfText("قسيمة راتب"), { align: "right", bold: true, size: 18 });

  const periodLabel =
    payslip.periodNameAr ||
    payslip.periodName ||
    payslip.periodStartDate ||
    payslip.payrollPeriodId;

  drawTextLine(formatPdfText(`الفترة ${normalizeText(periodLabel, "-")}`), {
    align: "right",
    size: 11,
    color: { r: 0.42, g: 0.45, b: 0.51 }
  });

  y -= 6;

  // Employee info
  drawKeyValue(
    "الموظف",
    normalizeText(payslip.employeeNameAr || payslip.employeeName, payslip.employeeNumber)
  );
  drawKeyValue("الرقم الوظيفي", normalizeText(payslip.employeeNumber, "-"));
  drawKeyValue("القسم", normalizeText(payslip.departmentAr || payslip.department, "-"));
  drawKeyValue("المسمى الوظيفي", normalizeText(payslip.jobTitleAr || payslip.jobTitle, "-"));

  if (payslip.paymentDate) {
    drawKeyValue("تاريخ الصرف", normalizeText(payslip.paymentDate, "-"));
  }

  if (payslip.paymentMethod) {
    drawKeyValue("طريقة الدفع", normalizeText(payslip.paymentMethod, "-"));
  }

  if (payslip.bankName) {
    drawKeyValue("البنك", normalizeText(payslip.bankName, "-"));
  }

  if (payslip.accountNumber) {
    drawKeyValue("الحساب", normalizeText(payslip.accountNumber, "-"));
  }

  // Earnings
  drawSectionHeader("الاستحقاقات");

  for (const earning of payslip.earnings) {
    const label = getLineLabel(
      normalizeText(earning.nameAr || earning.name || ""),
      normalizeText(earning.type || "", "استحقاق")
    );
    const amountText = formatMoney(Number(earning.amount ?? 0), payslip.currency);
    drawAmountRow(label, amountText);
  }

  drawAmountRow("إجمالي الاستحقاقات", formatMoney(payslip.totalEarnings, payslip.currency), {
    bold: true
  });

  // Deductions
  drawSectionHeader("الاستقطاعات");

  if (payslip.deductions.length === 0) {
    drawTextLine(formatPdfText("لا توجد استقطاعات"), {
      align: "right",
      color: { r: 0.42, g: 0.45, b: 0.51 }
    });
  } else {
    for (const deduction of payslip.deductions) {
      const label = getLineLabel(
        normalizeText(deduction.nameAr || deduction.name || ""),
        normalizeText(deduction.type || "", "استقطاع")
      );
      const amountText = formatMoney(Number(deduction.amount ?? 0), payslip.currency);
      drawAmountRow(label, amountText);
    }
  }

  drawAmountRow("إجمالي الاستقطاعات", formatMoney(payslip.totalDeductions, payslip.currency), {
    bold: true
  });

  // Net
  drawSectionHeader("الملخص");

  drawAmountRow("صافي الراتب", formatMoney(payslip.netSalary, payslip.currency), { bold: true });

  return await pdfDoc.save();
}
