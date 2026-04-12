/**
 * Public Pricing API (For Frontend)
 * GET - Get active pricing plans (no auth required)
 */

import { logApiError } from "@/lib/api/route-helper";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET active pricing plans for frontend
export async function GET() {
  try {
    const plans = await prisma.pricingPlan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        nameAr: true,
        slug: true,
        priceMonthly: true,
        priceYearly: true,
        currency: true,
        maxEmployees: true,
        employeesLabel: true,
        employeesLabelEn: true,
        featuresAr: true,
        featuresEn: true,
        isPopular: true
      }
    });

    const comparison = await prisma.planFeatureComparison.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: {
        featureAr: true,
        featureEn: true,
        inStarter: true,
        inBusiness: true,
        inEnterprise: true
      }
    });

    return NextResponse.json({
      data: {
        plans,
        comparison
      }
    });
  } catch (error) {
    logApiError("GET public pricing error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
