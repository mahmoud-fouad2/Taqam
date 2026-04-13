import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

function mapPlan(plan: string) {
  if (plan === "ENTERPRISE") return "enterprise" as const;
  if (plan === "PROFESSIONAL") return "business" as const;
  if (plan === "BASIC") return "starter" as const;
  return "trial" as const;
}

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

  // Shape the response to match the UI table expectation (SubscriptionRequest).
  const data = items.map((r) => ({
    id: r.id,
    companyName: r.companyName,
    companyNameAr: r.companyNameAr,
    contactName: r.contactName,
    contactEmail: r.contactEmail,
    contactPhone: r.contactPhone,
    employeesCount: r.employeeCount,
    plan: mapPlan(r.plan),
    status: r.status === "PENDING" ? "pending" : r.status === "APPROVED" ? "approved" : "rejected",
    createdAt: r.createdAt,
    reviewedAt: r.processedAt,
    tenantId: r.tenantId,
    message: r.message
  }));

  return NextResponse.json({ data });
}
