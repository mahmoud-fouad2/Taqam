/**
 * Single Feature Comparison API (Super Admin Only)
 * PUT    - Update feature
 * DELETE - Delete feature
 */

import { logApiError } from "@/lib/api/route-helper";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { comparisonFeaturePayloadSchema } from "@/lib/marketing/commercial-schemas";

// PUT update feature
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const parsed = comparisonFeaturePayloadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid comparison payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const feature = await prisma.planFeatureComparison.update({
      where: { id },
      data: {
        featureAr: data.featureAr,
        featureEn: data.featureEn,
        inStarter: data.inStarter,
        inBusiness: data.inBusiness,
        inEnterprise: data.inEnterprise,
        sortOrder: data.sortOrder,
        isActive: data.isActive
      }
    });

    return NextResponse.json({ data: feature });
  } catch (error) {
    logApiError("PUT feature comparison error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE feature
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await prisma.planFeatureComparison.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Feature deleted successfully" });
  } catch (error) {
    logApiError("DELETE feature comparison error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
