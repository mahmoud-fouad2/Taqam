import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { logger } from "@/lib/logger";
import { requireMobileEmployeeAuthWithDevice } from "@/lib/mobile/auth";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * PUT /api/mobile/notifications/[id]/read
 * Mark a single notification as read.
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  const payloadOrRes = await requireMobileEmployeeAuthWithDevice(request);
  if (payloadOrRes instanceof NextResponse) return payloadOrRes;

  const { userId } = payloadOrRes;
  const { id } = await context.params;

  try {
    await prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true, readAt: new Date() }
    });

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    logger.error("Mobile notification read error", undefined, error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
