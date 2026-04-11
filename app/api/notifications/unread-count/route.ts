/**
 * Notifications Unread Count API
 * GET /api/notifications/unread-count
 */

import { NextRequest, NextResponse } from "next/server";
import { dataResponse, errorResponse, logApiError, requireSession } from "@/lib/api/route-helper";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireSession(request);
    if (!auth.ok) return auth.response;
    const { session } = auth;

    const userId = session.user.id;
    const tenantId = session.user.tenantId ?? null;

    const count = await prisma.notification.count({
      where: {
        userId,
        ...(tenantId ? { tenantId } : {}),
        isRead: false
      }
    });

    return dataResponse({ count });
  } catch (error) {
    logApiError("Error fetching unread count", error);
    return errorResponse("Failed to fetch unread count");
  }
}
