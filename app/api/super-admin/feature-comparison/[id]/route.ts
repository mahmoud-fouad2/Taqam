/**
 * Single Feature Comparison API (Super Admin Only)
 * PUT    - Update feature
 * DELETE - Delete feature
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// PUT update feature
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const feature = await prisma.planFeatureComparison.update({
      where: { id },
      data: {
        featureAr: body.featureAr,
        featureEn: body.featureEn,
        inStarter: body.inStarter,
        inBusiness: body.inBusiness,
        inEnterprise: body.inEnterprise,
        sortOrder: body.sortOrder,
        isActive: body.isActive
      }
    });

    return NextResponse.json({ data: feature });
  } catch (error) {
    console.error("PUT feature comparison error:", error);
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
    console.error("DELETE feature comparison error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
