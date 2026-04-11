import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { z } from "zod";

// Validation schema for updates
const goalUpdateSchema = z.object({
  title: z.string().min(2, "عنوان الهدف مطلوب").optional(),
  titleAr: z.string().optional().nullable(),
  description: z.string().min(2).optional(),
  category: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  status: z.enum(["DRAFT", "PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
  targetValue: z.string().optional().nullable(),
  currentValue: z.string().optional().nullable(),
  unit: z.string().optional().nullable(),
  startDate: z.string().or(z.date()).optional(),
  dueDate: z.string().or(z.date()).optional(),
  managerId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  progress: z.number().min(0).max(100).optional()
});

type Params = Promise<{ id: string }>;

// GET - Get single goal
export async function GET(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const { id } = await params;
    const tenantId = session.user.tenantId;

    const goal = await prisma.performanceGoal.findFirst({
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
            department: { select: { name: true, nameAr: true } },
            jobTitle: { select: { name: true, nameAr: true } }
          }
        },
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            firstNameAr: true,
            lastNameAr: true,
            avatar: true
          }
        }
      }
    });

    if (!goal) {
      return NextResponse.json({ error: "الهدف غير موجود" }, { status: 404 });
    }

    return NextResponse.json(goal);
  } catch (error) {
    console.error("Error fetching goal:", error);
    return NextResponse.json({ error: "حدث خطأ في جلب بيانات الهدف" }, { status: 500 });
  }
}

// PATCH - Update goal
export async function PATCH(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const { id } = await params;
    const tenantId = session.user.tenantId;
    const body = await request.json();

    // Check goal exists and belongs to tenant
    const existingGoal = await prisma.performanceGoal.findFirst({
      where: { id, tenantId }
    });

    if (!existingGoal) {
      return NextResponse.json({ error: "الهدف غير موجود" }, { status: 404 });
    }

    // Validate
    const validatedData = goalUpdateSchema.parse(body);

    // If manager specified, verify they belong to tenant
    if (validatedData.managerId) {
      const manager = await prisma.employee.findFirst({
        where: { id: validatedData.managerId, tenantId }
      });
      if (!manager) {
        return NextResponse.json({ error: "المدير المحدد غير موجود" }, { status: 400 });
      }
    }

    // Prepare update data
    const updateData: any = {
      ...validatedData,
      updatedAt: new Date()
    };

    // Convert dates if provided
    if (validatedData.startDate) {
      updateData.startDate = new Date(validatedData.startDate);
    }
    if (validatedData.dueDate) {
      updateData.dueDate = new Date(validatedData.dueDate);
    }

    // If status changed to COMPLETED, set completedAt
    if (validatedData.status === "COMPLETED" && existingGoal.status !== "COMPLETED") {
      updateData.completedAt = new Date();
      updateData.progress = 100;
    }

    // If status changed from COMPLETED, clear completedAt
    if (
      validatedData.status &&
      validatedData.status !== "COMPLETED" &&
      existingGoal.status === "COMPLETED"
    ) {
      updateData.completedAt = null;
    }

    // Update goal
    const updatedGoal = await prisma.performanceGoal.update({
      where: { id },
      data: updateData,
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
      message: "تم تحديث الهدف بنجاح",
      goal: updatedGoal
    });
  } catch (error) {
    console.error("Error updating goal:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "بيانات غير صالحة", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "حدث خطأ في تحديث الهدف" }, { status: 500 });
  }
}

// DELETE - Delete goal
export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const { id } = await params;
    const tenantId = session.user.tenantId;

    // Check goal exists and belongs to tenant
    const goal = await prisma.performanceGoal.findFirst({
      where: { id, tenantId }
    });

    if (!goal) {
      return NextResponse.json({ error: "الهدف غير موجود" }, { status: 404 });
    }

    // Cannot delete completed goals
    if (goal.status === "COMPLETED") {
      return NextResponse.json({ error: "لا يمكن حذف هدف مكتمل" }, { status: 400 });
    }

    // Delete goal
    await prisma.performanceGoal.delete({
      where: { id }
    });

    return NextResponse.json({
      message: "تم حذف الهدف بنجاح"
    });
  } catch (error) {
    console.error("Error deleting goal:", error);
    return NextResponse.json({ error: "حدث خطأ في حذف الهدف" }, { status: 500 });
  }
}
