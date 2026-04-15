import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logApiError } from "@/lib/api/route-helper";
import { prisma } from "@/lib/db";
import { featureCatalogPayloadSchema } from "@/lib/marketing/commercial-schemas";
import {
  getFeatureCatalogReferences,
  isDefaultCommercialFeatureId
} from "@/lib/marketing/feature-catalog-store";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

type RouteParams = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return unauthorized();
    }

    const { id } = await params;
    const body = await req.json();
    const parsed = featureCatalogPayloadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid feature catalog payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const existing = await prisma.commercialFeatureCatalogEntry.findUnique({
      where: { id },
      select: { id: true, featureId: true }
    });

    if (!existing) {
      return NextResponse.json({ error: "Feature not found" }, { status: 404 });
    }

    const conflict = await prisma.commercialFeatureCatalogEntry.findFirst({
      where: {
        featureId: parsed.data.featureId,
        NOT: { id }
      },
      select: { id: true }
    });

    if (conflict) {
      return NextResponse.json({ error: "Feature ID already exists" }, { status: 409 });
    }

    if (
      isDefaultCommercialFeatureId(existing.featureId) &&
      parsed.data.featureId !== existing.featureId
    ) {
      return NextResponse.json({ error: "Default feature IDs cannot be changed" }, { status: 409 });
    }

    const updated = await prisma.commercialFeatureCatalogEntry.update({
      where: { id },
      data: {
        featureId: parsed.data.featureId,
        family: parsed.data.family,
        nameAr: parsed.data.nameAr,
        nameEn: parsed.data.nameEn,
        summaryAr: parsed.data.summaryAr,
        summaryEn: parsed.data.summaryEn,
        status: parsed.data.status,
        commercialTier: parsed.data.commercialTier,
        availability: parsed.data.availability,
        evidencePaths: parsed.data.evidencePaths,
        owner: parsed.data.owner,
        sortOrder: parsed.data.sortOrder,
        isActive: parsed.data.isActive
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "COMMERCIAL_FEATURE_UPDATED",
        entity: "CommercialFeatureCatalogEntry",
        entityId: updated.id,
        newData: {
          featureId: updated.featureId,
          family: updated.family,
          status: updated.status,
          isActive: updated.isActive
        }
      }
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    logApiError("PUT super-admin feature catalog error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return unauthorized();
    }

    const { id } = await params;
    const existing = await prisma.commercialFeatureCatalogEntry.findUnique({
      where: { id },
      select: { id: true, featureId: true }
    });

    if (!existing) {
      return NextResponse.json({ error: "Feature not found" }, { status: 404 });
    }

    if (isDefaultCommercialFeatureId(existing.featureId)) {
      return NextResponse.json(
        { error: "Default catalog features cannot be deleted. Disable them instead." },
        { status: 409 }
      );
    }

    const references = getFeatureCatalogReferences(existing.featureId);
    if (references.length > 0) {
      return NextResponse.json(
        { error: "Feature is referenced by commercial registry surfaces", references },
        { status: 409 }
      );
    }

    await prisma.commercialFeatureCatalogEntry.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "COMMERCIAL_FEATURE_DELETED",
        entity: "CommercialFeatureCatalogEntry",
        entityId: existing.id,
        oldData: { featureId: existing.featureId }
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    logApiError("DELETE super-admin feature catalog error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
