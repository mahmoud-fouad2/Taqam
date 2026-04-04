import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function mapCycleStatus(status: string): string {
  return status.toLowerCase().replace(/_/g, "-");
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant required" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where: any = { tenantId };
    if (status && status !== "all") {
      where.status = status.toUpperCase().replace(/-/g, "_");
    }

    const cycles = await prisma.evaluationCycle.findMany({
      where,
      orderBy: { startDate: "desc" },
      include: {
        _count: { select: { evaluations: true } },
        evaluations: {
          select: { status: true },
        },
      },
    });

    return NextResponse.json({
      data: cycles.map((c) => ({
        id: c.id,
        name: c.nameAr || c.name,
        nameEn: c.name,
        description: c.description ?? undefined,
        startDate: c.startDate.toISOString().split("T")[0],
        endDate: c.endDate.toISOString().split("T")[0],
        reviewDeadline: c.reviewDeadline ? c.reviewDeadline.toISOString().split("T")[0] : undefined,
        status: mapCycleStatus(c.status),
        templateId: c.templateId ?? undefined,
        totalEvaluations: c._count.evaluations,
        completedEvaluations: c.evaluations.filter((evaluation) => evaluation.status === "COMPLETED").length,
        targetDepartments: c.targetDepartments,
        targetEmployees: c.targetEmployees,
        createdAt: c.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Error fetching evaluation cycles:", error);
    return NextResponse.json({ error: "Failed to fetch evaluation cycles" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant required" }, { status: 400 });
    }

    const body = await request.json();

    const cycle = await prisma.evaluationCycle.create({
      data: {
        tenantId,
        name: body.nameEn || body.name,
        nameAr: body.name,
        description: body.description,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        reviewDeadline: body.reviewDeadline ? new Date(body.reviewDeadline) : null,
        status: (body.status || "draft").toUpperCase().replace(/-/g, "_"),
        templateId: body.templateId || null,
        targetDepartments: body.targetDepartments || [],
        targetEmployees: body.targetEmployees || [],
        createdByUserId: session.user.id || null,
      },
    });

    return NextResponse.json({ data: { id: cycle.id } }, { status: 201 });
  } catch (error) {
    console.error("Error creating evaluation cycle:", error);
    return NextResponse.json({ error: "Failed to create evaluation cycle" }, { status: 500 });
  }
}
