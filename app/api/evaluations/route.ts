import { logApiError } from "@/lib/api/route-helper";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { z } from "zod";

// Validation schema
const evaluationSchema = z.object({
  cycleId: z.string().min(1, "دورة التقييم مطلوبة"),
  employeeId: z.string().min(1, "الموظف مطلوب"),
  evaluatorId: z.string().optional().nullable(),
  scores: z
    .array(
      z.object({
        criteriaId: z.string(),
        criteriaName: z.string(),
        score: z.number().min(0).max(5),
        weight: z.number().optional(),
        comment: z.string().optional()
      })
    )
    .optional()
    .default([]),
  strengths: z.string().optional().nullable(),
  areasForImprovement: z.string().optional().nullable(),
  comments: z.string().optional().nullable()
});

// GET - Get all evaluations
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    const { searchParams } = new URL(request.url);

    const cycleId = searchParams.get("cycleId");
    const employeeId = searchParams.get("employeeId");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { tenantId };

    if (cycleId) where.cycleId = cycleId;
    if (employeeId) where.employeeId = employeeId;
    if (status) where.status = status;

    // Get evaluations
    const [evaluations, total] = await Promise.all([
      prisma.employeeEvaluation.findMany({
        where,
        include: {
          cycle: {
            select: {
              id: true,
              name: true,
              nameAr: true,
              startDate: true,
              endDate: true,
              status: true
            }
          },
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              firstNameAr: true,
              lastNameAr: true,
              employeeNumber: true,
              avatar: true,
              department: { select: { name: true, nameAr: true } },
              jobTitle: { select: { name: true, nameAr: true } }
            }
          },
          evaluator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              firstNameAr: true,
              lastNameAr: true
            }
          }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      }),
      prisma.employeeEvaluation.count({ where })
    ]);

    // Stats
    const [stats, acknowledgedCount] = await Promise.all([
      prisma.employeeEvaluation.groupBy({
        by: ["status"],
        where: { tenantId },
        _count: { _all: true }
      }),
      prisma.employeeEvaluation.count({
        where: { tenantId, employeeAcknowledgedAt: { not: null } }
      })
    ]);

    return NextResponse.json({
      evaluations,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      stats: {
        notStarted: stats.find((s) => s.status === "NOT_STARTED")?._count._all ?? 0,
        inProgress: stats.find((s) => s.status === "IN_PROGRESS")?._count._all ?? 0,
        completed: stats.find((s) => s.status === "COMPLETED")?._count._all ?? 0,
        acknowledged: acknowledgedCount
      }
    });
  } catch (error) {
    logApiError("Error fetching evaluations", error);
    return NextResponse.json({ error: "حدث خطأ في جلب التقييمات" }, { status: 500 });
  }
}

// POST - Create new evaluation
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    const body = await request.json();

    // Validate
    const validatedData = evaluationSchema.parse(body);

    // Verify cycle exists and is active
    const cycle = await prisma.evaluationCycle.findFirst({
      where: { id: validatedData.cycleId, tenantId }
    });

    if (!cycle) {
      return NextResponse.json({ error: "دورة التقييم غير موجودة" }, { status: 400 });
    }

    if (cycle.status !== "ACTIVE" && cycle.status !== "DRAFT") {
      return NextResponse.json(
        { error: "لا يمكن إضافة تقييمات لدورة مكتملة أو ملغاة" },
        { status: 400 }
      );
    }

    // Verify employee belongs to tenant
    const employee = await prisma.employee.findFirst({
      where: { id: validatedData.employeeId, tenantId }
    });

    if (!employee) {
      return NextResponse.json({ error: "الموظف غير موجود" }, { status: 400 });
    }

    // Check if evaluation already exists for this cycle/employee
    const existing = await prisma.employeeEvaluation.findFirst({
      where: {
        tenantId,
        cycleId: validatedData.cycleId,
        employeeId: validatedData.employeeId
      }
    });

    if (existing) {
      return NextResponse.json(
        { error: "يوجد تقييم مسبق لهذا الموظف في هذه الدورة" },
        { status: 400 }
      );
    }

    // Create evaluation
    const evaluation = await prisma.employeeEvaluation.create({
      data: {
        tenantId,
        cycleId: validatedData.cycleId,
        employeeId: validatedData.employeeId,
        evaluatorId: validatedData.evaluatorId,
        scores: validatedData.scores,
        strengths: validatedData.strengths,
        areasForImprovement: validatedData.areasForImprovement,
        comments: validatedData.comments,
        status: "NOT_STARTED"
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            firstNameAr: true,
            lastNameAr: true
          }
        }
      }
    });

    return NextResponse.json(
      {
        message: "تم إنشاء التقييم بنجاح",
        evaluation
      },
      { status: 201 }
    );
  } catch (error) {
    logApiError("Error creating evaluation", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "بيانات غير صالحة", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "حدث خطأ في إنشاء التقييم" }, { status: 500 });
  }
}
