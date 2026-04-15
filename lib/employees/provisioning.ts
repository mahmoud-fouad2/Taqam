import type { Prisma } from "@prisma/client";

type EmployeeProvisioningClient = {
  $queryRaw<T = unknown>(
    query: TemplateStringsArray | Prisma.Sql,
    ...values: unknown[]
  ): Promise<T>;
  employee: {
    findMany(args: unknown): Promise<Array<{ employeeNumber: string }>>;
  };
  department: {
    findFirst(args: unknown): Promise<{ id: string } | null>;
    create(args: unknown): Promise<{ id: string }>;
  };
};

export async function allocateNextEmployeeNumber(
  client: EmployeeProvisioningClient,
  tenantId: string
) {
  let nextNumber: string;

  try {
    const maxNumeric = await client.$queryRaw<Array<{ max: number | null }>>`
      SELECT MAX(CAST("employeeNumber" AS INT)) as max
      FROM "Employee"
      WHERE "tenantId" = ${tenantId}
        AND "employeeNumber" ~ '^[0-9]+$'
    `;

    const currentMax = maxNumeric?.[0]?.max ?? 0;
    nextNumber = String(currentMax + 1).padStart(6, "0");
  } catch {
    const rows = await client.employee.findMany({
      where: { tenantId },
      select: { employeeNumber: true },
      take: 2000
    });

    let max = 0;
    for (const row of rows) {
      const value = row.employeeNumber;
      if (typeof value === "string" && /^\d+$/.test(value)) {
        const parsed = Number.parseInt(value, 10);
        if (Number.isFinite(parsed) && parsed > max) {
          max = parsed;
        }
      }
    }

    nextNumber = String(max + 1).padStart(6, "0");
  }

  return nextNumber;
}

export async function findOrCreateDefaultDepartmentId(
  client: EmployeeProvisioningClient,
  tenantId: string
) {
  const existingDepartment = await client.department.findFirst({
    where: {
      tenantId,
      isActive: true
    },
    orderBy: [{ createdAt: "asc" }],
    select: { id: true }
  });

  if (existingDepartment) {
    return existingDepartment.id;
  }

  const department = await client.department.create({
    data: {
      tenantId,
      name: "General",
      nameAr: "إدارة عامة",
      code: "GEN",
      isActive: true
    },
    select: { id: true }
  });

  return department.id;
}
