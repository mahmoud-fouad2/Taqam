import { Prisma } from "@prisma/client";

import prisma from "@/lib/db";
import type { EmployeeSalary, EmployeeSalaryComponent } from "@/lib/types/payroll";

export const COMPENSATION_ADMIN_ROLES = ["SUPER_ADMIN", "TENANT_ADMIN", "HR_MANAGER"] as const;

type SalaryRecordRow = {
  id: string;
  employeeId: string;
  structureId: string | null;
  basicSalary: Prisma.Decimal | number;
  components: unknown;
  effectiveDate: Date;
  endDate: Date | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  iban: string | null;
  swiftCode: string | null;
  paymentMethod: string;
  currency: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type CompensationFallbackEmployee = {
  id: string;
  tenantId: string;
  userId: string | null;
  baseSalary: Prisma.Decimal | number | null;
  currency: string;
  hireDate: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type CompensationRecordSnapshot = {
  structureId: string | null;
  basicSalary: Prisma.Decimal | number;
  components: unknown;
  bankName: string | null;
  bankAccountNumber: string | null;
  iban: string | null;
  swiftCode: string | null;
  paymentMethod: string;
  currency: string;
};

export type CompensationSource = {
  baseSalary: Prisma.Decimal | number | null;
  currency: string | null | undefined;
  salaryRecords?: CompensationRecordSnapshot[];
};

type CompensationErrorResult = {
  error: {
    message: string;
    status: number;
  };
};

type CompensationAccessResult =
  | {
      employee: CompensationFallbackEmployee;
    }
  | CompensationErrorResult;

type CompensationSalaryResult =
  | {
      salary: EmployeeSalary;
    }
  | CompensationErrorResult;

type CompensationHistoryResult =
  | {
      history: EmployeeSalary[];
    }
  | CompensationErrorResult;

function toNumber(value: Prisma.Decimal | number | null | undefined) {
  return typeof value === "number" ? value : Number(value ?? 0);
}

function toIsoDate(date: Date) {
  return date.toISOString().split("T")[0] ?? "";
}

function normalizePaymentMethod(value: string | null | undefined): EmployeeSalary["paymentMethod"] {
  switch ((value || "").trim().toLowerCase()) {
    case "cash":
      return "cash";
    case "check":
      return "check";
    case "bank_transfer":
    default:
      return "bank_transfer";
  }
}

export function isCompensationAdmin(role: string) {
  return COMPENSATION_ADMIN_ROLES.includes(role as (typeof COMPENSATION_ADMIN_ROLES)[number]);
}

export function parseSalaryComponents(value: unknown): EmployeeSalaryComponent[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") {
      return [];
    }

    const component = item as Partial<EmployeeSalaryComponent>;
    if (typeof component.name !== "string" || typeof component.nameAr !== "string") {
      return [];
    }

    const amount = Number(component.amount ?? 0);
    if (!Number.isFinite(amount)) {
      return [];
    }

    return [
      {
        componentId: typeof component.componentId === "string" ? component.componentId : "",
        type: (component.type as EmployeeSalaryComponent["type"]) || "other",
        name: component.name,
        nameAr: component.nameAr,
        amount,
        isFixed: component.isFixed !== false,
      },
    ];
  });
}

export function mapSalaryRecord(record: SalaryRecordRow): EmployeeSalary {
  return {
    id: record.id,
    employeeId: record.employeeId,
    structureId: record.structureId ?? undefined,
    basicSalary: toNumber(record.basicSalary),
    components: parseSalaryComponents(record.components),
    effectiveDate: toIsoDate(record.effectiveDate),
    endDate: record.endDate ? toIsoDate(record.endDate) : undefined,
    bankName: record.bankName ?? undefined,
    bankAccountNumber: record.bankAccountNumber ?? undefined,
    iban: record.iban ?? undefined,
    swiftCode: record.swiftCode ?? undefined,
    paymentMethod: normalizePaymentMethod(record.paymentMethod),
    currency: record.currency,
    notes: record.notes ?? undefined,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export function buildFallbackSalaryRecord(employee: CompensationFallbackEmployee): EmployeeSalary | null {
  if (employee.baseSalary == null) {
    return null;
  }

  return {
    id: `fallback-${employee.id}`,
    employeeId: employee.id,
    structureId: undefined,
    basicSalary: toNumber(employee.baseSalary),
    components: [],
    effectiveDate: toIsoDate(employee.hireDate),
    paymentMethod: "bank_transfer",
    currency: employee.currency,
    createdAt: employee.createdAt.toISOString(),
    updatedAt: employee.updatedAt.toISOString(),
  };
}

export function extractCurrentCompensation(source: CompensationSource) {
  const record = source.salaryRecords?.[0];

  return {
    structureId: record?.structureId ?? undefined,
    basicSalary: toNumber(record?.basicSalary ?? source.baseSalary),
    components: parseSalaryComponents(record?.components),
    bankName: record?.bankName ?? undefined,
    bankAccountNumber: record?.bankAccountNumber ?? undefined,
    iban: record?.iban ?? undefined,
    swiftCode: record?.swiftCode ?? undefined,
    paymentMethod: normalizePaymentMethod(record?.paymentMethod),
    currency: record?.currency || source.currency || "SAR",
  };
}

export async function resolveCompensationEmployeeAccess(input: {
  tenantId: string;
  employeeId: string;
  userId: string;
  role: string;
}): Promise<CompensationAccessResult> {
  const employee = await prisma.employee.findFirst({
    where: { id: input.employeeId, tenantId: input.tenantId },
    select: {
      id: true,
      tenantId: true,
      userId: true,
      baseSalary: true,
      currency: true,
      hireDate: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!employee) {
    return { error: { message: "Employee not found", status: 404 as const } };
  }

  if (!isCompensationAdmin(input.role) && employee.userId !== input.userId) {
    return { error: { message: "Forbidden", status: 403 as const } };
  }

  return { employee };
}

export async function getEmployeeCurrentSalary(input: {
  tenantId: string;
  employeeId: string;
  userId: string;
  role: string;
}): Promise<CompensationSalaryResult> {
  const access = await resolveCompensationEmployeeAccess(input);
  if ("error" in access) {
    return access;
  }

  const current = await prisma.employeeSalaryRecord.findFirst({
    where: { tenantId: input.tenantId, employeeId: input.employeeId },
    orderBy: [{ effectiveDate: "desc" }, { createdAt: "desc" }],
  });

  if (!current) {
    const fallback = buildFallbackSalaryRecord(access.employee);
    if (!fallback) {
      return { error: { message: "Salary profile not found", status: 404 as const } };
    }

    return { salary: fallback };
  }

  return { salary: mapSalaryRecord(current as SalaryRecordRow) };
}

export async function listEmployeeSalaryHistory(input: {
  tenantId: string;
  employeeId: string;
  userId: string;
  role: string;
}): Promise<CompensationHistoryResult> {
  const access = await resolveCompensationEmployeeAccess(input);
  if ("error" in access) {
    return access;
  }

  const history = await prisma.employeeSalaryRecord.findMany({
    where: { tenantId: input.tenantId, employeeId: input.employeeId },
    orderBy: [{ effectiveDate: "desc" }, { createdAt: "desc" }],
  });

  if (history.length === 0) {
    const fallback = buildFallbackSalaryRecord(access.employee);
    return { history: fallback ? [fallback] : [] };
  }

  return { history: history.map((item) => mapSalaryRecord(item as SalaryRecordRow)) };
}

export async function saveEmployeeSalary(input: {
  tenantId: string;
  employeeId: string;
  basicSalary: number;
  components?: EmployeeSalaryComponent[];
  structureId?: string | null;
  effectiveDate?: string;
  endDate?: string | null;
  bankName?: string;
  bankAccountNumber?: string;
  iban?: string;
  swiftCode?: string;
  paymentMethod?: EmployeeSalary["paymentMethod"];
  currency?: string;
  notes?: string;
}): Promise<CompensationSalaryResult> {
  const employee = await prisma.employee.findFirst({
    where: { id: input.employeeId, tenantId: input.tenantId },
    select: {
      id: true,
      baseSalary: true,
      currency: true,
    },
  });

  if (!employee) {
    return { error: { message: "Employee not found", status: 404 as const } };
  }

  if (input.structureId) {
    const structure = await prisma.salaryStructure.findFirst({
      where: { id: input.structureId, tenantId: input.tenantId },
      select: { id: true },
    });

    if (!structure) {
      return { error: { message: "Salary structure not found", status: 404 as const } };
    }
  }

  const effectiveDate = input.effectiveDate ? new Date(input.effectiveDate) : new Date();
  if (Number.isNaN(effectiveDate.getTime())) {
    return { error: { message: "Invalid effectiveDate", status: 400 as const } };
  }

  const endDate = input.endDate ? new Date(input.endDate) : null;
  if (endDate && Number.isNaN(endDate.getTime())) {
    return { error: { message: "Invalid endDate", status: 400 as const } };
  }

  const latest = await prisma.employeeSalaryRecord.findFirst({
    where: { tenantId: input.tenantId, employeeId: input.employeeId },
    orderBy: [{ effectiveDate: "desc" }, { createdAt: "desc" }],
  });

  if (
    latest &&
    toIsoDate(effectiveDate) < toIsoDate(latest.effectiveDate) &&
    toIsoDate(effectiveDate) !== toIsoDate(latest.effectiveDate)
  ) {
    return {
      error: {
        message: "Backdated salary records are not supported until full compensation timeline tooling is added",
        status: 400 as const,
      },
    };
  }

  const saved = await prisma.$transaction(async (tx) => {
    const payload = {
      structureId: input.structureId ?? null,
      basicSalary: new Prisma.Decimal(input.basicSalary),
      components: (input.components ?? []) as unknown as Prisma.InputJsonValue,
      effectiveDate,
      endDate,
      bankName: input.bankName || null,
      bankAccountNumber: input.bankAccountNumber || null,
      iban: input.iban || null,
      swiftCode: input.swiftCode || null,
      paymentMethod: input.paymentMethod || "bank_transfer",
      currency: input.currency || employee.currency || "SAR",
      notes: input.notes || null,
    };

    if (latest && toIsoDate(latest.effectiveDate) === toIsoDate(effectiveDate)) {
      const updated = await tx.employeeSalaryRecord.update({
        where: { id: latest.id },
        data: payload,
      });

      await tx.employee.update({
        where: { id: input.employeeId },
        data: {
          baseSalary: new Prisma.Decimal(input.basicSalary),
          currency: payload.currency,
        },
      });

      return updated;
    }

    if (latest && latest.endDate == null && toIsoDate(effectiveDate) > toIsoDate(latest.effectiveDate)) {
      const previousEndDate = new Date(effectiveDate);
      previousEndDate.setUTCDate(previousEndDate.getUTCDate() - 1);

      await tx.employeeSalaryRecord.update({
        where: { id: latest.id },
        data: { endDate: previousEndDate },
      });
    }

    const created = await tx.employeeSalaryRecord.create({
      data: {
        tenantId: input.tenantId,
        employeeId: input.employeeId,
        ...payload,
      },
    });

    await tx.employee.update({
      where: { id: input.employeeId },
      data: {
        baseSalary: new Prisma.Decimal(input.basicSalary),
        currency: payload.currency,
      },
    });

    return created;
  });

  return { salary: mapSalaryRecord(saved as SalaryRecordRow) };
}