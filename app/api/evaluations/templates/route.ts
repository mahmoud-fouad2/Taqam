import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { z } from "zod";

// Validation schema
const templateSchema = z.object({
  name: z.string().min(2, "اسم القالب مطلوب"),
  nameAr: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  isActive: z.boolean().optional().default(true),
  isDefault: z.boolean().optional().default(false),
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
          .default([])
      })
    )
    .optional()
    .default([]),
  ratingScale: z.number().min(3).max(10).optional().default(5),
  ratingLabels: z
    .array(z.string())
    .optional()
    .default(["ضعيف", "مقبول", "جيد", "جيد جداً", "ممتاز"])
});

// GET - Get all templates
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    const { searchParams } = new URL(request.url);

    const activeOnly = searchParams.get("activeOnly") === "true";

    // Build where clause
    const where: any = { tenantId };
    if (activeOnly) {
      where.isActive = true;
    }

    // Get templates
    const templates = await prisma.evaluationTemplate.findMany({
      where,
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }]
    });

    // Stats
    const stats = {
      total: templates.length,
      active: templates.filter((t) => t.isActive).length,
      default: templates.find((t) => t.isDefault)?.id || null
    };

    return NextResponse.json({
      templates,
      stats
    });
  } catch (error) {
    console.error("Error fetching templates:", error);
    return NextResponse.json({ error: "حدث خطأ في جلب القوالب" }, { status: 500 });
  }
}

// POST - Create new template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    // Check permissions
    const allowedRoles = ["TENANT_ADMIN", "SUPER_ADMIN", "HR_MANAGER"];
    if (!allowedRoles.includes(session.user.role || "")) {
      return NextResponse.json({ error: "لا تملك صلاحية إنشاء قالب تقييم" }, { status: 403 });
    }

    const tenantId = session.user.tenantId;
    const body = await request.json();

    // Validate
    const validatedData = templateSchema.parse(body);

    // If setting as default, unset other defaults
    if (validatedData.isDefault) {
      await prisma.evaluationTemplate.updateMany({
        where: { tenantId, isDefault: true },
        data: { isDefault: false }
      });
    }

    // Create template
    const template = await prisma.evaluationTemplate.create({
      data: {
        tenantId,
        name: validatedData.name,
        nameAr: validatedData.nameAr,
        description: validatedData.description,
        isActive: validatedData.isActive,
        isDefault: validatedData.isDefault,
        criteria: validatedData.criteria,
        ratingScale: validatedData.ratingScale,
        ratingLabels: validatedData.ratingLabels,
        createdByUserId: session.user.id
      }
    });

    return NextResponse.json(
      {
        message: "تم إنشاء القالب بنجاح",
        template
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating template:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "بيانات غير صالحة", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "حدث خطأ في إنشاء القالب" }, { status: 500 });
  }
}
