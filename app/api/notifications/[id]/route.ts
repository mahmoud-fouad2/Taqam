/**
 * Notification API
 * GET /api/notifications/:id
 * DELETE /api/notifications/:id
 */

import { NextRequest } from "next/server";

import {
  dataResponse,
  errorResponse,
  logApiError,
  notFoundResponse,
  requireSession
} from "@/lib/api/route-helper";
import prisma from "@/lib/db";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireSession(_request);
    if (!auth.ok) return auth.response;
    const { session } = auth;

    const userId = session.user.id;
    const tenantId = session.user.tenantId ?? null;
    const { id } = await params;

    const notification = await prisma.notification.findFirst({
      where: {
        id,
        userId,
        ...(tenantId ? { tenantId } : {})
      },
      select: {
        id: true,
        type: true,
        title: true,
        message: true,
        link: true,
        isRead: true,
        createdAt: true
      }
    });

    if (!notification) {
      return notFoundResponse();
    }

    return dataResponse({
      ...notification,
      createdAt: notification.createdAt.toISOString()
    });
  } catch (error) {
    logApiError("Error fetching notification", error);
    return errorResponse("Failed to fetch notification");
  }
}

export async function DELETE(
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

    await prisma.notification.delete({ where: { id } });

    return dataResponse(null);
  } catch (error) {
    logApiError("Error deleting notification", error);
    return errorResponse("Failed to delete notification");
  }
}
