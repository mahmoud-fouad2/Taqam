import prisma from "@/lib/db";

export async function validateEmployeeManagerAssignment(params: {
  tenantId: string;
  employeeId?: string;
  managerId?: string | null;
}) {
  const { tenantId, employeeId, managerId } = params;

  if (!managerId) {
    return { ok: true as const };
  }

  if (employeeId && managerId === employeeId) {
    return {
      ok: false as const,
      error: "Employee cannot be their own manager"
    };
  }

  const manager = await prisma.employee.findFirst({
    where: {
      id: managerId,
      tenantId,
      deletedAt: null
    },
    select: {
      managerId: true
    }
  });

  if (!manager) {
    return {
      ok: false as const,
      error: "Manager not found"
    };
  }

  const visited = new Set<string>([managerId]);
  let currentManagerId = manager.managerId ?? undefined;

  while (currentManagerId) {
    if (employeeId && currentManagerId === employeeId) {
      return {
        ok: false as const,
        error: "Circular manager hierarchy is not allowed"
      };
    }

    if (visited.has(currentManagerId)) {
      break;
    }

    visited.add(currentManagerId);

    const current = await prisma.employee.findFirst({
      where: {
        id: currentManagerId,
        tenantId,
        deletedAt: null
      },
      select: {
        managerId: true
      }
    });

    if (!current) {
      break;
    }

    currentManagerId = current.managerId ?? undefined;
  }

  return { ok: true as const };
}
