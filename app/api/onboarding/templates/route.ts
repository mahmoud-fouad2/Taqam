import { logApiError } from "@/lib/api/route-helper";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { z } from "zod";

// Validation schema for creating template
const templateSchema = z.object({
  name: z.string().min(1, "اسم القالب مطلوب"),
  description: z.string().optional(),
  departmentId: z.string().optional(),
  jobTitleId: z.string().optional(),
  durationDays: z.number().min(1).default(30),
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
    .default([]),
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
    .default([])
});

// GET - List templates
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    const { searchParams } = new URL(request.url);

    // Filters
    const departmentId = searchParams.get("departmentId");
    const jobTitleId = searchParams.get("jobTitleId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { tenantId };

    if (departmentId) where.departmentId = departmentId;
    if (jobTitleId) where.jobTitleId = jobTitleId;

    // Get templates with count
    const [templates, total] = await Promise.all([
      prisma.onboardingTemplate.findMany({
        where,
        include: {
          department: { select: { name: true, nameAr: true } },
          jobTitle: { select: { name: true, nameAr: true } },
          _count: { select: { processes: true } }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      }),
      prisma.onboardingTemplate.count({ where })
    ]);

    // Stats (Prisma model doesn't have isActive; treat all templates as active)
    const activeCount = total;
    const inactiveCount = 0;

    return NextResponse.json({
      templates,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      },
      stats: {
        total,
        active: activeCount,
        inactive: inactiveCount
      }
    });
  } catch (error) {
    logApiError("Error fetching templates", error);
    return NextResponse.json({ error: "حدث خطأ في جلب القوالب" }, { status: 500 });
  }
}

// POST - Create template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    // Check permissions
    const allowedRoles = ["TENANT_ADMIN", "SUPER_ADMIN", "HR_MANAGER"];
    if (!allowedRoles.includes(session.user.role || "")) {
      return NextResponse.json({ error: "لا تملك صلاحية إنشاء قوالب التأهيل" }, { status: 403 });
    }

    const tenantId = session.user.tenantId;
    const body = await request.json();

    // Validate
    const validatedData = templateSchema.parse(body);

    // Create template
    const template = await prisma.onboardingTemplate.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        tenantId,
        departmentId: validatedData.departmentId,
        jobTitleId: validatedData.jobTitleId,
        durationDays: validatedData.durationDays,
        tasks: validatedData.tasks,
        documents: validatedData.documents,
        createdById: session.user.id
      },
      include: {
        department: { select: { name: true, nameAr: true } },
        jobTitle: { select: { name: true, nameAr: true } }
      }
    });

    return NextResponse.json({ message: "تم إنشاء القالب بنجاح", template }, { status: 201 });
  } catch (error) {
    logApiError("Error creating template", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "بيانات غير صالحة", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "حدث خطأ في إنشاء القالب" }, { status: 500 });
  }
}
