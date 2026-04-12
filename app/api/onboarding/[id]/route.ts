import { logApiError } from "@/lib/api/route-helper";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { z } from "zod";

// Validation schema for updates
const processUpdateSchema = z.object({
  // Prisma enum `OnboardingStatus` has DELAYED (not CANCELLED).
  // We still accept CANCELLED as a backwards-compatible alias for DELAYED.
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "DELAYED", "CANCELLED"]).optional(),
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
    .optional(),
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
    .optional(),
  progress: z.number().min(0).max(100).optional()
});

type Params = Promise<{ id: string }>;

// GET - Get single process
export async function GET(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const { id } = await params;
    const tenantId = session.user.tenantId;

    const process = await prisma.onboardingProcess.findFirst({
      where: { id, tenantId },
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
            phone: true,
            hireDate: true,
            department: { select: { name: true, nameAr: true } },
            jobTitle: { select: { name: true, nameAr: true } },
            manager: {
              select: {
                firstName: true,
                lastName: true,
                firstNameAr: true,
                lastNameAr: true,
                email: true
              }
            }
          }
        },
        template: {
          select: {
            id: true,
            name: true,
            description: true,
            durationDays: true
          }
        },
        createdBy: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!process) {
      return NextResponse.json({ error: "برنامج التأهيل غير موجود" }, { status: 404 });
    }

    return NextResponse.json(process);
  } catch (error) {
    logApiError("Error fetching process", error);
    return NextResponse.json({ error: "حدث خطأ في جلب بيانات البرنامج" }, { status: 500 });
  }
}

// PATCH - Update process
export async function PATCH(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const { id } = await params;
    const tenantId = session.user.tenantId;
    const body = await request.json();

    // Check process exists
    const existingProcess = await prisma.onboardingProcess.findFirst({
      where: { id, tenantId }
    });

    if (!existingProcess) {
      return NextResponse.json({ error: "برنامج التأهيل غير موجود" }, { status: 404 });
    }

    // Validate
    const validatedData = processUpdateSchema.parse(body);

    // Calculate progress from tasks if provided
    let progress = validatedData.progress;
    if (validatedData.tasks && validatedData.tasks.length > 0) {
      const completedTasks = validatedData.tasks.filter((t) => t.isCompleted).length;
      progress = Math.round((completedTasks / validatedData.tasks.length) * 100);
    }

    // Auto-update status based on progress
    let status = validatedData.status;

    if (status === "CANCELLED") {
      status = "DELAYED";
    }
    if (progress !== undefined) {
      if (progress === 100 && existingProcess.status !== "COMPLETED") {
        status = "COMPLETED";
      } else if (progress > 0 && existingProcess.status === "NOT_STARTED") {
        status = "IN_PROGRESS";
      }
    }

    // Update process
    const updatedProcess = await prisma.onboardingProcess.update({
      where: { id },
      data: {
        ...validatedData,
        status,
        progress,
        updatedAt: new Date()
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

    return NextResponse.json({
      message: "تم تحديث برنامج التأهيل بنجاح",
      process: updatedProcess
    });
  } catch (error) {
    logApiError("Error updating process", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "بيانات غير صالحة", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "حدث خطأ في تحديث البرنامج" }, { status: 500 });
  }
}

// DELETE - Delete process
export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    // Check permissions
    const allowedRoles = ["TENANT_ADMIN", "SUPER_ADMIN", "HR_MANAGER"];
    if (!allowedRoles.includes(session.user.role || "")) {
      return NextResponse.json({ error: "لا تملك صلاحية حذف برنامج التأهيل" }, { status: 403 });
    }

    const { id } = await params;
    const tenantId = session.user.tenantId;

    // Check process exists
    const process = await prisma.onboardingProcess.findFirst({
      where: { id, tenantId }
    });

    if (!process) {
      return NextResponse.json({ error: "برنامج التأهيل غير موجود" }, { status: 404 });
    }

    // Delete process
    await prisma.onboardingProcess.delete({
      where: { id }
    });

    return NextResponse.json({
      message: "تم حذف برنامج التأهيل بنجاح"
    });
  } catch (error) {
    logApiError("Error deleting process", error);
    return NextResponse.json({ error: "حدث خطأ في حذف البرنامج" }, { status: 500 });
  }
}
