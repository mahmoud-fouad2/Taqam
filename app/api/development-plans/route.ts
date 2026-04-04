import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { z } from "zod";
import { sendNotification } from "@/lib/notifications/send";
import { checkRateLimit, withRateLimitHeaders } from "@/lib/rate-limit";

const objectiveSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional().nullable(),
  targetDate: z.string().optional().nullable(),
  status: z.enum(["not-started", "in-progress", "completed"]).optional(),
  progress: z.number().min(0).max(100).optional(),
  metrics: z.string().optional().nullable(),
  isCompleted: z.boolean().default(false),
  completedAt: z.string().optional().nullable(),
});

const resourceSchema = z.object({
  id: z.string(),
  type: z.string(),
  title: z.string(),
  url: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  completedDate: z.string().optional().nullable(),
  status: z.enum(["pending", "in-progress", "completed", "skipped"]).optional(),
  notes: z.string().optional().nullable(),
});

type DevelopmentObjectiveInput = z.infer<typeof objectiveSchema>;
type DevelopmentResourceInput = z.infer<typeof resourceSchema>;

function clampProgress(value: number | undefined) {
  if (!Number.isFinite(Number(value))) {
    return undefined;
  }

  return Math.max(0, Math.min(100, Math.round(Number(value))));
}

function getObjectiveProgress(objective: DevelopmentObjectiveInput) {
  const explicitProgress = clampProgress(objective.progress);

  if (objective.status === "completed" || objective.isCompleted) {
    return 100;
  }

  if (objective.status === "in-progress") {
    return explicitProgress ?? 50;
  }

  return explicitProgress ?? 0;
}

function normalizeObjective(objective: DevelopmentObjectiveInput) {
  const progress = getObjectiveProgress(objective);
  const status =
    objective.status ??
    (objective.isCompleted ? "completed" : progress > 0 ? "in-progress" : "not-started");

  return {
    id: objective.id,
    title: objective.title,
    ...(objective.description ? { description: objective.description } : {}),
    ...(objective.targetDate ? { targetDate: objective.targetDate } : {}),
    ...(objective.metrics ? { metrics: objective.metrics } : {}),
    status,
    progress,
    isCompleted: status === "completed",
    completedAt: status === "completed" ? objective.completedAt || new Date().toISOString() : null,
  };
}

function normalizeResource(resource: DevelopmentResourceInput) {
  const status = resource.status ?? (resource.completedDate ? "completed" : "pending");

  return {
    id: resource.id,
    type: resource.type,
    title: resource.title,
    ...(resource.url ? { url: resource.url } : {}),
    ...(resource.description ? { description: resource.description } : {}),
    ...(resource.dueDate ? { dueDate: resource.dueDate } : {}),
    ...(resource.notes ? { notes: resource.notes } : {}),
    status,
    completedDate: status === "completed" ? resource.completedDate || new Date().toISOString() : null,
  };
}

function calculatePlanProgress(
  objectives: Array<{ progress?: number; status?: string; isCompleted?: boolean }>,
  status?: string
) {
  if (status === "COMPLETED") {
    return 100;
  }

  if (objectives.length === 0) {
    return 0;
  }

  const totalProgress = objectives.reduce((sum, objective) => {
    if (objective.status === "completed" || objective.isCompleted) {
      return sum + 100;
    }

    if (objective.status === "in-progress") {
      return sum + (clampProgress(objective.progress) ?? 50);
    }

    return sum + (clampProgress(objective.progress) ?? 0);
  }, 0);

  return Math.round(totalProgress / objectives.length);
}

// Validation schema
const developmentPlanSchema = z.object({
  employeeId: z.string().min(1, "الموظف مطلوب"),
  title: z.string().min(2, "عنوان الخطة مطلوب"),
  titleAr: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  type: z.enum([
    "INDIVIDUAL", "TEAM", "ONBOARDING", 
    "PERFORMANCE_IMPROVEMENT", "CAREER_GROWTH", "SKILL_DEVELOPMENT"
  ]).default("INDIVIDUAL"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  status: z.enum(["DRAFT", "PENDING_APPROVAL", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional().default("DRAFT"),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  objectives: z.array(objectiveSchema).optional().default([]),
  resources: z.array(resourceSchema).optional().default([]),
  relatedTrainings: z.array(z.string()).optional().default([]),
  mentorId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

// GET - Get all development plans
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.tenantId) {
      return NextResponse.json(
        { error: "غير مصرح" },
        { status: 401 }
      );
    }

    const tenantId = session.user.tenantId;
    const { searchParams } = new URL(request.url);
    
    const employeeId = searchParams.get("employeeId");
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = { tenantId, deletedAt: null };
    
    if (employeeId) where.employeeId = employeeId;
    if (status) where.status = status;
    if (type) where.type = type;

    // Get plans
    const [plans, total] = await Promise.all([
      prisma.developmentPlan.findMany({
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
              department: { select: { name: true, nameAr: true } },
              jobTitle: { select: { name: true, nameAr: true } },
            },
          },
          mentor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              firstNameAr: true,
              lastNameAr: true,
              avatar: true,
              email: true,
              jobTitle: { select: { name: true, nameAr: true } },
            },
          },
        },
        orderBy: [
          { priority: "desc" },
          { endDate: "asc" },
        ],
        skip,
        take: limit,
      }),
      prisma.developmentPlan.count({ where: { tenantId, deletedAt: null } }),
    ]);

    // Stats — exclude soft-deleted plans
    const stats = await prisma.developmentPlan.groupBy({
      by: ["status"],
      where: { tenantId, deletedAt: null },
      _count: true,
    });

    return NextResponse.json({
      plans,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      stats: {
        draft: stats.find((s) => s.status === "DRAFT")?._count || 0,
        pendingApproval: stats.find((s) => s.status === "PENDING_APPROVAL")?._count || 0,
        inProgress: stats.find((s) => s.status === "IN_PROGRESS")?._count || 0,
        completed: stats.find((s) => s.status === "COMPLETED")?._count || 0,
        cancelled: stats.find((s) => s.status === "CANCELLED")?._count || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching development plans:", error);
    return NextResponse.json(
      { error: "حدث خطأ في جلب خطط التطوير" },
      { status: 500 }
    );
  }
}

// POST - Create new development plan
export async function POST(request: NextRequest) {
  try {
    const limit = 30;
    const rl = checkRateLimit(request, { keyPrefix: "api:dev-plans:create", limit, windowMs: 60 * 1000 });
    if (!rl.allowed) {
      return withRateLimitHeaders(
        NextResponse.json({ error: "طلبات كثيرة جداً" }, { status: 429 }),
        { limit, remaining: rl.remaining, resetAt: rl.resetAt }
      );
    }

    const session = await getServerSession(authOptions);
    
    if (!session?.user?.tenantId) {
      return NextResponse.json(
        { error: "غير مصرح" },
        { status: 401 }
      );
    }

    // RBAC: only managers and above can create development plans
    const allowedRoles = ["TENANT_ADMIN", "ADMIN", "SUPER_ADMIN", "HR_MANAGER", "MANAGER"];
    if (!allowedRoles.includes(session.user.role || "")) {
      return NextResponse.json(
        { error: "لا تملك صلاحية إنشاء خطط تطوير" },
        { status: 403 }
      );
    }

    const tenantId = session.user.tenantId;
    const body = await request.json();
    
    // Validate
    const validatedData = developmentPlanSchema.parse(body);
    const normalizedObjectives = validatedData.objectives.map(normalizeObjective);
    const normalizedResources = validatedData.resources.map(normalizeResource);
    const progress = calculatePlanProgress(normalizedObjectives, validatedData.status);

    // Verify employee belongs to tenant
    const employee = await prisma.employee.findFirst({
      where: { id: validatedData.employeeId, tenantId },
      include: { user: { select: { id: true } } },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "الموظف غير موجود" },
        { status: 400 }
      );
    }

    // If mentor specified, verify they belong to tenant
    if (validatedData.mentorId) {
      const mentor = await prisma.employee.findFirst({
        where: { id: validatedData.mentorId, tenantId },
      });
      if (!mentor) {
        return NextResponse.json(
          { error: "المرشد المحدد غير موجود" },
          { status: 400 }
        );
      }
    }

    // Create plan
    const plan = await prisma.developmentPlan.create({
      data: {
        tenantId,
        employeeId: validatedData.employeeId,
        title: validatedData.title,
        titleAr: validatedData.titleAr,
        description: validatedData.description,
        type: validatedData.type,
        priority: validatedData.priority,
        status: validatedData.status,
        startDate: new Date(validatedData.startDate),
        endDate: new Date(validatedData.endDate),
        completedAt: validatedData.status === "COMPLETED" ? new Date() : null,
        objectives: normalizedObjectives,
        resources: normalizedResources,
        relatedTrainings: validatedData.relatedTrainings,
        mentorId: validatedData.mentorId,
        notes: validatedData.notes,
        progress,
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            firstNameAr: true,
            lastNameAr: true,
            avatar: true,
            jobTitle: { select: { name: true, nameAr: true } },
          },
        },
        mentor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            firstNameAr: true,
            lastNameAr: true,
            avatar: true,
            email: true,
            jobTitle: { select: { name: true, nameAr: true } },
          },
        },
      },
    });

    // Notify the employee that a development plan was created for them
    if (employee.user?.id) {
      const empName = [plan.employee.firstNameAr ?? plan.employee.firstName, plan.employee.lastNameAr ?? plan.employee.lastName].filter(Boolean).join(" ");
      sendNotification({
        tenantId,
        userId: employee.user.id,
        type: "general",
        title: "تم إنشاء خطة تطوير",
        message: `تم إنشاء خطة تطوير جديدة لك: "${plan.title}"`,
        link: `/dashboard/development-plans`,
        metadata: { planId: plan.id, employeeName: empName },
      }).catch((err) => console.error("[notifications] dev-plan create:", err));
    }

    return NextResponse.json({
      message: "تم إنشاء خطة التطوير بنجاح",
      plan,
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating development plan:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "بيانات غير صالحة", details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "حدث خطأ في إنشاء خطة التطوير" },
      { status: 500 }
    );
  }
}
