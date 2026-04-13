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
import { logCommercialAuditEntry } from "@/lib/marketing/commercial-audit";
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

    const existing = await prisma.planFeatureComparison.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json({ error: "Feature not found" }, { status: 404 });
    }

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

    await logCommercialAuditEntry({
      userId: session.user.id,
      action: "COMMERCIAL_COMPARISON_ROW_UPDATED",
      entity: "PlanFeatureComparison",
      entityId: feature.id,
      oldData: {
        featureAr: existing.featureAr,
        featureEn: existing.featureEn,
        inStarter: existing.inStarter,
        inBusiness: existing.inBusiness,
        inEnterprise: existing.inEnterprise,
        isActive: existing.isActive,
        sortOrder: existing.sortOrder
      },
      newData: {
        featureAr: feature.featureAr,
        featureEn: feature.featureEn,
        inStarter: feature.inStarter,
        inBusiness: feature.inBusiness,
        inEnterprise: feature.inEnterprise,
        isActive: feature.isActive,
        sortOrder: feature.sortOrder
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

    const existing = await prisma.planFeatureComparison.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json({ error: "Feature not found" }, { status: 404 });
    }

    await prisma.planFeatureComparison.delete({
      where: { id }
    });

    await logCommercialAuditEntry({
      userId: session.user.id,
      action: "COMMERCIAL_COMPARISON_ROW_DELETED",
      entity: "PlanFeatureComparison",
      entityId: id,
      oldData: {
        featureAr: existing.featureAr,
        featureEn: existing.featureEn,
        inStarter: existing.inStarter,
        inBusiness: existing.inBusiness,
        inEnterprise: existing.inEnterprise,
        isActive: existing.isActive,
        sortOrder: existing.sortOrder
      }
    });

    return NextResponse.json({ message: "Feature deleted successfully" });
  } catch (error) {
    logApiError("DELETE feature comparison error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
