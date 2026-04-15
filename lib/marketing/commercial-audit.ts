import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";

function normalizeAuditData(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? null)) as Prisma.InputJsonValue;
}

export async function logCommercialAuditEntry({
  userId,
  action,
  entity,
  entityId,
  oldData,
  newData
}: {
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  oldData?: unknown;
  newData?: unknown;
}) {
  await prisma.auditLog.create({
    data: {
      userId,
      action,
      entity,
      entityId,
      ...(oldData !== undefined ? { oldData: normalizeAuditData(oldData) } : {}),
      ...(newData !== undefined ? { newData: normalizeAuditData(newData) } : {})
    }
  });
}
