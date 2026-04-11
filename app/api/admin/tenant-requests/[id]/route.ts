import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const item = await prisma.tenantRequest.findUnique({ where: { id } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    data: {
      id: item.id,
      companyName: item.companyName,
      companyNameAr: item.companyNameAr,
      contactName: item.contactName,
      contactEmail: item.contactEmail,
      contactPhone: item.contactPhone,
      employeesCount: item.employeeCount,
      status:
        item.status === "PENDING"
          ? "pending"
          : item.status === "APPROVED"
            ? "approved"
            : "rejected",
      createdAt: item.createdAt,
      message: item.message
    }
  });
}
