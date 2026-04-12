import { logApiError } from "@/lib/api/route-helper";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { z } from "zod";

// Validation schema for updates
const templateUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  departmentId: z.string().optional().nullable(),
  jobTitleId: z.string().optional().nullable(),
  durationDays: z.number().min(1).optional(),
  tasks: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        description: z.string().optional(),
        category: z.string().optional(),
        dayOffset: z.number().default(0),
        assigneeType: z.enum(["HR", "MANAGER", "IT", "EMPLOYEE", "BUDDY"]).optional()
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
        dayOffset: z.number().default(0)
      })
    )
    .optional(),
  isActive: z.boolean().optional()
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

    const template = await prisma.onboardingTemplate.findFirst({
      where: { id, tenantId },
      include: {
        department: { select: { id: true, name: true, nameAr: true } },
        jobTitle: { select: { id: true, name: true, nameAr: true } },
        _count: { select: { processes: true } }
      }
    });

    if (!template) {
      return NextResponse.json({ error: "القالب غير موجود" }, { status: 404 });
    }

    return NextResponse.json(template);
  } catch (error) {
    logApiError("Error fetching template", error);
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
      return NextResponse.json({ error: "لا تملك صلاحية تعديل القوالب" }, { status: 403 });
    }

    const { id } = await params;
    const tenantId = session.user.tenantId;
    const body = await request.json();

    // Check template exists
    const existingTemplate = await prisma.onboardingTemplate.findFirst({
      where: { id, tenantId }
    });

    if (!existingTemplate) {
      return NextResponse.json({ error: "القالب غير موجود" }, { status: 404 });
    }

    // Validate
    const validatedData = templateUpdateSchema.parse(body);

    // Update template
    const updatedTemplate = await prisma.onboardingTemplate.update({
      where: { id },
      data: {
        ...validatedData,
        updatedAt: new Date()
      },
      include: {
        department: { select: { name: true, nameAr: true } },
        jobTitle: { select: { name: true, nameAr: true } }
      }
    });

    return NextResponse.json({
      message: "تم تحديث القالب بنجاح",
      template: updatedTemplate
    });
  } catch (error) {
    logApiError("Error updating template", error);

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
    const allowedRoles = ["TENANT_ADMIN", "SUPER_ADMIN", "HR_MANAGER"];
    if (!allowedRoles.includes(session.user.role || "")) {
      return NextResponse.json({ error: "لا تملك صلاحية حذف القوالب" }, { status: 403 });
    }

    const { id } = await params;
    const tenantId = session.user.tenantId;

    // Check template exists
    const template = await prisma.onboardingTemplate.findFirst({
      where: { id, tenantId },
      include: { _count: { select: { processes: true } } }
    });

    if (!template) {
      return NextResponse.json({ error: "القالب غير موجود" }, { status: 404 });
    }

    // Check if template is in use
    if (template._count.processes > 0) {
      return NextResponse.json(
        { error: `لا يمكن حذف القالب لأنه مستخدم في ${template._count.processes} برنامج تأهيل` },
        { status: 400 }
      );
    }

    // Delete template
    await prisma.onboardingTemplate.delete({
      where: { id }
    });

    return NextResponse.json({
      message: "تم حذف القالب بنجاح"
    });
  } catch (error) {
    logApiError("Error deleting template", error);
    return NextResponse.json({ error: "حدث خطأ في حذف القالب" }, { status: 500 });
  }
}
