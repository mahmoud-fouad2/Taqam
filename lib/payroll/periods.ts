import { type PayrollPeriodStatus } from "@prisma/client";

import prisma from "@/lib/db";

const PAYROLL_PERIOD_STATUS_TRANSITIONS: Record<
  PayrollPeriodStatus,
  readonly PayrollPeriodStatus[]
> = {
  DRAFT: ["PENDING_APPROVAL", "CANCELLED"],
  PROCESSING: ["PENDING_APPROVAL", "CANCELLED"],
  PENDING_APPROVAL: ["APPROVED", "DRAFT", "CANCELLED"],
  APPROVED: ["PAID"],
  PAID: [],
  CANCELLED: []
};

export function toIsoDate(date: Date): string {
  return date.toISOString().split("T")[0] ?? "";
}

export function mapPayrollPeriod(period: any) {
  return {
    ...period,
    startDate: toIsoDate(period.startDate),
    endDate: toIsoDate(period.endDate),
    paymentDate: toIsoDate(period.paymentDate),
    status: String(period.status).toUpperCase(),
    totalGross: Number(period.totalGross),
    totalDeductions: Number(period.totalDeductions),
    totalNet: Number(period.totalNet)
  };
}

export async function getPayrollPeriodById(tenantId: string, id: string) {
  return prisma.payrollPeriod.findFirst({
    where: { id, tenantId }
  });
}

type PayrollPeriodRecord = NonNullable<Awaited<ReturnType<typeof getPayrollPeriodById>>>;

type UpdatePayrollPeriodStatusResult =
  | { ok: true; period: PayrollPeriodRecord }
  | { ok: false; error: "not-found" }
  | { ok: false; error: "invalid-transition"; currentStatus: PayrollPeriodStatus };

function appendPayrollPeriodNote(existingNotes: string | null, nextNote?: string): string | null {
  const trimmedNote = nextNote?.trim();
  if (!trimmedNote) {
    return existingNotes;
  }

  return [existingNotes, trimmedNote].filter(Boolean).join("\n\n");
}

export function canTransitionPayrollPeriodStatus(
  currentStatus: PayrollPeriodStatus,
  nextStatus: PayrollPeriodStatus
): boolean {
  return PAYROLL_PERIOD_STATUS_TRANSITIONS[currentStatus].includes(nextStatus);
}

export function getPayrollPeriodStatusTransitionError(
  currentStatus: PayrollPeriodStatus,
  nextStatus: PayrollPeriodStatus
): string {
  const from = currentStatus.toLowerCase().replace(/_/g, " ");
  const to = nextStatus.toLowerCase().replace(/_/g, " ");

  return `Cannot change payroll period status from ${from} to ${to}.`;
}

export async function updatePayrollPeriodStatus(input: {
  tenantId: string;
  id: string;
  status: PayrollPeriodStatus;
  note?: string;
}): Promise<UpdatePayrollPeriodStatusResult> {
  const existing = await getPayrollPeriodById(input.tenantId, input.id);
  if (!existing) {
    return { ok: false, error: "not-found" };
  }

  if (!canTransitionPayrollPeriodStatus(existing.status, input.status)) {
    return {
      ok: false,
      error: "invalid-transition",
      currentStatus: existing.status
    };
  }

  const mergedNotes = appendPayrollPeriodNote(existing.notes, input.note);

  const period = await prisma.payrollPeriod.update({
    where: { id: input.id },
    data: {
      status: input.status,
      ...(mergedNotes !== existing.notes ? { notes: mergedNotes } : {})
    }
  });

  return { ok: true, period };
}
