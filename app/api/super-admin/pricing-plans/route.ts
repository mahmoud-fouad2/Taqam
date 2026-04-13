/**
 * Pricing Plans API (Super Admin Only)
 * GET  - Get all pricing plans
 * POST - Create new plan
 */

import { logApiError } from "@/lib/api/route-helper";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { pricingPlanPayloadSchema } from "@/lib/marketing/commercial-schemas";

async function ensureDefaultPricingPlans() {
  const count = await prisma.pricingPlan.count();
  if (count > 0) return;

  await prisma.pricingPlan.createMany({
    data: [
      {
        name: "Starter",
        nameAr: "الأساسية",
        slug: "starter",
        priceMonthly: 499,
        priceYearly: 4990,
        currency: "SAR",
        maxEmployees: 25,
        employeesLabel: "حتى 25 موظف",
        employeesLabelEn: "Up to 25 employees",
        featuresAr: ["إدارة الموظفين", "الحضور والانصراف", "الإجازات", "التقارير الأساسية"],
        featuresEn: [
          "Employee management",
          "Time & attendance",
          "Leave management",
          "Basic reports"
        ],
        planType: "BASIC",
        isPopular: false,
        isActive: true,
        sortOrder: 1
      },
      {
        name: "Business",
        nameAr: "الأعمال",
        slug: "business",
        priceMonthly: 999,
        priceYearly: 9990,
        currency: "SAR",
        maxEmployees: 100,
        employeesLabel: "حتى 100 موظف",
        employeesLabelEn: "Up to 100 employees",
        featuresAr: ["كل مميزات الأساسية", "إدارة الرواتب", "تصدير WPS", "دعم فني متقدم"],
        featuresEn: ["Everything in Starter", "Payroll", "WPS export", "Priority support"],
        planType: "PROFESSIONAL",
        isPopular: true,
        isActive: true,
        sortOrder: 2
      },
      {
        name: "Enterprise",
        nameAr: "المؤسسات",
        slug: "enterprise",
        priceMonthly: null,
        priceYearly: null,
        currency: "SAR",
        maxEmployees: null,
        employeesLabel: "غير محدود",
        employeesLabelEn: "Unlimited",
        featuresAr: ["كل مميزات الأعمال", "تكاملات مخصصة", "وصول API", "مدير حساب مخصص"],
        featuresEn: [
          "Everything in Business",
          "Custom integrations",
          "API access",
          "Dedicated account manager"
        ],
        planType: "ENTERPRISE",
        isPopular: false,
        isActive: true,
        sortOrder: 3
      }
    ]
  });
}

// GET all pricing plans
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureDefaultPricingPlans();

    const plans = await prisma.pricingPlan.findMany({
      orderBy: { sortOrder: "asc" }
    });

    return NextResponse.json({ data: plans });
  } catch (error) {
    logApiError("GET pricing plans error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST create new plan
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = pricingPlanPayloadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid plan payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Check slug uniqueness
    const existing = await prisma.pricingPlan.findUnique({
      where: { slug: data.slug }
    });

    if (existing) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 400 });
    }

    const plan = await prisma.pricingPlan.create({
      data: {
        name: data.name,
        nameAr: data.nameAr,
        slug: data.slug,
        priceMonthly: data.priceMonthly,
        priceYearly: data.priceYearly,
        currency: data.currency,
        maxEmployees: data.maxEmployees,
        employeesLabel: data.employeesLabel,
        employeesLabelEn: data.employeesLabelEn,
        featuresAr: data.featuresAr,
        featuresEn: data.featuresEn,
        planType: data.planType,
        isPopular: data.isPopular,
        isActive: data.isActive,
        sortOrder: data.sortOrder
      }
    });

    return NextResponse.json({ data: plan }, { status: 201 });
  } catch (error) {
    logApiError("POST pricing plan error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
