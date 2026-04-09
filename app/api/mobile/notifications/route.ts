import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireMobileEmployeeAuthWithDevice } from "@/lib/mobile/auth";

/**
 * GET /api/mobile/notifications
 * List notifications for the authenticated user.
 * Query: ?unread=true&limit=30
 *
 * POST /api/mobile/notifications  (action: "read-all")
 * Mark all notifications as read.
 */
export async function GET(request: NextRequest) {
  const payloadOrRes = await requireMobileEmployeeAuthWithDevice(request);
  if (payloadOrRes instanceof NextResponse) return payloadOrRes;

  const { userId, tenantId } = payloadOrRes;

  try {
    const url = new URL(request.url);
    const unreadOnly = url.searchParams.get("unread") === "true";
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit")) || 30));
    const cursor = url.searchParams.get("cursor") ?? undefined;

    const where: any = { userId };
    if (tenantId) where.tenantId = tenantId;
    if (unreadOnly) where.isRead = false;

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true,
        type: true,
        title: true,
        message: true,
        link: true,
        isRead: true,
        createdAt: true,
      },
    });

    const hasMore = notifications.length > limit;
    if (hasMore) notifications.pop();

    const unreadCount = await prisma.notification.count({
      where: { userId, ...(tenantId ? { tenantId } : {}), isRead: false },
    });

    return NextResponse.json({
      data: notifications.map((n) => ({
        ...n,
        createdAt: n.createdAt.toISOString(),
      })),
      unreadCount,
      nextCursor: hasMore ? notifications[notifications.length - 1]?.id : null,
    });
  } catch (error) {
    console.error("Mobile notifications GET error:", error);
    return NextResponse.json({ error: "Failed to load notifications" }, { status: 500 });
  }
}

/**
 * POST /api/mobile/notifications — mark all as read
 */
export async function POST(request: NextRequest) {
  const payloadOrRes = await requireMobileEmployeeAuthWithDevice(request);
  if (payloadOrRes instanceof NextResponse) return payloadOrRes;

  const { userId, tenantId } = payloadOrRes;

  try {
    const where: any = { userId, isRead: false };
    if (tenantId) where.tenantId = tenantId;

    await prisma.notification.updateMany({
      where,
      data: { isRead: true, readAt: new Date() },
    });

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    console.error("Mobile notifications POST error:", error);
    return NextResponse.json({ error: "Failed to mark as read" }, { status: 500 });
  }
}
