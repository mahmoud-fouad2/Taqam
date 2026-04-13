/**
 * Single Pricing Plan API (Super Admin Only)
 * GET    - Get single plan
 * PUT    - Update plan
 * DELETE - Delete plan
 */

import { logApiError } from "@/lib/api/route-helper";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { pricingPlanPayloadSchema } from "@/lib/marketing/commercial-schemas";

// GET single plan
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const plan = await prisma.pricingPlan.findUnique({
      where: { id }
    });

    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    return NextResponse.json({ data: plan });
  } catch (error) {
    logApiError("GET pricing plan error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT update plan
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const parsed = pricingPlanPayloadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid plan payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Check if plan exists
    const existing = await prisma.pricingPlan.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    // Check slug uniqueness if changed
    if (data.slug !== existing.slug) {
      const slugExists = await prisma.pricingPlan.findUnique({
        where: { slug: data.slug }
      });
      if (slugExists) {
        return NextResponse.json({ error: "Slug already exists" }, { status: 400 });
      }
    }

    const plan = await prisma.pricingPlan.update({
      where: { id },
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

    return NextResponse.json({ data: plan });
  } catch (error) {
    logApiError("PUT pricing plan error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE plan
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await prisma.pricingPlan.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Plan deleted successfully" });
  } catch (error) {
    logApiError("DELETE pricing plan error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
