import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

import * as fontkit from "@pdf-lib/fontkit";
import { ArabicShaper } from "arabic-persian-reshaper";
import { PDFDocument, PageSizes, rgb } from "pdf-lib";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type LetterType = "introductory" | "salary" | "experience";

export interface LetterInput {
  type: LetterType;
  /** Arabic (preferred) or English employee full name */
  employeeName: string;
  /** Arabic job title */
  jobTitle: string;
  /** Arabic department name */
  department?: string;
  /** ISO date string */
  hireDate: string;
  /** ISO date string or null for current employees */
  endDate?: string | null;
  nationalId?: string;
  /** Monthly gross salary */
  salary?: number;
  currency?: string;
  /** Arabic company name */
  companyName: string;
  /** Company address or city */
  companyAddress?: string;
}

// ─────────────────────────────────────────────
// Asset loading (cached)
// ─────────────────────────────────────────────

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
const LOGO_PATH = path.join(process.cwd(), "public", "logo-light.png");

let cachedAssetsPromise: Promise<{
  regular: Uint8Array;
  bold: Uint8Array;
  logo: Uint8Array | null;
}> | null = null;

function loadAssets() {
  if (!cachedAssetsPromise) {
    cachedAssetsPromise = Promise.all([
      readFile(FONT_REGULAR_PATH),
      readFile(FONT_BOLD_PATH),
      readFile(LOGO_PATH).catch(() => null),
    ]).then(([regular, bold, logo]) => ({ regular, bold, logo }));
  }
  return cachedAssetsPromise;
}

// ─────────────────────────────────────────────
// Text helpers
// ─────────────────────────────────────────────

const ARABIC_CHAR_REGEX = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

function shapeAr(text: string): string {
  if (!ARABIC_CHAR_REGEX.test(text)) return text;
  const shaped = ArabicShaper.convertArabic(text);
  return [...shaped].reverse().join("");
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function formatMoney(amount: number, currency = "SAR"): string {
  const n = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
  return `${currency} ${n}`;
}

// ─────────────────────────────────────────────
// Letter body builders
// ─────────────────────────────────────────────

function buildIntroBody(input: LetterInput): string[] {
  const lines: string[] = [];
  const idPart = input.nationalId ? `حامل الهوية/الإقامة برقم (${input.nationalId})، ` : "";
  lines.push(
    `يُشهد بأن السيد/السيدة ${input.employeeName} ${idPart}يعمل/تعمل لدى ${input.companyName}`,
    `بوظيفة ${input.jobTitle}${input.department ? ` في قسم ${input.department}` : ""}،`,
    `وذلك منذ تاريخ ${formatDate(input.hireDate)} وهو/هي لا يزال/تزال على رأس عمله/ها حتى الآن.`,
    "",
    "وقد أُصدرت هذه الشهادة بناءً على طلبه/ها وهي تفيد بما ذُكر أعلاه ولا تُعدّ التزاماً بأي شيء.",
    "نتمنى له/ها التوفيق والنجاح."
  );
  return lines;
}

function buildSalaryBody(input: LetterInput): string[] {
  const lines = buildIntroBody(input);
  // Insert salary line after the second line (before the blank line)
  const blankIdx = lines.findIndex((l) => l === "");
  const salaryLine = `ويتقاضى/تتقاضى راتباً شهرياً إجمالياً يبلغ ${formatMoney(input.salary ?? 0, input.currency)}.`;
  lines.splice(blankIdx, 0, salaryLine);
  return lines;
}

function buildExperienceBody(input: LetterInput): string[] {
  const toDate = input.endDate ? formatDate(input.endDate) : "تاريخه";
  return [
    `نشهد بأن السيد/السيدة ${input.employeeName} عمل/ت لدى ${input.companyName}`,
    `بوظيفة ${input.jobTitle}${input.department ? ` في قسم ${input.department}` : ""}،`,
    `وذلك من تاريخ ${formatDate(input.hireDate)} حتى ${toDate}.`,
    "",
    "وقد أدّى/أدّت عمله/ها بكفاءة وأمانة، ونشهد له/ها بحسن السيرة والسلوك.",
    "نتمنى له/ها التوفيق والنجاح في مسيرته/ها المهنية."
  ];
}

function getLetterTitle(type: LetterType): string {
  switch (type) {
    case "introductory": return "خطاب تعريف";
    case "salary":       return "خطاب راتب";
    case "experience":   return "شهادة خبرة";
  }
}

// ─────────────────────────────────────────────
// Main builder
// ─────────────────────────────────────────────

export async function buildLetterPdfBytes(input: LetterInput): Promise<Uint8Array> {
  const assets = await loadAssets();

  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const page = pdfDoc.addPage(PageSizes.A4);
  const { width, height } = page.getSize();

  const font     = await pdfDoc.embedFont(assets.regular);
  const fontBold = await pdfDoc.embedFont(assets.bold);
  const logoImg  = assets.logo ? await pdfDoc.embedPng(assets.logo) : null;

  const marginX = 60;
  const marginY = 56;
  const contentW = width - marginX * 2;
  let y = height - marginY;

  // ── Helpers ──────────────────────────────────
  const drawLine = (
    rawText: string,
    opts: {
      bold?: boolean;
      size?: number;
      align?: "right" | "center" | "left";
      color?: { r: number; g: number; b: number };
      gap?: number;
    } = {}
  ) => {
    const size = opts.size ?? 11;
    const f = opts.bold ? fontBold : font;
    const color = opts.color ?? { r: 0.1, g: 0.12, b: 0.18 };
    const text = shapeAr(rawText);
    const tw = f.widthOfTextAtSize(text, size);
    let x: number;
    if (opts.align === "center") {
      x = marginX + (contentW - tw) / 2;
    } else if (opts.align === "left") {
      x = marginX;
    } else {
      // right (RTL default)
      x = marginX + contentW - tw;
    }
    page.drawText(text, { x, y, size, font: f, color: rgb(color.r, color.g, color.b) });
    y -= opts.gap ?? 18;
  };

  const drawHRule = (opacity = 0.15) => {
    page.drawLine({
      start: { x: marginX, y },
      end: { x: width - marginX, y },
      thickness: 0.75,
      color: rgb(0, 0, 0),
      opacity,
    });
    y -= 12;
  };

  const skipLine = (n = 1) => { y -= 14 * n; };

  // ── Logo + Company header ─────────────────────
  if (logoImg) {
    const logoScale = 0.35;
    const logoDims = logoImg.scale(logoScale);
    page.drawImage(logoImg, {
      x: marginX + contentW - logoDims.width,
      y: y - logoDims.height + 6,
      width: logoDims.width,
      height: logoDims.height,
    });
    y -= logoDims.height + 8;
  }

  drawLine(shapeAr(input.companyName), { bold: true, size: 14, align: "right" });
  if (input.companyAddress) {
    drawLine(shapeAr(input.companyAddress), { size: 10, align: "right", color: { r: 0.4, g: 0.4, b: 0.4 } });
  }
  skipLine();
  drawHRule(0.2);

  // ── بسم الله ──────────────────────────────────
  drawLine("بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ", { size: 12, align: "center", bold: true });
  skipLine(0.5);

  // ── Letter title ──────────────────────────────
  const title = getLetterTitle(input.type);
  drawLine(title, { bold: true, size: 16, align: "center" });
  skipLine(0.5);
  drawHRule(0.1);
  skipLine(0.5);

  // ── Date + reference ─────────────────────────
  const today = new Date().toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" });
  drawLine(`التاريخ: ${today}`, { size: 10, align: "right", color: { r: 0.4, g: 0.4, b: 0.4 } });
  skipLine();

  // ── Salutation ────────────────────────────────
  drawLine("إلى من يهمه الأمر،،،", { bold: true, size: 12, align: "right" });
  skipLine();

  // ── Body ─────────────────────────────────────
  const bodyLines =
    input.type === "salary"
      ? buildSalaryBody(input)
      : input.type === "experience"
        ? buildExperienceBody(input)
        : buildIntroBody(input);

  for (const line of bodyLines) {
    if (line === "") {
      skipLine();
    } else {
      drawLine(line, { size: 11, align: "right", gap: 20 });
    }
  }

  skipLine(2);

  // ── Signature block ───────────────────────────
  drawHRule(0.1);
  skipLine();
  drawLine("المفوّض بالتوقيع", { bold: true, size: 11, align: "right" });
  drawLine(shapeAr(input.companyName), { size: 11, align: "right", gap: 14 });
  skipLine(3);
  // Signature line
  page.drawLine({
    start: { x: marginX + contentW - 140, y },
    end: { x: marginX + contentW, y },
    thickness: 0.75,
    color: rgb(0.2, 0.2, 0.2),
    opacity: 0.5,
  });
  y -= 14;
  drawLine("التوقيع والختم", { size: 9, align: "right", color: { r: 0.5, g: 0.5, b: 0.5 } });

  return pdfDoc.save();
}
