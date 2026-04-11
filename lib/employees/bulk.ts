import { z } from "zod";
import prisma from "@/lib/db";

export const employeeBulkInputSchema = z
  .object({
    employeeNumber: z.string().trim().min(1).optional(),
    firstName: z.string().trim().min(1),
    lastName: z.string().trim().min(1),
    firstNameAr: z.string().trim().min(1).optional(),
    lastNameAr: z.string().trim().min(1).optional(),
    email: z.string().trim().email(),
    phone: z.string().trim().min(3).optional(),
    nationalId: z.string().trim().min(3).optional(),

    dateOfBirth: z.coerce.date().optional(),
    gender: z.string().optional(),
    nationality: z.string().trim().min(1).optional(),
    maritalStatus: z.string().optional(),

    departmentId: z.string().trim().min(1).optional(),
    jobTitleId: z.string().trim().min(1).optional(),
    managerId: z.string().trim().min(1).optional(),
    branchId: z.string().trim().min(1).optional(),

    hireDate: z.coerce.date(),
    employmentType: z.string().optional(),
    status: z.string().optional(),

    shiftId: z.string().trim().min(1).optional(),
    workLocation: z.string().trim().min(1).optional(),

    baseSalary: z.union([z.number(), z.string()]).optional(),
    currency: z.string().trim().min(1).optional()
  })
  .strict();

export const bulkEmployeesSchema = z
  .object({
    tenantId: z.string().trim().min(1).optional(),
    dryRun: z.boolean().optional().default(false),
    atomic: z.boolean().optional().default(false),
    employees: z.array(employeeBulkInputSchema).min(1).max(500)
  })
  .strict();

export type EmployeeBulkInput = z.infer<typeof employeeBulkInputSchema>;

export type PreparedEmployeeCreate = {
  tenantId: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  firstNameAr: string | null;
  lastNameAr: string | null;
  email: string;
  phone: string | null;
  nationalId: string | null;
  dateOfBirth: Date | null;
  gender: any | null;
  nationality: string | null;
  maritalStatus: any | null;
  departmentId: string | null;
  jobTitleId: string | null;
  managerId: string | null;
  branchId: string | null;
  hireDate: Date;
  employmentType: any;
  status: any;
  shiftId: string | null;
  workLocation: string | null;
  baseSalary: any | null;
  currency: string;
};

export type BulkInsertSummary = {
  total: number;
  atomic: boolean;
  success: number;
  failed: number;
  errors: Array<{ index: number; employeeNumber: string; message: string }>;
  created: Array<{ index: number; id: string; employeeNumber: string }>;
};

export function deriveNumericEmployeeNumber(lastNumeric: number, offset: number) {
  return String(lastNumeric + offset).padStart(6, "0");
}

export function parseLastNumericEmployeeNumber(value: string | null | undefined): number {
  if (!value) return 0;
  if (!/^\d+$/.test(value)) return 0;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : 0;
}

export async function prepareEmployeesForInsert(args: {
  tenantId: string;
  employees: EmployeeBulkInput[];
}): Promise<PreparedEmployeeCreate[]> {
  const { tenantId, employees } = args;

  const lastEmployee = await prisma.employee.findFirst({
    where: { tenantId },
    orderBy: { employeeNumber: "desc" },
    select: { employeeNumber: true }
  });

  const lastNumeric = parseLastNumericEmployeeNumber(lastEmployee?.employeeNumber);

  let autoOffset = 0;
  const prepared = employees.map((e) => {
    let employeeNumber = e.employeeNumber;
    if (!employeeNumber) {
      autoOffset += 1;
      employeeNumber = deriveNumericEmployeeNumber(lastNumeric, autoOffset);
    }

    return {
      tenantId,
      employeeNumber,
      firstName: e.firstName,
      lastName: e.lastName,
      firstNameAr: e.firstNameAr ?? null,
      lastNameAr: e.lastNameAr ?? null,
      email: e.email,
      phone: e.phone ?? null,
      nationalId: e.nationalId ?? null,
      dateOfBirth: e.dateOfBirth ?? null,
      gender: (e.gender as any) ?? null,
      nationality: e.nationality ?? null,
      maritalStatus: (e.maritalStatus as any) ?? null,
      departmentId: e.departmentId ?? null,
      jobTitleId: e.jobTitleId ?? null,
      managerId: e.managerId ?? null,
      branchId: e.branchId ?? null,
      hireDate: e.hireDate,
      employmentType: (e.employmentType as any) ?? "FULL_TIME",
      status: (e.status as any) ?? "ACTIVE",
      shiftId: e.shiftId ?? null,
      workLocation: e.workLocation ?? null,
      baseSalary: (e.baseSalary as any) ?? null,
      currency: e.currency ?? "SAR"
    };
  });

  // Basic duplicate detection within request
  const seen = new Set<string>();
  const dupes: string[] = [];
  for (const r of prepared) {
    const key = r.employeeNumber;
    if (seen.has(key)) dupes.push(key);
    seen.add(key);
  }
  if (dupes.length > 0) {
    const err = new Error("Duplicate employeeNumber in request");
    (err as any).duplicates = dupes;
    throw err;
  }

  return prepared;
}

export async function insertPreparedEmployees(args: {
  prepared: PreparedEmployeeCreate[];
  atomic: boolean;
}): Promise<BulkInsertSummary> {
  const { prepared, atomic } = args;

  const summary: BulkInsertSummary = {
    total: prepared.length,
    atomic,
    success: 0,
    failed: 0,
    errors: [],
    created: []
  };

  if (prepared.length === 0) return summary;

  if (atomic) {
    const created = await prisma.$transaction(
      prepared.map((r) =>
        prisma.employee.create({
          data: r as any,
          select: { id: true, employeeNumber: true }
        })
      )
    );

    summary.success = created.length;
    summary.created = created.map((c, index) => ({
      index,
      id: c.id,
      employeeNumber: c.employeeNumber
    }));

    return summary;
  }

  for (let i = 0; i < prepared.length; i++) {
    const r = prepared[i];
    try {
      const created = await prisma.employee.create({
        data: r as any,
        select: { id: true, employeeNumber: true }
      });
      summary.success += 1;
      summary.created.push({ index: i, id: created.id, employeeNumber: created.employeeNumber });
    } catch (e: any) {
      summary.failed += 1;
      summary.errors.push({
        index: i,
        employeeNumber: r.employeeNumber,
        message: e?.message ?? "Create failed"
      });
    }
  }

  return summary;
}
