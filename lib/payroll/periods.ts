import { type PayrollPeriodStatus } from "@prisma/client";

import prisma from "@/lib/db";

export function toIsoDate(date: Date): string {
  return date.toISOString().split("T")[0] ?? "";
}

export function mapPayrollPeriod(period: any) {
  return {
    ...period,
    startDate: toIsoDate(period.startDate),
    endDate: toIsoDate(period.endDate),
    paymentDate: toIsoDate(period.paymentDate),
    status: String(period.status).toLowerCase(),
    totalGross: Number(period.totalGross),
    totalDeductions: Number(period.totalDeductions),
    totalNet: Number(period.totalNet),
  };
}

export async function getPayrollPeriodById(tenantId: string, id: string) {
  return prisma.payrollPeriod.findFirst({
    where: { id, tenantId },
  });
}

export async function updatePayrollPeriodStatus(input: {
  tenantId: string;
  id: string;
  status: PayrollPeriodStatus;
  note?: string;
}) {
  const existing = await getPayrollPeriodById(input.tenantId, input.id);
  if (!existing) return null;

  const mergedNotes = input.note
    ? [existing.notes, input.note].filter(Boolean).join("\n\n")
    : existing.notes;

  return prisma.payrollPeriod.update({
    where: { id: input.id },
    data: {
      status: input.status,
      ...(mergedNotes ? { notes: mergedNotes } : {}),
    },
  });
}