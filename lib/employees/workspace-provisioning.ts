import { EmploymentType, type Prisma } from "@prisma/client";

import {
  allocateNextEmployeeNumber,
  findOrCreateDefaultDepartmentId
} from "@/lib/employees/provisioning";
import {
  ensureTenantJobTitleCatalog,
  getDefaultJobTitleCodeForUserRole
} from "@/lib/hr/job-title-catalog";
import type { PrismaTransactionClient } from "@/lib/db";

export type EmployeeProvisioningClient = Pick<
  PrismaTransactionClient,
  "$queryRaw" | "department" | "employee" | "jobTitle"
>;

export type EmployeeWorkspaceProvisioningInput = {
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  role?: string | null;
  userId?: string | null;
};

export type EmployeeWorkspaceProvisioningResult = {
  employeeId: string;
  action: "existing" | "linked" | "created";
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function resolveDefaultJobTitleId(
  client: EmployeeProvisioningClient,
  tenantId: string,
  role?: string | null
) {
  const preferredJobTitleCode = getDefaultJobTitleCodeForUserRole(role);

  const defaultJobTitle =
    (await client.jobTitle.findFirst({
      where: {
        tenantId,
        code: preferredJobTitleCode,
        isActive: true
      },
      select: { id: true }
    })) ||
    (await client.jobTitle.findFirst({
      where: {
        tenantId,
        code: "EMPLOYEE",
        isActive: true
      },
      select: { id: true }
    })) ||
    (await client.jobTitle.findFirst({
      where: {
        tenantId,
        isActive: true
      },
      orderBy: [{ level: "asc" }, { name: "asc" }],
      select: { id: true }
    }));

  if (!defaultJobTitle) {
    throw new Error("لا توجد مسميات وظيفية جاهزة لربط المستخدم بملف موظف");
  }

  return defaultJobTitle.id;
}

export async function ensureEmployeeWorkspaceProfile(
  client: EmployeeProvisioningClient,
  input: EmployeeWorkspaceProvisioningInput
): Promise<EmployeeWorkspaceProvisioningResult> {
  const normalizedEmail = normalizeEmail(input.email);

  await ensureTenantJobTitleCatalog(input.tenantId, client);

  if (input.userId) {
    const existingByUser = await client.employee.findUnique({
      where: { userId: input.userId },
      select: { id: true }
    });

    if (existingByUser) {
      return { employeeId: existingByUser.id, action: "existing" };
    }
  }

  const existingByEmail = await client.employee.findFirst({
    where: {
      tenantId: input.tenantId,
      deletedAt: null,
      email: normalizedEmail
    },
    select: {
      id: true,
      userId: true
    }
  });

  if (existingByEmail) {
    if (input.userId && !existingByEmail.userId) {
      const linked = await client.employee.updateMany({
        where: {
          id: existingByEmail.id,
          userId: null,
          deletedAt: null
        },
        data: {
          userId: input.userId
        }
      });

      if (linked.count === 1) {
        return { employeeId: existingByEmail.id, action: "linked" };
      }

      const existingAfterRace = await client.employee.findUnique({
        where: { userId: input.userId },
        select: { id: true }
      });

      if (existingAfterRace) {
        return { employeeId: existingAfterRace.id, action: "existing" };
      }
    }

    return { employeeId: existingByEmail.id, action: "existing" };
  }

  const departmentId = await findOrCreateDefaultDepartmentId(client, input.tenantId);
  const jobTitleId = await resolveDefaultJobTitleId(client, input.tenantId, input.role);
  const nextEmployeeNumber = await allocateNextEmployeeNumber(client, input.tenantId);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = String(Number.parseInt(nextEmployeeNumber, 10) + attempt).padStart(6, "0");

    try {
      const employee = await client.employee.create({
        data: {
          tenantId: input.tenantId,
          userId: input.userId ?? undefined,
          employeeNumber: candidate,
          firstName: input.firstName.trim(),
          lastName: input.lastName.trim(),
          email: normalizedEmail,
          phone: input.phone ?? null,
          departmentId,
          jobTitleId,
          hireDate: new Date(),
          employmentType: EmploymentType.FULL_TIME,
          status: "ACTIVE"
        },
        select: { id: true }
      });

      return { employeeId: employee.id, action: "created" };
    } catch (error) {
      const prismaError = error as { code?: string };

      if (prismaError.code !== "P2002") {
        throw error;
      }

      if (input.userId) {
        const existingAfterConflict = await client.employee.findUnique({
          where: { userId: input.userId },
          select: { id: true }
        });

        if (existingAfterConflict) {
          return { employeeId: existingAfterConflict.id, action: "existing" };
        }
      }
    }
  }

  throw new Error("Failed to allocate employee number");
}
