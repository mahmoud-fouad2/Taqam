/**
 * Single Pricing Plan API (Super Admin Only)
 * GET    - Get single plan
 * PUT    - Update plan
 * DELETE - Delete plan
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

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
    console.error("GET pricing plan error:", error);
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

    // Check if plan exists
    const existing = await prisma.pricingPlan.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    // Check slug uniqueness if changed
    if (body.slug && body.slug !== existing.slug) {
      const slugExists = await prisma.pricingPlan.findUnique({
        where: { slug: body.slug }
      });
      if (slugExists) {
        return NextResponse.json({ error: "Slug already exists" }, { status: 400 });
      }
    }

    const plan = await prisma.pricingPlan.update({
      where: { id },
      data: {
        name: body.name,
        nameAr: body.nameAr,
        slug: body.slug,
        priceMonthly: body.priceMonthly,
        priceYearly: body.priceYearly,
        currency: body.currency,
        maxEmployees: body.maxEmployees,
        employeesLabel: body.employeesLabel,
        employeesLabelEn: body.employeesLabelEn,
        featuresAr: body.featuresAr,
        featuresEn: body.featuresEn,
        planType: body.planType,
        isPopular: body.isPopular,
        isActive: body.isActive,
        sortOrder: body.sortOrder
      }
    });

    return NextResponse.json({ data: plan });
  } catch (error) {
    console.error("PUT pricing plan error:", error);
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
    console.error("DELETE pricing plan error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
