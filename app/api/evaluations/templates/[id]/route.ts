import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { z } from "zod";

// Validation schema for updates
const templateUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  nameAr: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
  criteria: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        nameAr: z.string().optional(),
        weight: z.number().min(0).max(100),
        description: z.string().optional(),
        items: z
          .array(
            z.object({
              id: z.string(),
              name: z.string(),
              nameAr: z.string().optional(),
              weight: z.number().min(0).max(100),
              description: z.string().optional()
            })
          )
          .optional()
      })
    )
    .optional(),
  ratingScale: z.number().min(3).max(10).optional(),
  ratingLabels: z.array(z.string()).optional()
});

type Params = Promise<{ id: string }>;

// GET - Get single template
export async function GET(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const { id } = await params;
    const tenantId = session.user.tenantId;

    const template = await prisma.evaluationTemplate.findFirst({
      where: { id, tenantId }
    });

    if (!template) {
      return NextResponse.json({ error: "القالب غير موجود" }, { status: 404 });
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error("Error fetching template:", error);
    return NextResponse.json({ error: "حدث خطأ في جلب بيانات القالب" }, { status: 500 });
  }
}

// PATCH - Update template
export async function PATCH(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    // Check permissions
    const allowedRoles = ["TENANT_ADMIN", "SUPER_ADMIN", "HR_MANAGER"];
    if (!allowedRoles.includes(session.user.role || "")) {
      return NextResponse.json({ error: "لا تملك صلاحية تعديل القالب" }, { status: 403 });
    }

    const { id } = await params;
    const tenantId = session.user.tenantId;
    const body = await request.json();

    // Check template exists
    const existingTemplate = await prisma.evaluationTemplate.findFirst({
      where: { id, tenantId }
    });

    if (!existingTemplate) {
      return NextResponse.json({ error: "القالب غير موجود" }, { status: 404 });
    }

    // Validate
    const validatedData = templateUpdateSchema.parse(body);

    // If setting as default, unset other defaults
    if (validatedData.isDefault) {
      await prisma.evaluationTemplate.updateMany({
        where: { tenantId, isDefault: true, id: { not: id } },
        data: { isDefault: false }
      });
    }

    // Update template
    const updatedTemplate = await prisma.evaluationTemplate.update({
      where: { id },
      data: {
        ...validatedData,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      message: "تم تحديث القالب بنجاح",
      template: updatedTemplate
    });
  } catch (error) {
    console.error("Error updating template:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "بيانات غير صالحة", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "حدث خطأ في تحديث القالب" }, { status: 500 });
  }
}

// DELETE - Delete template
export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    // Check permissions
    const allowedRoles = ["TENANT_ADMIN", "SUPER_ADMIN"];
    if (!allowedRoles.includes(session.user.role || "")) {
      return NextResponse.json({ error: "لا تملك صلاحية حذف القالب" }, { status: 403 });
    }

    const { id } = await params;
    const tenantId = session.user.tenantId;

    // Check template exists
    const template = await prisma.evaluationTemplate.findFirst({
      where: { id, tenantId }
    });

    if (!template) {
      return NextResponse.json({ error: "القالب غير موجود" }, { status: 404 });
    }

    // Cannot delete default template
    if (template.isDefault) {
      return NextResponse.json(
        { error: "لا يمكن حذف القالب الافتراضي، قم بتعيين قالب آخر كافتراضي أولاً" },
        { status: 400 }
      );
    }

    // Delete template
    await prisma.evaluationTemplate.delete({
      where: { id }
    });

    return NextResponse.json({
      message: "تم حذف القالب بنجاح"
    });
  } catch (error) {
    console.error("Error deleting template:", error);
    return NextResponse.json({ error: "حدث خطأ في حذف القالب" }, { status: 500 });
  }
}
