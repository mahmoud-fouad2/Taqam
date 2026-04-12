import { logApiError } from "@/lib/api/route-helper";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { z } from "zod";

// Validation schema
const branchSchema = z.object({
  name: z.string().min(2, "اسم الفرع مطلوب"),
  nameAr: z.string().optional().nullable(),
  code: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  country: z.string().min(1, "الدولة مطلوبة").default("SA"),
  phone: z.string().optional().nullable(),
  email: z.string().email("البريد غير صالح").optional().nullable().or(z.literal("")),
  isHeadquarters: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true)
});

// GET - Get all branches
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    const { searchParams } = new URL(request.url);

    // Filters
    const activeOnly = searchParams.get("activeOnly") === "true";
    const search = searchParams.get("search");
    const city = searchParams.get("city");

    // Build where clause
    const where: any = { tenantId };

    if (activeOnly) {
      where.isActive = true;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { nameAr: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } }
      ];
    }

    if (city) {
      where.city = city;
    }

    // Get branches with employee count
    const branches = await prisma.branch.findMany({
      where,
      include: {
        _count: {
          select: {
            employees: {
              where: { status: "ACTIVE" }
            }
          }
        }
      },
      orderBy: [{ isHeadquarters: "desc" }, { createdAt: "asc" }]
    });

    // Transform to add employeesCount
    const transformedBranches = branches.map((branch) => ({
      ...branch,
      employeesCount: branch._count.employees,
      _count: undefined
    }));

    // Get unique cities for filter
    const cities = await prisma.branch.findMany({
      where: { tenantId },
      select: { city: true },
      distinct: ["city"]
    });

    // Stats
    const stats = {
      total: branches.length,
      active: branches.filter((b) => b.isActive).length,
      totalEmployees: transformedBranches.reduce((sum, b) => sum + b.employeesCount, 0),
      cities: cities.filter((c) => c.city).map((c) => c.city)
    };

    return NextResponse.json({
      branches: transformedBranches,
      stats
    });
  } catch (error) {
    logApiError("Error fetching branches", error);
    return NextResponse.json({ error: "حدث خطأ في جلب الفروع" }, { status: 500 });
  }
}

// POST - Create new branch
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    // Check permissions
    const allowedRoles = ["TENANT_ADMIN", "SUPER_ADMIN", "HR_MANAGER"];
    if (!allowedRoles.includes(session.user.role || "")) {
      return NextResponse.json({ error: "لا تملك صلاحية إضافة فرع" }, { status: 403 });
    }

    const tenantId = session.user.tenantId;
    const body = await request.json();

    // Validate
    const validatedData = branchSchema.parse(body);

    // If this is headquarters, unset other headquarters
    if (validatedData.isHeadquarters) {
      await prisma.branch.updateMany({
        where: { tenantId, isHeadquarters: true },
        data: { isHeadquarters: false }
      });
    }

    // Create branch
    const branch = await prisma.branch.create({
      data: {
        tenantId,
        ...validatedData
      }
    });

    return NextResponse.json(
      {
        message: "تم إضافة الفرع بنجاح",
        branch
      },
      { status: 201 }
    );
  } catch (error) {
    logApiError("Error creating branch", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "بيانات غير صالحة", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "حدث خطأ في إضافة الفرع" }, { status: 500 });
  }
}
