import { logApiError } from "@/lib/api/route-helper";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { z } from "zod";

// Validation schema
const organizationSchema = z.object({
  name: z.string().min(2, "اسم الشركة مطلوب"),
  nameAr: z.string().optional().nullable(),
  commercialRegister: z.string().optional().nullable(),
  taxNumber: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  country: z.string().min(1, "الدولة مطلوبة").default("SA"),
  phone: z.string().optional().nullable(),
  email: z.string().email("البريد غير صالح").optional().nullable().or(z.literal("")),
  website: z.string().optional().nullable(),
  logo: z.string().optional().nullable()
});

const allowedRoles = ["TENANT_ADMIN", "SUPER_ADMIN", "HR_MANAGER", "MANAGER"];

// GET - Get organization profile
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    if (!allowedRoles.includes(session.user.role || "")) {
      return NextResponse.json({ error: "لا تملك صلاحية عرض بيانات الشركة" }, { status: 403 });
    }

    const tenantId = session.user.tenantId;

    // Get organization profile
    let profile = await prisma.organizationProfile.findUnique({
      where: { tenantId }
    });

    // If no profile exists, get tenant info and create profile
    if (!profile) {
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId }
      });

      if (tenant) {
        profile = await prisma.organizationProfile.create({
          data: {
            tenantId,
            name: tenant.name,
            nameAr: tenant.nameAr,
            country: "SA"
          }
        });
      }
    }

    // Get branches count and total employees
    const [branchesCount, employeesCount] = await Promise.all([
      prisma.branch.count({
        where: { tenantId, isActive: true }
      }),
      prisma.employee.count({
        where: { tenantId, status: "ACTIVE" }
      })
    ]);

    return NextResponse.json({
      profile,
      stats: {
        branchesCount,
        employeesCount
      }
    });
  } catch (error) {
    logApiError("Error fetching organization", error);
    return NextResponse.json({ error: "حدث خطأ في جلب بيانات الشركة" }, { status: 500 });
  }
}

// PUT - Update organization profile
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    // Check permissions
    const mutateAllowedRoles = ["TENANT_ADMIN", "SUPER_ADMIN", "HR_MANAGER"];
    if (!mutateAllowedRoles.includes(session.user.role || "")) {
      return NextResponse.json({ error: "لا تملك صلاحية تعديل بيانات الشركة" }, { status: 403 });
    }

    const tenantId = session.user.tenantId;
    const body = await request.json();

    // Validate
    const validatedData = organizationSchema.parse(body);

    // Upsert organization profile
    const profile = await prisma.organizationProfile.upsert({
      where: { tenantId },
      update: {
        ...validatedData,
        updatedAt: new Date()
      },
      create: {
        tenantId,
        ...validatedData
      }
    });

    // Also update tenant name if changed
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        name: validatedData.name,
        nameAr: validatedData.nameAr,
        logo: validatedData.logo
      }
    });

    return NextResponse.json({
      message: "تم تحديث بيانات الشركة بنجاح",
      profile
    });
  } catch (error) {
    logApiError("Error updating organization", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "بيانات غير صالحة", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "حدث خطأ في تحديث بيانات الشركة" }, { status: 500 });
  }
}
