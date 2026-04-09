import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { z } from "zod";
import { sendNotification } from "@/lib/notifications/send";

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

// Validation schema for updates
const planUpdateSchema = z.object({
  employeeId: z.string().min(1).optional(),
  title: z.string().min(2).optional(),
  titleAr: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  type: z.enum([
    "INDIVIDUAL", "TEAM", "ONBOARDING", 
    "PERFORMANCE_IMPROVEMENT", "CAREER_GROWTH", "SKILL_DEVELOPMENT"
  ]).optional(),
  status: z.enum(["DRAFT", "PENDING_APPROVAL", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  startDate: z.string().or(z.date()).optional(),
  endDate: z.string().or(z.date()).optional(),
  objectives: z.array(objectiveSchema).optional(),
  resources: z.array(resourceSchema).optional(),
  relatedTrainings: z.array(z.string()).optional(),
  mentorId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  progress: z.number().min(0).max(100).optional(),
});

type ObjectiveInput = z.infer<typeof objectiveSchema>;
type ResourceInput = z.infer<typeof resourceSchema>;

function clampProgress(value: number | undefined) {
  if (!Number.isFinite(Number(value))) {
    return undefined;
  }

  return Math.max(0, Math.min(100, Math.round(Number(value))));
}

function getObjectiveProgress(objective: ObjectiveInput) {
  const explicitProgress = clampProgress(objective.progress);

  if (objective.status === "completed" || objective.isCompleted) {
    return 100;
  }

  if (objective.status === "in-progress") {
    return explicitProgress ?? 50;
  }

  return explicitProgress ?? 0;
}

function normalizeObjective(objective: ObjectiveInput) {
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

function normalizeResource(resource: ResourceInput) {
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

type Params = Promise<{ id: string }>;

// GET - Get single plan
export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.tenantId) {
      return NextResponse.json(
        { error: "غير مصرح" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const tenantId = session.user.tenantId;

    const plan = await prisma.developmentPlan.findFirst({
      where: { id, tenantId, deletedAt: null },
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
            email: true,
            department: { select: { name: true, nameAr: true } },
            jobTitle: { select: { name: true, nameAr: true } },
            manager: {
              select: {
                firstName: true,
                lastName: true,
                firstNameAr: true,
                lastNameAr: true,
              },
            },
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

    if (!plan) {
      return NextResponse.json(
        { error: "خطة التطوير غير موجودة" },
        { status: 404 }
      );
    }

    return NextResponse.json(plan);
  } catch (error) {
    console.error("Error fetching plan:", error);
    return NextResponse.json(
      { error: "حدث خطأ في جلب بيانات الخطة" },
      { status: 500 }
    );
  }
}

// PATCH - Update plan
export async function PATCH(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.tenantId) {
      return NextResponse.json(
        { error: "غير مصرح" },
        { status: 401 }
      );
    }

    // RBAC: only managers and above can update development plans
    const allowedRoles = ["TENANT_ADMIN", "SUPER_ADMIN", "HR_MANAGER", "MANAGER"];
    if (!allowedRoles.includes(session.user.role || "")) {
      return NextResponse.json(
        { error: "لا تملك صلاحية تعديل خطط التطوير" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const tenantId = session.user.tenantId;
    const body = await request.json();

    // Check plan exists
    const existingPlan = await prisma.developmentPlan.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        employee: { include: { user: { select: { id: true } } } },
      },
    });

    if (!existingPlan) {
      return NextResponse.json(
        { error: "خطة التطوير غير موجودة" },
        { status: 404 }
      );
    }

    // Validate
    const validatedData = planUpdateSchema.parse(body);

    if (validatedData.employeeId) {
      const employee = await prisma.employee.findFirst({
        where: { id: validatedData.employeeId, tenantId },
      });
      if (!employee) {
        return NextResponse.json(
          { error: "الموظف المحدد غير موجود" },
          { status: 400 }
        );
      }
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

    // Prepare update data
    const updateData: Record<string, unknown> = { ...validatedData };
    if (validatedData.startDate) {
      updateData.startDate = new Date(validatedData.startDate as string);
    }
    if (validatedData.endDate) {
      updateData.endDate = new Date(validatedData.endDate as string);
    }

    if (validatedData.objectives !== undefined) {
      updateData.objectives = validatedData.objectives.map(normalizeObjective);
      updateData.progress = calculatePlanProgress(
        updateData.objectives as Parameters<typeof calculatePlanProgress>[0],
        (validatedData.status ?? existingPlan.status) as string
      );
    }

    if (validatedData.resources !== undefined) {
      updateData.resources = validatedData.resources.map(normalizeResource);
    }

    // If status changed to COMPLETED, set completedAt
    if (validatedData.status === "COMPLETED" && existingPlan.status !== "COMPLETED") {
      updateData.completedAt = new Date();
      updateData.progress = 100;
    } else if (validatedData.status && validatedData.status !== "COMPLETED" && existingPlan.status === "COMPLETED") {
      updateData.completedAt = null;
    }

    if (validatedData.progress !== undefined && validatedData.objectives === undefined && validatedData.status !== "COMPLETED") {
      updateData.progress = validatedData.progress;
    }

    // Update plan
    const updatedPlan = await prisma.developmentPlan.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date(),
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

    // ── Notifications on status change ──────────────────────────────────────

    const employeeUserId = existingPlan.employee?.user?.id;
    const statusChanged = validatedData.status && validatedData.status !== existingPlan.status;

    if (statusChanged && employeeUserId) {
      const statusMessages: Record<string, { title: string; message: string }> = {
        IN_PROGRESS: {
          title: "بدأت خطة تطويرك",
          message: `خطة التطوير "${updatedPlan.title}" أصبحت نشطة الآن`,
        },
        COMPLETED: {
          title: "تهانينا! اكتملت خطة تطويرك",
          message: `تم إنهاء خطة التطوير "${updatedPlan.title}" بنجاح`,
        },
        CANCELLED: {
          title: "تم إلغاء خطة تطويرك",
          message: `خطة التطوير "${updatedPlan.title}" تم إلغاؤها`,
        },
        PENDING_APPROVAL: {
          title: "خطة تطوير تنتظر موافقتك",
          message: `خطة التطوير "${updatedPlan.title}" تحتاج مراجعتك وموافقتك`,
        },
      };

      const notifyPayload = statusMessages[validatedData.status as string];
      if (notifyPayload) {
        // Notify employee for all status changes except PENDING_APPROVAL (notify HR instead)
        const targetUserId = validatedData.status === "PENDING_APPROVAL" ? null : employeeUserId;

        if (targetUserId) {
          sendNotification({
            tenantId,
            userId: targetUserId,
            type: "general",
            title: notifyPayload.title,
            message: notifyPayload.message,
            link: `/dashboard/development-plans`,
            metadata: { planId: id },
          }).catch((err) => console.error("[notifications] dev-plan status:", err));
        }

        // For PENDING_APPROVAL — also notify HR managers in tenant
        if (validatedData.status === "PENDING_APPROVAL") {
          prisma.user.findMany({
            where: { tenantId, role: { in: ["HR_MANAGER", "TENANT_ADMIN"] }, status: "ACTIVE" },
            select: { id: true },
          }).then((hrUsers) => {
            hrUsers.forEach(({ id: hrUserId }) => {
              sendNotification({
                tenantId,
                userId: hrUserId,
                type: "general",
                title: "خطة تطوير تنتظر الموافقة",
                message: `خطة التطوير "${updatedPlan.title}" تحتاج مراجعتك`,
                link: `/dashboard/development-plans`,
                metadata: { planId: id },
              }).catch(() => undefined);
            });
          }).catch(() => undefined);
        }
      }
    }

    return NextResponse.json({
      message: "تم تحديث خطة التطوير بنجاح",
      plan: updatedPlan,
    });
  } catch (error) {
    console.error("Error updating plan:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "بيانات غير صالحة", details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "حدث خطأ في تحديث الخطة" },
      { status: 500 }
    );
  }
}

// DELETE - Delete plan
export async function DELETE(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.tenantId) {
      return NextResponse.json(
        { error: "غير مصرح" },
        { status: 401 }
      );
    }

    // Check permissions
    const allowedRoles = ["TENANT_ADMIN", "SUPER_ADMIN", "HR_MANAGER"];
    if (!allowedRoles.includes(session.user.role || "")) {
      return NextResponse.json(
        { error: "لا تملك صلاحية حذف خطة التطوير" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const tenantId = session.user.tenantId;

    // Check plan exists
    const plan = await prisma.developmentPlan.findFirst({
      where: { id, tenantId, deletedAt: null },
    });

    if (!plan) {
      return NextResponse.json(
        { error: "خطة التطوير غير موجودة" },
        { status: 404 }
      );
    }

    // Cannot delete completed plans
    if (plan.status === "COMPLETED") {
      return NextResponse.json(
        { error: "لا يمكن حذف خطة مكتملة" },
        { status: 400 }
      );
    }

    // Soft-delete: set deletedAt instead of hard delete
    await prisma.developmentPlan.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({
      message: "تم حذف خطة التطوير بنجاح",
    });
  } catch (error) {
    console.error("Error deleting plan:", error);
    return NextResponse.json(
      { error: "حدث خطأ في حذف الخطة" },
      { status: 500 }
    );
  }
}
