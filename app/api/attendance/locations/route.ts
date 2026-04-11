import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import {
  dataResponse,
  errorResponse,
  forbiddenResponse,
  logApiError,
  requireSession
} from "@/lib/api/route-helper";

function isSuperAdmin(role: string | undefined) {
  return role === "SUPER_ADMIN";
}

function canManageAttendanceSettings(role: string | undefined) {
  return role === "TENANT_ADMIN" || role === "HR_MANAGER" || role === "SUPER_ADMIN";
}

const createSchema = z.object({
  tenantId: z.string().optional(),
  name: z.string().min(2).max(120),
  nameAr: z.string().min(2).max(120).optional(),
  address: z.string().max(500).optional(),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radiusMeters: z.coerce.number().int().min(10).max(5000).default(150),
  isActive: z.boolean().optional()
});

export async function GET(request: NextRequest) {
  try {
    const auth = await requireSession(request);
    if (!auth.ok) return auth.response;
    const { session } = auth;

    const { searchParams } = new URL(request.url);
    const requestedTenantId = searchParams.get("tenantId") ?? undefined;

    const tenantId = isSuperAdmin(session.user.role)
      ? (requestedTenantId ?? session.user.tenantId)
      : session.user.tenantId;

    if (!tenantId) {
      return errorResponse("Tenant context required", 400);
    }

    const items = await prisma.tenantWorkLocation.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" }
    });

    return dataResponse({ items });
  } catch (error) {
    logApiError("Error fetching work locations", error);
    return errorResponse("Failed to fetch work locations");
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireSession(request);
    if (!auth.ok) return auth.response;
    const { session } = auth;

    if (!canManageAttendanceSettings(session.user.role)) {
      return forbiddenResponse();
    }

    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("Invalid payload", 400, { issues: parsed.error.issues });
    }

    const tenantId = isSuperAdmin(session.user.role)
      ? (parsed.data.tenantId ?? session.user.tenantId)
      : session.user.tenantId;

    if (!tenantId) {
      return errorResponse("Tenant context required", 400);
    }

    const item = await prisma.tenantWorkLocation.create({
      data: {
        tenantId,
        name: parsed.data.name,
        nameAr: parsed.data.nameAr,
        address: parsed.data.address,
        lat: parsed.data.lat,
        lng: parsed.data.lng,
        radiusMeters: parsed.data.radiusMeters,
        isActive: parsed.data.isActive ?? true
      }
    });

    return dataResponse(item, 201);
  } catch (error) {
    logApiError("Error creating work location", error);
    return errorResponse("Failed to create work location");
  }
}
