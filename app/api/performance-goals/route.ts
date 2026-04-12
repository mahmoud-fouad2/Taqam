import { logApiError } from "@/lib/api/route-helper";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import type { GoalStatus } from "@prisma/client";
import { z } from "zod";

// Validation schema
const goalSchema = z.object({
  employeeId: z.string().min(1, "الموظف مطلوب"),
  title: z.string().min(2, "عنوان الهدف مطلوب"),
  titleAr: z.string().optional().nullable(),
  description: z.string().min(2, "وصف الهدف مطلوب"),
  category: z.string().default("performance"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  // Prisma enum `GoalStatus` doesn't include PENDING; accept it as alias for ACTIVE.
  status: z
    .enum(["DRAFT", "ACTIVE", "IN_PROGRESS", "COMPLETED", "CANCELLED", "OVERDUE", "PENDING"])
    .optional(),
  targetValue: z.string().optional().nullable(),
  currentValue: z.string().optional().nullable(),
  unit: z.string().optional().nullable(),
  startDate: z.string().or(z.date()),
  dueDate: z.string().or(z.date()),
  managerId: z.string().optional().nullable(),
  notes: z.string().optional().nullable()
});

// GET - Get all goals
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    const { searchParams } = new URL(request.url);

    // Filters
    const employeeId = searchParams.get("employeeId");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { tenantId };

    if (employeeId) {
      where.employeeId = employeeId;
    }

    if (status) {
      where.status = status === "PENDING" ? "ACTIVE" : status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { titleAr: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } }
      ];
    }

    // Get goals with pagination
    const [goals, total] = await Promise.all([
      prisma.performanceGoal.findMany({
        where,
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              firstNameAr: true,
              lastNameAr: true,
              employeeNumber: true,
              avatar: true,
              department: { select: { name: true, nameAr: true } }
            }
          },
          manager: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              firstNameAr: true,
              lastNameAr: true
            }
          }
        },
        orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
        skip,
        take: limit
      }),
      prisma.performanceGoal.count({ where })
    ]);

    // Stats
    const stats = await prisma.performanceGoal.groupBy({
      by: ["status"],
      where: { tenantId },
      _count: { _all: true }
    });

    const statusCounts = {
      draft: stats.find((s) => s.status === "DRAFT")?._count._all ?? 0,
      active: stats.find((s) => s.status === "ACTIVE")?._count._all ?? 0,
      // Backwards-compat alias
      pending: stats.find((s) => s.status === "ACTIVE")?._count._all ?? 0,
      inProgress: stats.find((s) => s.status === "IN_PROGRESS")?._count._all ?? 0,
      completed: stats.find((s) => s.status === "COMPLETED")?._count._all ?? 0,
      cancelled: stats.find((s) => s.status === "CANCELLED")?._count._all ?? 0,
      overdue: stats.find((s) => s.status === "OVERDUE")?._count._all ?? 0
    };

    return NextResponse.json({
      goals,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      stats: statusCounts
    });
  } catch (error) {
    logApiError("Error fetching goals", error);
    return NextResponse.json({ error: "حدث خطأ في جلب الأهداف" }, { status: 500 });
  }
}

// POST - Create new goal
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    const body = await request.json();

    // Validate
    const validatedData = goalSchema.parse(body);

    const statusToPersist: GoalStatus =
      validatedData.status === "PENDING" ? "ACTIVE" : (validatedData.status ?? "DRAFT");

    // Verify employee belongs to tenant
    const employee = await prisma.employee.findFirst({
      where: { id: validatedData.employeeId, tenantId }
    });

    if (!employee) {
      return NextResponse.json({ error: "الموظف غير موجود" }, { status: 400 });
    }

    // If manager specified, verify they belong to tenant
    if (validatedData.managerId) {
      const manager = await prisma.employee.findFirst({
        where: { id: validatedData.managerId, tenantId }
      });
      if (!manager) {
        return NextResponse.json({ error: "المدير المحدد غير موجود" }, { status: 400 });
      }
    }

    // Create goal
    const goal = await prisma.performanceGoal.create({
      data: {
        tenantId,
        employeeId: validatedData.employeeId,
        title: validatedData.title,
        titleAr: validatedData.titleAr,
        description: validatedData.description,
        category: validatedData.category,
        priority: validatedData.priority,
        status: statusToPersist,
        targetValue: validatedData.targetValue,
        currentValue: validatedData.currentValue,
        unit: validatedData.unit,
        startDate: new Date(validatedData.startDate),
        dueDate: new Date(validatedData.dueDate),
        managerId: validatedData.managerId,
        notes: validatedData.notes,
        progress: 0
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
        message: "تم إضافة الهدف بنجاح",
        goal
      },
      { status: 201 }
    );
  } catch (error) {
    logApiError("Error creating goal", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "بيانات غير صالحة", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "حدث خطأ في إضافة الهدف" }, { status: 500 });
  }
}
