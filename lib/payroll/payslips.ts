import { Prisma } from "@prisma/client";

import prisma from "@/lib/db";
import { extractCurrentCompensation } from "@/lib/payroll/compensation";
import { calculatePayrollDeductions } from "@/lib/gosi";
import { sendBulkNotification, notifyPayslipReady } from "@/lib/notifications/send";
import type { Payslip, PayslipDeduction, PayslipEarning, PayslipStatus } from "@/lib/types/payroll";

export type PayrollPeriodSnapshot = {
  id: string;
  name?: string | null;
  nameAr?: string | null;
  startDate: Date;
  endDate: Date;
  paymentDate: Date;
};

export type PayrollEmployeeSnapshot = {
  id: string;
  userId?: string | null;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  firstNameAr: string | null;
  lastNameAr: string | null;
  baseSalary: Prisma.Decimal | number | null;
  currency: string;
  nationality: string | null;
  salaryRecords?: Array<{
    structureId: string | null;
    basicSalary: Prisma.Decimal | number;
    components: unknown;
    bankName: string | null;
    bankAccountNumber: string | null;
    iban: string | null;
    swiftCode: string | null;
    paymentMethod: string;
    currency: string;
  }>;
  department: { name: string; nameAr: string | null } | null;
  jobTitle: { name: string; nameAr: string | null } | null;
};

export type PayslipSnapshot = Omit<
  Payslip,
  "id" | "createdAt" | "updatedAt" | "status" | "sentAt" | "viewedAt"
> & {
  status: PayslipStatus;
  createdAt: string;
  updatedAt: string;
};

type PayslipDbRow = {
  id: string;
  payrollPeriodId: string;
  employeeId: string;
  currency: string;
  basicSalary: Prisma.Decimal | number;
  earnings: unknown;
  totalEarnings: Prisma.Decimal | number;
  deductions: unknown;
  totalDeductions: Prisma.Decimal | number;
  netSalary: Prisma.Decimal | number;
  workingDays: number;
  actualWorkDays: number;
  absentDays: number;
  lateDays: number;
  overtimeHours: number;
  gosiEmployee: number;
  gosiEmployer: number;
  status: string;
  sentAt: Date | null;
  viewedAt: Date | null;
  paymentMethod: string;
  bankName: string | null;
  accountNumber: string | null;
  createdAt: Date;
  updatedAt: Date;
  employee: {
    employeeNumber: string;
    firstName: string;
    lastName: string;
    firstNameAr: string | null;
    lastNameAr: string | null;
    department: { id: string; name: string; nameAr: string | null } | null;
    jobTitle: { name: string; nameAr: string | null } | null;
    userId?: string | null;
  };
  payrollPeriod?: {
    id: string;
    name: string;
    nameAr: string;
    startDate: Date;
    endDate: Date;
    paymentDate: Date;
  };
};

function toNumber(value: Prisma.Decimal | number | null | undefined): number {
  return typeof value === "number" ? value : Number(value ?? 0);
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function roundInt(value: number): number {
  return Math.round(value);
}

export function toIsoDate(date: Date): string {
  return date.toISOString().split("T")[0] ?? "";
}

export function toIsoDateTime(date: Date): string {
  return date.toISOString();
}

export function mapDbPayslip(row: PayslipDbRow): Payslip {
  const employee = row.employee;

  return {
    id: row.id,
    payrollPeriodId: row.payrollPeriodId,
    periodName: row.payrollPeriod?.name,
    periodNameAr: row.payrollPeriod?.nameAr,
    periodStartDate: row.payrollPeriod ? toIsoDate(row.payrollPeriod.startDate) : undefined,
    periodEndDate: row.payrollPeriod ? toIsoDate(row.payrollPeriod.endDate) : undefined,
    paymentDate: row.payrollPeriod ? toIsoDate(row.payrollPeriod.paymentDate) : undefined,
    employeeId: row.employeeId,
    employeeName: `${employee.firstName} ${employee.lastName}`,
    employeeNameAr: `${employee.firstNameAr || employee.firstName} ${employee.lastNameAr || employee.lastName}`,
    employeeNumber: employee.employeeNumber,
    departmentId: employee.department?.id,
    department: employee.department?.name ?? "N/A",
    departmentAr: employee.department?.nameAr ?? "غير محدد",
    jobTitle: employee.jobTitle?.name ?? "N/A",
    jobTitleAr: employee.jobTitle?.nameAr ?? "غير محدد",
    currency: row.currency,
    basicSalary: Number(row.basicSalary),
    earnings: row.earnings as PayslipEarning[],
    totalEarnings: Number(row.totalEarnings),
    deductions: row.deductions as PayslipDeduction[],
    totalDeductions: Number(row.totalDeductions),
    netSalary: Number(row.netSalary),
    workingDays: row.workingDays,
    actualWorkDays: row.actualWorkDays,
    absentDays: row.absentDays,
    lateDays: row.lateDays,
    overtimeHours: row.overtimeHours,
    gosiEmployee: row.gosiEmployee,
    gosiEmployer: row.gosiEmployer,
    status: String(row.status).toLowerCase() as PayslipStatus,
    sentAt: row.sentAt ? toIsoDateTime(row.sentAt) : undefined,
    viewedAt: row.viewedAt ? toIsoDateTime(row.viewedAt) : undefined,
    paymentMethod: row.paymentMethod,
    bankName: row.bankName ?? undefined,
    accountNumber: row.accountNumber ?? undefined,
    createdAt: toIsoDateTime(row.createdAt),
    updatedAt: toIsoDateTime(row.updatedAt),
  };
}

export function isSaudiNational(nationality?: string | null): boolean {
  if (!nationality) return true;

  const normalized = nationality.trim().toLowerCase();
  if (!normalized) return true;

  return [
    "sa",
    "saudi",
    "saudi arabia",
    "ksa",
    "kingdom of saudi arabia",
    "السعودية",
    "سعودي",
    "سعودية",
    "المملكة العربية السعودية",
  ].includes(normalized);
}

export function computePayslipSnapshot(input: {
  employee: PayrollEmployeeSnapshot;
  period: PayrollPeriodSnapshot;
}): PayslipSnapshot {
  const compensation = extractCurrentCompensation(input.employee);
  const basicSalary = roundMoney(compensation.basicSalary);
  const configuredComponents = compensation.components.filter((component) => component.type !== "basic");
  const fallbackHousingAllowance = roundMoney(basicSalary * 0.25);
  const fallbackTransportAllowance = roundMoney(basicSalary * 0.1);
  const housingAllowance = roundMoney(
    configuredComponents
      .filter((component) => component.type === "housing")
      .reduce((sum, component) => sum + component.amount, 0) || fallbackHousingAllowance
  );
  const transportAllowance = roundMoney(
    configuredComponents
      .filter((component) => component.type === "transport")
      .reduce((sum, component) => sum + component.amount, 0) || fallbackTransportAllowance
  );
  const otherConfiguredAllowances = roundMoney(
    configuredComponents
      .filter((component) => component.type !== "housing" && component.type !== "transport")
      .reduce((sum, component) => sum + component.amount, 0)
  );
  const workingDays = 22;

  const deductionsSummary = calculatePayrollDeductions({
    basicSalary,
    housingAllowance,
    otherAllowances: transportAllowance + otherConfiguredAllowances,
    isSaudi: isSaudiNational(input.employee.nationality),
    workingDays,
  });

  const gosiEmployee = roundInt(deductionsSummary.gosiEmployee);
  const gosiEmployer = roundInt(deductionsSummary.gosiEmployer);
  const totalDeductions = roundMoney(
    gosiEmployee + deductionsSummary.absenceDeduction + deductionsSummary.lateDeduction + deductionsSummary.loanDeduction
  );
  const earnings: PayslipEarning[] = configuredComponents.length > 0
    ? [
        {
          type: "basic",
          name: "Basic Salary",
          nameAr: "الراتب الأساسي",
          amount: basicSalary,
        },
        ...configuredComponents.map((component) => ({
          type: component.type,
          name: component.name,
          nameAr: component.nameAr,
          amount: component.amount,
        })),
      ]
    : [
        {
          type: "basic",
          name: "Basic Salary",
          nameAr: "الراتب الأساسي",
          amount: basicSalary,
        },
        {
          type: "housing",
          name: "Housing Allowance",
          nameAr: "بدل السكن",
          amount: housingAllowance,
        },
        {
          type: "transport",
          name: "Transport Allowance",
          nameAr: "بدل المواصلات",
          amount: transportAllowance,
        },
      ];
  const totalEarnings = roundMoney(earnings.reduce((sum, component) => sum + component.amount, 0));
  const netSalary = roundMoney(totalEarnings - totalDeductions);

  const deductions: PayslipDeduction[] = [];
  if (gosiEmployee > 0) {
    deductions.push({
      type: "gosi",
      name: "GOSI",
      nameAr: "التأمينات الاجتماعية",
      amount: gosiEmployee,
    });
  }

  const nowIso = toIsoDateTime(new Date());

  return {
    payrollPeriodId: input.period.id,
    employeeId: input.employee.id,
    employeeName: `${input.employee.firstName} ${input.employee.lastName}`,
    employeeNameAr: `${input.employee.firstNameAr || input.employee.firstName} ${input.employee.lastNameAr || input.employee.lastName}`,
    employeeNumber: input.employee.employeeNumber,
    department: input.employee.department?.name ?? "N/A",
    departmentAr: input.employee.department?.nameAr ?? "غير محدد",
    jobTitle: input.employee.jobTitle?.name ?? "N/A",
    jobTitleAr: input.employee.jobTitle?.nameAr ?? "غير محدد",
    currency: compensation.currency,
    basicSalary,
    earnings,
    totalEarnings,
    deductions,
    totalDeductions,
    netSalary,
    workingDays,
    actualWorkDays: workingDays,
    absentDays: 0,
    lateDays: 0,
    overtimeHours: 0,
    gosiEmployee,
    gosiEmployer,
    status: "generated",
    paymentMethod: compensation.paymentMethod,
    bankName: compensation.bankName,
    accountNumber: compensation.bankAccountNumber,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}

export function buildPayslipCreateData(input: {
  tenantId: string;
  employee: PayrollEmployeeSnapshot;
  period: PayrollPeriodSnapshot;
}) {
  const snapshot = computePayslipSnapshot({ employee: input.employee, period: input.period });

  return {
    tenantId: input.tenantId,
    payrollPeriodId: input.period.id,
    employeeId: input.employee.id,
    status: "GENERATED" as const,
    currency: snapshot.currency || input.employee.currency,
    paymentMethod: snapshot.paymentMethod,
    bankName: snapshot.bankName ?? null,
    accountNumber: snapshot.accountNumber ?? null,
    basicSalary: snapshot.basicSalary,
    totalEarnings: snapshot.totalEarnings,
    totalDeductions: snapshot.totalDeductions,
    netSalary: snapshot.netSalary,
    earnings: snapshot.earnings as unknown as Prisma.InputJsonValue,
    deductions: snapshot.deductions as unknown as Prisma.InputJsonValue,
    workingDays: snapshot.workingDays,
    actualWorkDays: snapshot.actualWorkDays,
    absentDays: snapshot.absentDays,
    lateDays: snapshot.lateDays,
    overtimeHours: snapshot.overtimeHours,
    gosiEmployee: snapshot.gosiEmployee,
    gosiEmployer: snapshot.gosiEmployer,
  };
}

export async function ensurePayslipsForPeriod(tenantId: string, periodId: string) {
  const period = await prisma.payrollPeriod.findFirst({
    where: { id: periodId, tenantId },
    select: {
      id: true,
      name: true,
      nameAr: true,
      startDate: true,
      endDate: true,
      paymentDate: true,
    },
  });

  if (!period) {
    return { period: null, generatedCount: 0 };
  }

  const employees = await prisma.employee.findMany({
    where: { tenantId, status: "ACTIVE" },
    select: {
      id: true,
      userId: true,
      employeeNumber: true,
      firstName: true,
      lastName: true,
      firstNameAr: true,
      lastNameAr: true,
      baseSalary: true,
      currency: true,
      nationality: true,
      salaryRecords: {
        where: {
          effectiveDate: { lte: period.paymentDate },
          OR: [{ endDate: null }, { endDate: { gte: period.startDate } }],
        },
        orderBy: [{ effectiveDate: "desc" }, { createdAt: "desc" }],
        take: 1,
        select: {
          structureId: true,
          basicSalary: true,
          components: true,
          bankName: true,
          bankAccountNumber: true,
          iban: true,
          swiftCode: true,
          paymentMethod: true,
          currency: true,
        },
      },
      department: { select: { name: true, nameAr: true } },
      jobTitle: { select: { name: true, nameAr: true } },
    },
  });

  if (employees.length === 0) {
    return { period, generatedCount: 0 };
  }

  await prisma.$transaction(
    employees.map((employee) =>
      prisma.payrollPayslip.upsert({
        where: {
          tenantId_payrollPeriodId_employeeId: {
            tenantId,
            payrollPeriodId: periodId,
            employeeId: employee.id,
          },
        },
        create: buildPayslipCreateData({
          tenantId,
          employee: employee as PayrollEmployeeSnapshot,
          period,
        }),
        update: {},
      })
    )
  );

  return { period, generatedCount: employees.length };
}

export async function summarizePayrollPeriod(tenantId: string, periodId: string) {
  const aggregate = await prisma.payrollPayslip.aggregate({
    where: { tenantId, payrollPeriodId: periodId },
    _count: { _all: true },
    _sum: {
      totalEarnings: true,
      totalDeductions: true,
      netSalary: true,
    },
  });

  return {
    employeeCount: aggregate._count._all,
    totalGross: Number(aggregate._sum.totalEarnings ?? 0),
    totalDeductions: Number(aggregate._sum.totalDeductions ?? 0),
    totalNet: Number(aggregate._sum.netSalary ?? 0),
  };
}

export async function listPayslipsForPeriod(
  tenantId: string,
  periodId: string,
  options?: { status?: string; q?: string }
) {
  const ensured = await ensurePayslipsForPeriod(tenantId, periodId);
  const period = ensured.period;

  if (!period) {
    return { period: null, payslips: [] as Payslip[] };
  }

  const where: any = { tenantId, payrollPeriodId: periodId };

  const status = options?.status?.toLowerCase().trim();
  if (status && status !== "all") {
    const upper = status.toUpperCase();
    if (["DRAFT", "GENERATED", "SENT", "VIEWED"].includes(upper)) {
      where.status = upper;
    }
  }

  const q = options?.q?.trim();
  if (q) {
    where.employee = {
      OR: [
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
        { firstNameAr: { contains: q, mode: "insensitive" } },
        { lastNameAr: { contains: q, mode: "insensitive" } },
        { employeeNumber: { contains: q, mode: "insensitive" } },
      ],
    };
  }

  const rows = await prisma.payrollPayslip.findMany({
    where,
    include: {
      employee: {
        select: {
          userId: true,
          employeeNumber: true,
          firstName: true,
          lastName: true,
          firstNameAr: true,
          lastNameAr: true,
          department: { select: { id: true, name: true, nameAr: true } },
          jobTitle: { select: { name: true, nameAr: true } },
        },
      },
      payrollPeriod: {
        select: {
          id: true,
          name: true,
          nameAr: true,
          startDate: true,
          endDate: true,
          paymentDate: true,
        },
      },
    },
    orderBy: [{ createdAt: "desc" }],
  });

  return {
    period,
    payslips: rows.map((row) => mapDbPayslip(row as unknown as PayslipDbRow)),
  };
}

export async function getPayslipById(tenantId: string, payslipId: string) {
  const row = await prisma.payrollPayslip.findFirst({
    where: { id: payslipId, tenantId },
    include: {
      employee: {
        select: {
          userId: true,
          employeeNumber: true,
          firstName: true,
          lastName: true,
          firstNameAr: true,
          lastNameAr: true,
          department: { select: { id: true, name: true, nameAr: true } },
          jobTitle: { select: { name: true, nameAr: true } },
        },
      },
      payrollPeriod: {
        select: {
          id: true,
          name: true,
          nameAr: true,
          startDate: true,
          endDate: true,
          paymentDate: true,
        },
      },
    },
  });

  if (!row) return null;
  return mapDbPayslip(row as unknown as PayslipDbRow);
}

export async function listPayslipsForEmployee(
  tenantId: string,
  employeeId: string,
  options?: { year?: number; status?: string }
) {
  const where: any = {
    tenantId,
    employeeId,
  };

  const status = options?.status?.toLowerCase().trim();
  if (status && status !== "all") {
    const upper = status.toUpperCase();
    if (["DRAFT", "GENERATED", "SENT", "VIEWED"].includes(upper)) {
      where.status = upper;
    }
  }

  if (options?.year) {
    where.payrollPeriod = {
      startDate: {
        gte: new Date(Date.UTC(options.year, 0, 1)),
        lte: new Date(Date.UTC(options.year, 11, 31)),
      },
    };
  }

  const rows = await prisma.payrollPayslip.findMany({
    where,
    include: {
      employee: {
        select: {
          userId: true,
          employeeNumber: true,
          firstName: true,
          lastName: true,
          firstNameAr: true,
          lastNameAr: true,
          department: { select: { id: true, name: true, nameAr: true } },
          jobTitle: { select: { name: true, nameAr: true } },
        },
      },
      payrollPeriod: {
        select: {
          id: true,
          name: true,
          nameAr: true,
          startDate: true,
          endDate: true,
          paymentDate: true,
        },
      },
    },
    orderBy: [{ payrollPeriod: { startDate: "desc" } }, { createdAt: "desc" }],
  });

  return rows.map((row) => mapDbPayslip(row as unknown as PayslipDbRow));
}

export async function updatePayslipAdjustments(input: {
  tenantId: string;
  payslipId: string;
  earnings?: PayslipEarning[];
  deductions?: PayslipDeduction[];
}) {
  const existing = await prisma.payrollPayslip.findFirst({
    where: { id: input.payslipId, tenantId: input.tenantId },
    include: {
      employee: {
        select: {
          userId: true,
          employeeNumber: true,
          firstName: true,
          lastName: true,
          firstNameAr: true,
          lastNameAr: true,
          department: { select: { id: true, name: true, nameAr: true } },
          jobTitle: { select: { name: true, nameAr: true } },
        },
      },
      payrollPeriod: {
        select: {
          id: true,
          name: true,
          nameAr: true,
          startDate: true,
          endDate: true,
          paymentDate: true,
        },
      },
    },
  });

  if (!existing) return null;

  const earnings = input.earnings ?? (existing.earnings as unknown as PayslipEarning[]);
  const deductions = input.deductions ?? (existing.deductions as unknown as PayslipDeduction[]);
  const totalEarnings = roundMoney(earnings.reduce((sum, item) => sum + Number(item.amount || 0), 0));
  const totalDeductions = roundMoney(deductions.reduce((sum, item) => sum + Number(item.amount || 0), 0));
  const netSalary = roundMoney(totalEarnings - totalDeductions);

  const updated = await prisma.payrollPayslip.update({
    where: { id: input.payslipId },
    data: {
      earnings: earnings as unknown as Prisma.InputJsonValue,
      deductions: deductions as unknown as Prisma.InputJsonValue,
      totalEarnings,
      totalDeductions,
      netSalary,
      basicSalary: earnings
        .filter((item) => item.type === "basic")
        .reduce((sum, item) => sum + Number(item.amount || 0), 0),
    },
    include: {
      employee: {
        select: {
          userId: true,
          employeeNumber: true,
          firstName: true,
          lastName: true,
          firstNameAr: true,
          lastNameAr: true,
          department: { select: { name: true, nameAr: true } },
          jobTitle: { select: { name: true, nameAr: true } },
        },
      },
      payrollPeriod: {
        select: {
          id: true,
          name: true,
          nameAr: true,
          startDate: true,
          endDate: true,
          paymentDate: true,
        },
      },
    },
  });

  return mapDbPayslip(updated as unknown as PayslipDbRow);
}

export async function sendPayslipsForPeriod(tenantId: string, periodId: string) {
  const period = await prisma.payrollPeriod.findFirst({
    where: { id: periodId, tenantId },
    select: { id: true, name: true, nameAr: true },
  });

  if (!period) return null;

  const eligiblePayslips = await prisma.payrollPayslip.findMany({
    where: {
      tenantId,
      payrollPeriodId: periodId,
      status: { in: ["DRAFT", "GENERATED"] },
      employee: { userId: { not: null } },
    },
    select: {
      id: true,
      employeeId: true,
      employee: { select: { userId: true } },
    },
  });

  const updated = await prisma.payrollPayslip.updateMany({
    where: {
      tenantId,
      payrollPeriodId: periodId,
      status: { in: ["DRAFT", "GENERATED"] },
    },
    data: {
      status: "SENT",
      sentAt: new Date(),
    },
  });

  if (eligiblePayslips.length > 0) {
    await sendBulkNotification(
      eligiblePayslips
        .map((payslip) => {
          if (!payslip.employee.userId) return null;

          return {
            tenantId,
            userId: payslip.employee.userId,
            type: "payslip-ready" as const,
            title: "قسيمة الراتب جاهزة",
            message: `قسيمة راتب ${period.nameAr || period.name} متاحة الآن`,
            link: `/dashboard/payslips/${payslip.id}`,
            metadata: {
              payslipId: payslip.id,
              employeeId: payslip.employeeId,
            },
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null)
    );
  }

  return {
    updatedCount: updated.count,
    period,
  };
}

export async function sendSinglePayslip(tenantId: string, payslipId: string) {
  const existing = await prisma.payrollPayslip.findFirst({
    where: { id: payslipId, tenantId },
    select: {
      id: true,
      status: true,
      employee: { select: { userId: true } },
      payrollPeriod: { select: { name: true, nameAr: true } },
    },
  });

  if (!existing) return null;

  const updated = await prisma.payrollPayslip.update({
    where: { id: payslipId },
    data: {
      status: "SENT",
      sentAt: new Date(),
    },
  });

  if (existing.employee.userId && existing.status !== "SENT" && existing.status !== "VIEWED") {
    await notifyPayslipReady({
      tenantId,
      employeeUserId: existing.employee.userId,
      periodName: existing.payrollPeriod.nameAr || existing.payrollPeriod.name,
      payslipId: updated.id,
    });
  }

  return updated;
}