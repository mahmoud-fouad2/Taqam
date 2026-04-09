import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { z } from "zod";

// Validation schema
const branchUpdateSchema = z.object({
  name: z.string().min(2, "اسم الفرع مطلوب").optional(),
  nameAr: z.string().optional().nullable(),
  code: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  country: z.string().min(1, "الدولة مطلوبة").optional(),
  phone: z.string().optional().nullable(),
  email: z.string().email("البريد غير صالح").optional().nullable().or(z.literal("")),
  isHeadquarters: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

type Params = Promise<{ id: string }>;

// GET - Get single branch
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

    const branch = await prisma.branch.findFirst({
      where: { id, tenantId },
      include: {
        employees: {
          where: { status: "ACTIVE" },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            firstNameAr: true,
            lastNameAr: true,
            employeeNumber: true,
            jobTitle: { select: { name: true, nameAr: true } },
            avatar: true,
          },
          take: 10,
        },
        _count: {
          select: {
            employees: { where: { status: "ACTIVE" } },
          },
        },
      },
    });

    if (!branch) {
      return NextResponse.json(
        { error: "الفرع غير موجود" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...branch,
      employeesCount: branch._count.employees,
      _count: undefined,
    });
  } catch (error) {
    console.error("Error fetching branch:", error);
    return NextResponse.json(
      { error: "حدث خطأ في جلب بيانات الفرع" },
      { status: 500 }
    );
  }
}

// PATCH - Update branch
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

    // Check permissions
    const allowedRoles = ["TENANT_ADMIN", "SUPER_ADMIN", "HR_MANAGER"];
    if (!allowedRoles.includes(session.user.role || "")) {
      return NextResponse.json(
        { error: "لا تملك صلاحية تعديل الفرع" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const tenantId = session.user.tenantId;
    const body = await request.json();

    // Check branch exists and belongs to tenant
    const existingBranch = await prisma.branch.findFirst({
      where: { id, tenantId },
    });

    if (!existingBranch) {
      return NextResponse.json(
        { error: "الفرع غير موجود" },
        { status: 404 }
      );
    }

    // Validate
    const validatedData = branchUpdateSchema.parse(body);

    // If setting as headquarters, unset others
    if (validatedData.isHeadquarters) {
      await prisma.branch.updateMany({
        where: { tenantId, isHeadquarters: true, id: { not: id } },
        data: { isHeadquarters: false },
      });
    }

    // Update branch
    const updatedBranch = await prisma.branch.update({
      where: { id },
      data: {
        ...validatedData,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: "تم تحديث الفرع بنجاح",
      branch: updatedBranch,
    });
  } catch (error) {
    console.error("Error updating branch:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "بيانات غير صالحة", details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "حدث خطأ في تحديث الفرع" },
      { status: 500 }
    );
  }
}

// DELETE - Delete branch
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
    const allowedRoles = ["TENANT_ADMIN", "SUPER_ADMIN"];
    if (!allowedRoles.includes(session.user.role || "")) {
      return NextResponse.json(
        { error: "لا تملك صلاحية حذف الفرع" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const tenantId = session.user.tenantId;

    // Check branch exists and belongs to tenant
    const branch = await prisma.branch.findFirst({
      where: { id, tenantId },
      include: {
        _count: {
          select: { employees: true },
        },
      },
    });

    if (!branch) {
      return NextResponse.json(
        { error: "الفرع غير موجود" },
        { status: 404 }
      );
    }

    // Cannot delete if has employees
    if (branch._count.employees > 0) {
      return NextResponse.json(
        { error: `لا يمكن حذف الفرع لأنه يحتوي على ${branch._count.employees} موظف` },
        { status: 400 }
      );
    }

    // Cannot delete headquarters
    if (branch.isHeadquarters) {
      return NextResponse.json(
        { error: "لا يمكن حذف المقر الرئيسي" },
        { status: 400 }
      );
    }

    // Delete branch
    await prisma.branch.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "تم حذف الفرع بنجاح",
    });
  } catch (error) {
    console.error("Error deleting branch:", error);
    return NextResponse.json(
      { error: "حدث خطأ في حذف الفرع" },
      { status: 500 }
    );
  }
}
