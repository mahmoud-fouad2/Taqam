import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { z } from "zod";

// Validation schema
const onboardingProcessSchema = z.object({
  employeeId: z.string().min(1, "الموظف مطلوب"),
  templateId: z.string().optional().nullable(),
  startDate: z.string().or(z.date()).optional(),
  tasks: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        description: z.string().optional(),
        category: z.string().optional(),
        dueDate: z.string().optional(),
        assigneeId: z.string().optional(),
        isCompleted: z.boolean().default(false),
        completedAt: z.string().optional().nullable()
      })
    )
    .optional()
    .default([]),
  documents: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        type: z.string().optional(),
        isRequired: z.boolean().default(false),
        isSubmitted: z.boolean().default(false),
        submittedAt: z.string().optional().nullable(),
        fileUrl: z.string().optional()
      })
    )
    .optional()
    .default([])
});

// GET - Get all onboarding processes
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    const { searchParams } = new URL(request.url);

    const employeeId = searchParams.get("employeeId");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { tenantId };

    if (employeeId) where.employeeId = employeeId;
    if (status) where.status = status === "CANCELLED" ? "DELAYED" : status;

    // Get processes
    const [processes, total] = await Promise.all([
      prisma.onboardingProcess.findMany({
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
              hireDate: true,
              department: { select: { name: true, nameAr: true } },
              jobTitle: { select: { name: true, nameAr: true } }
            }
          },
          template: {
            select: {
              id: true,
              name: true,
              durationDays: true
            }
          },
          createdBy: {
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
      prisma.onboardingProcess.count({ where })
    ]);

    // Stats
    const stats = await prisma.onboardingProcess.groupBy({
      by: ["status"],
      where: { tenantId },
      _count: { _all: true }
    });

    const delayedCount = stats.find((s) => s.status === "DELAYED")?._count._all ?? 0;

    return NextResponse.json({
      processes,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      stats: {
        notStarted: stats.find((s) => s.status === "NOT_STARTED")?._count._all ?? 0,
        inProgress: stats.find((s) => s.status === "IN_PROGRESS")?._count._all ?? 0,
        completed: stats.find((s) => s.status === "COMPLETED")?._count._all ?? 0,
        delayed: delayedCount,
        // Backwards-compat alias (old UI expects CANCELLED)
        cancelled: delayedCount
      }
    });
  } catch (error) {
    console.error("Error fetching onboarding processes:", error);
    return NextResponse.json({ error: "حدث خطأ في جلب عمليات التأهيل" }, { status: 500 });
  }
}

// POST - Create new onboarding process
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    const body = await request.json();

    // Validate
    const validatedData = onboardingProcessSchema.parse(body);

    // Verify employee belongs to tenant
    const employee = await prisma.employee.findFirst({
      where: { id: validatedData.employeeId, tenantId }
    });

    if (!employee) {
      return NextResponse.json({ error: "الموظف غير موجود" }, { status: 400 });
    }

    // Check if process already exists for employee
    const existing = await prisma.onboardingProcess.findFirst({
      where: {
        tenantId,
        employeeId: validatedData.employeeId,
        status: { not: "COMPLETED" }
      }
    });

    if (existing) {
      return NextResponse.json({ error: "يوجد برنامج تأهيل نشط لهذا الموظف" }, { status: 400 });
    }

    // If template specified, get its tasks and documents
    let tasks = validatedData.tasks;
    let documents = validatedData.documents;

    if (validatedData.templateId) {
      const template = await prisma.onboardingTemplate.findFirst({
        where: { id: validatedData.templateId, tenantId }
      });

      if (template) {
        // Use template's tasks and documents if not provided
        if (!tasks || tasks.length === 0) {
          tasks = (template.tasks as any) || [];
        }
        if (!documents || documents.length === 0) {
          documents = (template.documents as any) || [];
        }
      }
    }

    // Create process
    const process = await prisma.onboardingProcess.create({
      data: {
        tenantId,
        employeeId: validatedData.employeeId,
        templateId: validatedData.templateId,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : new Date(),
        status: "NOT_STARTED",
        progress: 0,
        tasks,
        documents,
        createdById: session.user.id
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
        message: "تم إنشاء برنامج التأهيل بنجاح",
        process
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating onboarding process:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "بيانات غير صالحة", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "حدث خطأ في إنشاء برنامج التأهيل" }, { status: 500 });
  }
}
