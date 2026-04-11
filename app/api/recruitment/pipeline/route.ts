import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

function kebab(value: string) {
  return value.toLowerCase().replace(/_/g, "-");
}

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const grouped = await prisma.applicant.groupBy({
      by: ["status"],
      where: { tenantId: session.user.tenantId },
      _count: { _all: true }
    });

    const counts = new Map<string, number>();
    for (const row of grouped) {
      counts.set(kebab(row.status), row._count._all);
    }

    // Keep a stable pipeline order for UI.
    // NOTE: Frontend type includes some stages not in DB (assessment/hired) so we return them as 0.
    const stages = [
      "new",
      "screening",
      "shortlisted",
      "interview",
      "assessment",
      "offer",
      "accepted",
      "hired",
      "rejected",
      "withdrawn"
    ] as const;

    const total = stages.reduce((sum, s) => sum + (counts.get(s) ?? 0), 0);

    const pipeline = stages.map((stage) => {
      const count = counts.get(stage) ?? 0;
      const percentage = total > 0 ? Math.round((count / total) * 1000) / 10 : 0;
      return { stage, count, percentage };
    });

    return NextResponse.json(pipeline);
  } catch (error) {
    console.error("Error fetching recruitment pipeline:", error);
    return NextResponse.json({ error: "فشل في جلب مسار التوظيف" }, { status: 500 });
  }
}
