/**
 * Delete all read notifications
 * DELETE /api/notifications/read
 */

import { NextRequest, NextResponse } from "next/server";
import {
  errorResponse,
  logApiError,
  nullDataResponse,
  requireSession
} from "@/lib/api/route-helper";
import prisma from "@/lib/db";

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireSession(request);
    if (!auth.ok) return auth.response;
    const { session } = auth;

    const userId = session.user.id;
    const tenantId = session.user.tenantId ?? null;

    await prisma.notification.deleteMany({
      where: { userId, ...(tenantId ? { tenantId } : {}), isRead: true }
    });

    return nullDataResponse();
  } catch (error) {
    logApiError("Error deleting read notifications", error);
    return errorResponse("Failed to delete read notifications");
  }
}
