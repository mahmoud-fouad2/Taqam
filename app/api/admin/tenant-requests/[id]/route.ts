import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { mapTenantRequestFromDb } from "@/lib/tenant-request-mapping";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const item = await prisma.tenantRequest.findUnique({ where: { id } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const tenantSnapshot = item.tenantId
    ? await prisma.tenant.findUnique({
        where: { id: item.tenantId },
        select: { status: true, setupCompletedAt: true }
      })
    : null;

  return NextResponse.json({
    data: mapTenantRequestFromDb({
      ...item,
      tenant: tenantSnapshot
        ? {
            status: tenantSnapshot.status,
            setupCompletedAt: tenantSnapshot.setupCompletedAt
          }
        : null
    })
  });
}
