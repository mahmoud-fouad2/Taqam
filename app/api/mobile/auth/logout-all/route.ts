import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/db";
import { logger } from "@/lib/logger";
import { requireMobileAuthWithDevice } from "@/lib/mobile/auth";
import { revokeAllRefreshTokensForUser } from "@/lib/mobile/refresh-tokens";
import { clearMobileRefreshCookie } from "@/lib/mobile/cookies";
import { checkRateLimit, withRateLimitHeaders } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const limit = 20;
    const limitInfo = await checkRateLimit(request, {
      keyPrefix: "mobile:auth:logout_all",
      limit,
      windowMs: 5 * 60 * 1000
    });

    if (!limitInfo.allowed) {
      return withRateLimitHeaders(
        NextResponse.json({ error: "Too many requests" }, { status: 429 }),
        { limit, remaining: limitInfo.remaining, resetAt: limitInfo.resetAt }
      );
    }

    const payloadOrRes = await requireMobileAuthWithDevice(request);
    if (payloadOrRes instanceof NextResponse)
      return withRateLimitHeaders(payloadOrRes, {
        limit,
        remaining: limitInfo.remaining,
        resetAt: limitInfo.resetAt
      });

    const count = await revokeAllRefreshTokensForUser(prisma, payloadOrRes.userId);

    await prisma.auditLog.create({
      data: {
        tenantId: payloadOrRes.tenantId,
        userId: payloadOrRes.userId,
        action: "MOBILE_LOGOUT_ALL",
        entity: "User",
        entityId: payloadOrRes.userId
      }
    });

    const res = NextResponse.json({ data: { ok: true, revoked: count } });
    clearMobileRefreshCookie(res);
    return withRateLimitHeaders(res, {
      limit,
      remaining: limitInfo.remaining,
      resetAt: limitInfo.resetAt
    });
  } catch (error) {
    logger.error("Mobile logout-all error", undefined, error);
    return NextResponse.json({ error: "Failed to logout" }, { status: 500 });
  }
}
