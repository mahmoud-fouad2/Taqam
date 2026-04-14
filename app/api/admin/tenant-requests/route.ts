import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { mapTenantRequestFromDb } from "@/lib/tenant-request-mapping";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const status = url.searchParams.get("status");

  const items = await prisma.tenantRequest.findMany({
    where: status
      ? {
          status: status.toUpperCase() as any
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 200
  });

  const tenantIds = items.flatMap((item) => (item.tenantId ? [item.tenantId] : []));
  const tenantSnapshots =
    tenantIds.length > 0
      ? await prisma.tenant.findMany({
          where: { id: { in: tenantIds } },
          select: { id: true, status: true, setupCompletedAt: true }
        })
      : [];
  const tenantSnapshotMap = new Map(
    tenantSnapshots.map((tenant) => [
      tenant.id,
      {
        status: tenant.status,
        setupCompletedAt: tenant.setupCompletedAt
      }
    ])
  );

  const data = items.map((item) =>
    mapTenantRequestFromDb({
      ...item,
      tenant: item.tenantId ? (tenantSnapshotMap.get(item.tenantId) ?? null) : null
    })
  );

  return NextResponse.json({ data });
}
