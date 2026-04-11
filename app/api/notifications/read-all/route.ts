/**
 * Mark all notifications as read
 * PATCH /api/notifications/read-all
 */

import { NextRequest, NextResponse } from "next/server";
import {
  errorResponse,
  logApiError,
  nullDataResponse,
  requireSession
} from "@/lib/api/route-helper";
import prisma from "@/lib/db";

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireSession(request);
    if (!auth.ok) return auth.response;
    const { session } = auth;

    const userId = session.user.id;
    const tenantId = session.user.tenantId ?? null;

    await prisma.notification.updateMany({
      where: { userId, ...(tenantId ? { tenantId } : {}), isRead: false },
      data: { isRead: true, readAt: new Date() }
    });

    return nullDataResponse();
  } catch (error) {
    logApiError("Error marking all notifications as read", error);
    return errorResponse("Failed to mark all notifications as read");
  }
}
