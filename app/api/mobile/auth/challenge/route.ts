import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/db";
import { logger } from "@/lib/logger";
import { requireMobileEmployeeAuthWithDevice } from "@/lib/mobile/auth";
import { createChallenge } from "@/lib/mobile/challenge";
import { checkRateLimit, withRateLimitHeaders } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const limit = 60;
    const limitInfo = await checkRateLimit(request, {
      keyPrefix: "mobile:auth:challenge",
      limit,
      windowMs: 5 * 60 * 1000,
    });

    if (!limitInfo.allowed) {
      return withRateLimitHeaders(
        NextResponse.json({ error: "Too many requests" }, { status: 429 }),
        { limit, remaining: limitInfo.remaining, resetAt: limitInfo.resetAt }
      );
    }

    const payloadOrRes = await requireMobileEmployeeAuthWithDevice(request);
    if (payloadOrRes instanceof NextResponse)
      return withRateLimitHeaders(payloadOrRes, { limit, remaining: limitInfo.remaining, resetAt: limitInfo.resetAt });

    const device = await prisma.mobileDevice.findUnique({
      where: { userId_deviceId: { userId: payloadOrRes.userId, deviceId: payloadOrRes.deviceId } },
      select: { id: true },
    });

    if (!device) {
      return withRateLimitHeaders(
        NextResponse.json({ error: "Device not registered" }, { status: 400 }),
        { limit, remaining: limitInfo.remaining, resetAt: limitInfo.resetAt }
      );
    }

    const challenge = await createChallenge(prisma, {
      userId: payloadOrRes.userId,
      mobileDeviceId: device.id,
    });

    return withRateLimitHeaders(NextResponse.json({ data: challenge }), {
      limit,
      remaining: limitInfo.remaining,
      resetAt: limitInfo.resetAt,
    });
  } catch (error) {
    logger.error("Mobile challenge error", undefined, error);
    return NextResponse.json({ error: "Failed to create challenge" }, { status: 500 });
  }
}
