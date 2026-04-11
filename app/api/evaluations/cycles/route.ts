import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { z } from "zod";

// Validation schema
const evaluationCycleSchema = z.object({
  name: z.string().min(2, "اسم الدورة مطلوب"),
  nameAr: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  reviewDeadline: z.string().or(z.date()).optional().nullable(),
  templateId: z.string().optional().nullable(),
  targetDepartments: z.array(z.string()).optional().default([]),
  targetEmployees: z.array(z.string()).optional().default([])
});

// GET - Get all evaluation cycles
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { tenantId };

    if (status) {
      where.status = status;
    }

    // Get cycles with counts
    const [cycles, total] = await Promise.all([
      prisma.evaluationCycle.findMany({
        where,
        include: {
          _count: {
            select: { evaluations: true }
          },
          evaluations: {
            select: {
              status: true,
              overallScore: true
            }
          },
          createdByUser: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      }),
      prisma.evaluationCycle.count({ where })
    ]);

    // Transform to add stats
    const transformedCycles = cycles.map((cycle) => {
      const completed = cycle.evaluations.filter((e) => e.status === "COMPLETED").length;
      const avgScore =
        cycle.evaluations
          .filter((e) => e.overallScore)
          .reduce((sum, e) => sum + Number(e.overallScore), 0) / (completed || 1);

      return {
        ...cycle,
        totalEvaluations: cycle._count.evaluations,
        completedEvaluations: completed,
        averageScore: completed > 0 ? avgScore.toFixed(2) : null,
        _count: undefined,
        evaluations: undefined
      };
    });

    // Stats
    const stats = await prisma.evaluationCycle.groupBy({
      by: ["status"],
      where: { tenantId },
      _count: true
    });

    return NextResponse.json({
      cycles: transformedCycles,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      stats: {
        draft: stats.find((s) => s.status === "DRAFT")?._count || 0,
        active: stats.find((s) => s.status === "ACTIVE")?._count || 0,
        completed: stats.find((s) => s.status === "COMPLETED")?._count || 0,
        cancelled: stats.find((s) => s.status === "CANCELLED")?._count || 0
      }
    });
  } catch (error) {
    console.error("Error fetching evaluation cycles:", error);
    return NextResponse.json({ error: "حدث خطأ في جلب دورات التقييم" }, { status: 500 });
  }
}

// POST - Create new evaluation cycle
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    // Check permissions
    const allowedRoles = ["TENANT_ADMIN", "SUPER_ADMIN", "HR_MANAGER"];
    if (!allowedRoles.includes(session.user.role || "")) {
      return NextResponse.json({ error: "لا تملك صلاحية إنشاء دورة تقييم" }, { status: 403 });
    }

    const tenantId = session.user.tenantId;
    const body = await request.json();

    // Validate
    const validatedData = evaluationCycleSchema.parse(body);

    // Create cycle
    const cycle = await prisma.evaluationCycle.create({
      data: {
        tenantId,
        name: validatedData.name,
        nameAr: validatedData.nameAr,
        description: validatedData.description,
        startDate: new Date(validatedData.startDate),
        endDate: new Date(validatedData.endDate),
        reviewDeadline: validatedData.reviewDeadline
          ? new Date(validatedData.reviewDeadline)
          : null,
        templateId: validatedData.templateId,
        targetDepartments: validatedData.targetDepartments,
        targetEmployees: validatedData.targetEmployees,
        createdByUserId: session.user.id,
        status: "DRAFT"
      }
    });

    return NextResponse.json(
      {
        message: "تم إنشاء دورة التقييم بنجاح",
        cycle
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating evaluation cycle:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "بيانات غير صالحة", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "حدث خطأ في إنشاء دورة التقييم" }, { status: 500 });
  }
}
