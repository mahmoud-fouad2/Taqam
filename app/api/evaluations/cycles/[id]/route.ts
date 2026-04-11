import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { z } from "zod";

// Validation schema for updates
const cycleUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  nameAr: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  startDate: z.string().or(z.date()).optional(),
  endDate: z.string().or(z.date()).optional(),
  reviewDeadline: z.string().or(z.date()).optional().nullable(),
  status: z.enum(["DRAFT", "ACTIVE", "COMPLETED", "CANCELLED"]).optional(),
  templateId: z.string().optional().nullable(),
  targetDepartments: z.array(z.string()).optional(),
  targetEmployees: z.array(z.string()).optional()
});

type Params = Promise<{ id: string }>;

// GET - Get single cycle with evaluations
export async function GET(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const { id } = await params;
    const tenantId = session.user.tenantId;

    const cycle = await prisma.evaluationCycle.findFirst({
      where: { id, tenantId },
      include: {
        evaluations: {
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
          }
        },
        createdByUser: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!cycle) {
      return NextResponse.json({ error: "دورة التقييم غير موجودة" }, { status: 404 });
    }

    return NextResponse.json(cycle);
  } catch (error) {
    console.error("Error fetching cycle:", error);
    return NextResponse.json({ error: "حدث خطأ في جلب بيانات الدورة" }, { status: 500 });
  }
}

// PATCH - Update cycle
export async function PATCH(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    // Check permissions
    const allowedRoles = ["TENANT_ADMIN", "SUPER_ADMIN", "HR_MANAGER"];
    if (!allowedRoles.includes(session.user.role || "")) {
      return NextResponse.json({ error: "لا تملك صلاحية تعديل دورة التقييم" }, { status: 403 });
    }

    const { id } = await params;
    const tenantId = session.user.tenantId;
    const body = await request.json();

    // Check cycle exists
    const existingCycle = await prisma.evaluationCycle.findFirst({
      where: { id, tenantId }
    });

    if (!existingCycle) {
      return NextResponse.json({ error: "دورة التقييم غير موجودة" }, { status: 404 });
    }

    // Validate
    const validatedData = cycleUpdateSchema.parse(body);

    // Prepare update data
    const updateData: any = { ...validatedData };
    if (validatedData.startDate) {
      updateData.startDate = new Date(validatedData.startDate);
    }
    if (validatedData.endDate) {
      updateData.endDate = new Date(validatedData.endDate);
    }
    if (validatedData.reviewDeadline) {
      updateData.reviewDeadline = new Date(validatedData.reviewDeadline);
    }

    // Update
    const updatedCycle = await prisma.evaluationCycle.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({
      message: "تم تحديث الدورة بنجاح",
      cycle: updatedCycle
    });
  } catch (error) {
    console.error("Error updating cycle:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "بيانات غير صالحة", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "حدث خطأ في تحديث الدورة" }, { status: 500 });
  }
}

// DELETE - Delete cycle
export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    // Check permissions
    const allowedRoles = ["TENANT_ADMIN", "SUPER_ADMIN"];
    if (!allowedRoles.includes(session.user.role || "")) {
      return NextResponse.json({ error: "لا تملك صلاحية حذف دورة التقييم" }, { status: 403 });
    }

    const { id } = await params;
    const tenantId = session.user.tenantId;

    // Check cycle exists
    const cycle = await prisma.evaluationCycle.findFirst({
      where: { id, tenantId },
      include: {
        _count: { select: { evaluations: true } }
      }
    });

    if (!cycle) {
      return NextResponse.json({ error: "دورة التقييم غير موجودة" }, { status: 404 });
    }

    // Cannot delete completed cycles with evaluations
    if (cycle.status === "COMPLETED" && cycle._count.evaluations > 0) {
      return NextResponse.json(
        { error: "لا يمكن حذف دورة مكتملة تحتوي على تقييمات" },
        { status: 400 }
      );
    }

    // Delete cycle (cascades to evaluations)
    await prisma.evaluationCycle.delete({
      where: { id }
    });

    return NextResponse.json({
      message: "تم حذف الدورة بنجاح"
    });
  } catch (error) {
    console.error("Error deleting cycle:", error);
    return NextResponse.json({ error: "حدث خطأ في حذف الدورة" }, { status: 500 });
  }
}
