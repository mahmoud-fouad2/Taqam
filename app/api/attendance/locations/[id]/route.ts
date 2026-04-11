import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import {
  dataResponse,
  forbiddenResponse,
  logApiError,
  notFoundResponse,
  requireSession,
  errorResponse
} from "@/lib/api/route-helper";

function isSuperAdmin(role: string | undefined) {
  return role === "SUPER_ADMIN";
}

function canManageAttendanceSettings(role: string | undefined) {
  return role === "TENANT_ADMIN" || role === "HR_MANAGER" || role === "SUPER_ADMIN";
}

const updateSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  nameAr: z.string().min(2).max(120).optional(),
  address: z.string().max(500).optional().nullable(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radiusMeters: z.coerce.number().int().min(10).max(5000).optional(),
  isActive: z.boolean().optional()
});

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireSession(request);
    if (!auth.ok) return auth.response;
    const { session } = auth;

    if (!canManageAttendanceSettings(session.user.role)) {
      return forbiddenResponse();
    }

    const { id } = await context.params;

    const existing = await prisma.tenantWorkLocation.findUnique({
      where: { id },
      select: { id: true, tenantId: true }
    });

    if (!existing) {
      return notFoundResponse();
    }

    if (!isSuperAdmin(session.user.role)) {
      if (!session.user.tenantId || existing.tenantId !== session.user.tenantId) {
        return forbiddenResponse();
      }
    }

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("Invalid payload", 400, { issues: parsed.error.issues });
    }

    const updated = await prisma.tenantWorkLocation.update({
      where: { id },
      data: parsed.data
    });

    return dataResponse(updated);
  } catch (error) {
    logApiError("Error updating work location", error);
    return errorResponse("Failed to update work location");
  }
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireSession(_request);
    if (!auth.ok) return auth.response;
    const { session } = auth;

    if (!canManageAttendanceSettings(session.user.role)) {
      return forbiddenResponse();
    }

    const { id } = await context.params;

    const existing = await prisma.tenantWorkLocation.findUnique({
      where: { id },
      select: { id: true, tenantId: true }
    });

    if (!existing) {
      return notFoundResponse();
    }

    if (!isSuperAdmin(session.user.role)) {
      if (!session.user.tenantId || existing.tenantId !== session.user.tenantId) {
        return forbiddenResponse();
      }
    }

    await prisma.tenantWorkLocation.delete({ where: { id } });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    logApiError("Error deleting work location", error);
    return errorResponse("Failed to delete work location");
  }
}
