/**
 * Notifications API
 * GET /api/notifications - List notifications
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

    const { searchParams } = new URL(request.url);

    const page = searchParams.get("page") ? Number(searchParams.get("page")) : 1;
    const pageSize = searchParams.get("pageSize") ? Number(searchParams.get("pageSize")) : 20;

    const type = searchParams.get("type") || undefined;
    const isReadParam = searchParams.get("isRead");
    const isRead = isReadParam === null ? undefined : isReadParam === "true";

    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    const where: any = { userId };
    if (tenantId) where.tenantId = tenantId;
    if (type) where.type = type;
    if (isRead !== undefined) where.isRead = isRead;

    if (startDate || endDate) {
      where.createdAt = {
        ...(startDate ? { gte: new Date(startDate) } : {}),
        ...(endDate ? { lte: new Date(endDate) } : {})
      };
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          type: true,
          title: true,
          message: true,
          link: true,
          isRead: true,
          createdAt: true
        }
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: { userId, ...(tenantId ? { tenantId } : {}), isRead: false }
      })
    ]);

    return dataResponse({
      notifications: notifications.map((n) => ({
        ...n,
        createdAt: n.createdAt.toISOString()
      })),
      total,
      unreadCount,
      page,
      pageSize
    });
  } catch (error) {
    logApiError("Error fetching notifications", error);
    return errorResponse("Failed to fetch notifications");
  }
}
