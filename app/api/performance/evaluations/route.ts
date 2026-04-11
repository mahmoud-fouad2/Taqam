import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function mapEvaluationStatus(status: string): string {
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
    const cycleId = searchParams.get("cycleId");
    const status = searchParams.get("status");

    const where: any = { tenantId };
    if (cycleId) where.cycleId = cycleId;
    if (status && status !== "all") {
      where.status = status.toUpperCase().replace(/-/g, "_");
    }

    const evaluations = await prisma.employeeEvaluation.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        employee: {
          select: {
            id: true,
            employeeNumber: true,
            firstName: true,
            lastName: true,
            firstNameAr: true,
            lastNameAr: true,
            avatar: true,
            department: { select: { name: true, nameAr: true } },
            jobTitle: { select: { name: true, nameAr: true } }
          }
        },
        evaluator: {
          select: {
            firstName: true,
            lastName: true,
            firstNameAr: true,
            lastNameAr: true
          }
        },
        cycle: { select: { name: true, nameAr: true } }
      }
    });

    return NextResponse.json({
      data: evaluations.map((e) => ({
        id: e.id,
        cycleId: e.cycleId,
        cycleName: e.cycle.nameAr || e.cycle.name,
        employeeId: e.employeeId,
        employeeName: `${e.employee.firstNameAr || e.employee.firstName} ${e.employee.lastNameAr || e.employee.lastName}`,
        employeeNumber: e.employee.employeeNumber,
        employeeAvatar: e.employee.avatar ?? undefined,
        department: e.employee.department?.nameAr || e.employee.department?.name || "-",
        jobTitle: e.employee.jobTitle?.nameAr || e.employee.jobTitle?.name || "-",
        evaluatorId: e.evaluatorId ?? undefined,
        evaluatorName: e.evaluator
          ? `${e.evaluator.firstNameAr || e.evaluator.firstName} ${e.evaluator.lastNameAr || e.evaluator.lastName}`
          : undefined,
        status: mapEvaluationStatus(e.status),
        overallScore: e.overallScore ? Number(e.overallScore.toString()) : undefined,
        overallRating: e.overallRating ?? undefined,
        scores: e.scores as any,
        strengths: e.strengths ?? undefined,
        areasForImprovement: e.areasForImprovement ?? undefined,
        comments: e.comments ?? undefined,
        employeeComments: e.employeeComments ?? undefined,
        submittedAt: e.submittedAt ? e.submittedAt.toISOString() : undefined,
        reviewedAt: e.reviewedAt ? e.reviewedAt.toISOString() : undefined,
        createdAt: e.createdAt.toISOString()
      }))
    });
  } catch (error) {
    console.error("Error fetching evaluations:", error);
    return NextResponse.json({ error: "Failed to fetch evaluations" }, { status: 500 });
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

    const evaluation = await prisma.employeeEvaluation.create({
      data: {
        tenantId,
        cycleId: body.cycleId,
        employeeId: body.employeeId,
        evaluatorId: body.evaluatorId || null,
        status: "NOT_STARTED",
        scores: body.scores || []
      }
    });

    return NextResponse.json({ data: { id: evaluation.id } }, { status: 201 });
  } catch (error) {
    console.error("Error creating evaluation:", error);
    return NextResponse.json({ error: "Failed to create evaluation" }, { status: 500 });
  }
}
