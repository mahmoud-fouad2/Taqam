import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logApiError } from "@/lib/api/route-helper";
import { prisma } from "@/lib/db";
import { featureCatalogPayloadSchema } from "@/lib/marketing/commercial-schemas";
import {
  getManagedCommercialFeatureCatalogRows,
  seedDefaultCommercialFeatureCatalog
} from "@/lib/marketing/feature-catalog-store";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return unauthorized();
    }

    const rows = await getManagedCommercialFeatureCatalogRows();
    return NextResponse.json({ data: rows });
  } catch (error) {
    logApiError("GET super-admin feature catalog error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return unauthorized();
    }

    const body = await req.json();
    const parsed = featureCatalogPayloadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid feature catalog payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await seedDefaultCommercialFeatureCatalog();

    const settings = await prisma.platformSettings.findFirst({ select: { id: true } });
    if (!settings) {
      return NextResponse.json({ error: "Platform settings not initialized" }, { status: 500 });
    }

    const exists = await prisma.commercialFeatureCatalogEntry.findUnique({
      where: { featureId: parsed.data.featureId },
      select: { id: true }
    });

    if (exists) {
      return NextResponse.json({ error: "Feature ID already exists" }, { status: 409 });
    }

    const feature = await prisma.commercialFeatureCatalogEntry.create({
      data: {
        platformSettingsId: settings.id,
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
        action: "COMMERCIAL_FEATURE_CREATED",
        entity: "CommercialFeatureCatalogEntry",
        entityId: feature.id,
        newData: {
          featureId: feature.featureId,
          family: feature.family,
          status: feature.status
        }
      }
    });

    return NextResponse.json({ data: feature }, { status: 201 });
  } catch (error) {
    logApiError("POST super-admin feature catalog error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
