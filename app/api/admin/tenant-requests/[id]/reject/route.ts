import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

function mapRequest(r: any) {
  return {
    id: r.id,
    companyName: r.companyName,
    companyNameAr: r.companyNameAr,
    contactName: r.contactName,
    contactEmail: r.contactEmail,
    contactPhone: r.contactPhone,
    employeesCount: r.employeeCount,
    status: r.status === "PENDING" ? "pending" : r.status === "APPROVED" ? "approved" : "rejected",
    createdAt: r.createdAt,
    message: r.message
  };
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const item = await prisma.tenantRequest.findUnique({ where: { id } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (item.status !== "PENDING") {
    return NextResponse.json({ error: "Request already processed" }, { status: 400 });
  }

  let reason = "";
  try {
    const body = await req.json();
    if (typeof body?.reason === "string") reason = body.reason;
  } catch {
    // ignore
  }

  const updated = await prisma.tenantRequest.update({
    where: { id },
    data: {
      status: "REJECTED",
      processedAt: new Date(),
      processedById: session.user.id ?? null,
      rejectionReason: reason || null
    }
  });

  return NextResponse.json({ data: mapRequest(updated) });
}
