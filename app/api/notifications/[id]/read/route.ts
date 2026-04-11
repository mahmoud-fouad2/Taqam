/**
 * Mark notification as read
 * PATCH /api/notifications/:id/read
 */

import { NextRequest, NextResponse } from "next/server";
import {
  errorResponse,
  logApiError,
  notFoundResponse,
  nullDataResponse,
  requireSession
} from "@/lib/api/route-helper";
import prisma from "@/lib/db";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireSession(_request);
    if (!auth.ok) return auth.response;
    const { session } = auth;

    const userId = session.user.id;
    const tenantId = session.user.tenantId ?? null;
    const { id } = await params;

    const existing = await prisma.notification.findFirst({
      where: { id, userId, ...(tenantId ? { tenantId } : {}) },
      select: { id: true }
    });

    if (!existing) {
      return notFoundResponse();
    }

    await prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() }
    });

    return nullDataResponse();
  } catch (error) {
    logApiError("Error marking notification as read", error);
    return errorResponse("Failed to mark notification as read");
  }
}
