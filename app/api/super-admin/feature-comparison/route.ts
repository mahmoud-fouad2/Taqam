/**
 * Plan Feature Comparison API (Super Admin Only)
 * GET  - Get all feature comparisons
 * POST - Create new feature
 */

import { logApiError } from "@/lib/api/route-helper";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function ensureDefaultFeatureComparison() {
  const count = await prisma.planFeatureComparison.count();
  if (count > 0) return;

  await prisma.planFeatureComparison.createMany({
    data: [
      {
        featureAr: "إدارة الموظفين",
        featureEn: "Employee management",
        inStarter: true,
        inBusiness: true,
        inEnterprise: true,
        sortOrder: 1,
        isActive: true
      },
      {
        featureAr: "الحضور والانصراف",
        featureEn: "Time & attendance",
        inStarter: true,
        inBusiness: true,
        inEnterprise: true,
        sortOrder: 2,
        isActive: true
      },
      {
        featureAr: "الإجازات",
        featureEn: "Leave management",
        inStarter: true,
        inBusiness: true,
        inEnterprise: true,
        sortOrder: 3,
        isActive: true
      },
      {
        featureAr: "الرواتب",
        featureEn: "Payroll",
        inStarter: false,
        inBusiness: true,
        inEnterprise: true,
        sortOrder: 4,
        isActive: true
      },
      {
        featureAr: "تكاملات مخصصة",
        featureEn: "Custom integrations",
        inStarter: false,
        inBusiness: false,
        inEnterprise: true,
        sortOrder: 5,
        isActive: true
      }
    ]
  });
}

// GET all feature comparisons
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureDefaultFeatureComparison();

    const features = await prisma.planFeatureComparison.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" }
    });

    return NextResponse.json({ data: features });
  } catch (error) {
    logApiError("GET feature comparison error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST create new feature
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const feature = await prisma.planFeatureComparison.create({
      data: {
        featureAr: body.featureAr,
        featureEn: body.featureEn,
        inStarter: body.inStarter || false,
        inBusiness: body.inBusiness || false,
        inEnterprise: body.inEnterprise || false,
        sortOrder: body.sortOrder || 0,
        isActive: body.isActive ?? true
      }
    });

    return NextResponse.json({ data: feature }, { status: 201 });
  } catch (error) {
    logApiError("POST feature comparison error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
