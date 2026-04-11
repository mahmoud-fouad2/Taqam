import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import prisma from "@/lib/db";
import { logger } from "@/lib/logger";
import { getMobileDeviceHeaders } from "@/lib/mobile/device";
import { hashRefreshToken, revokeRefreshToken } from "@/lib/mobile/refresh-tokens";
import { clearMobileRefreshCookie, getMobileRefreshCookie } from "@/lib/mobile/cookies";
import { checkRateLimit, withRateLimitHeaders } from "@/lib/rate-limit";

const schema = z.object({
  refreshToken: z.string().min(10).optional()
});

export async function POST(request: NextRequest) {
  try {
    const limit = 30;
    const limitInfo = await checkRateLimit(request, {
      keyPrefix: "mobile:auth:logout",
      limit,
      windowMs: 5 * 60 * 1000
    });

    if (!limitInfo.allowed) {
      return withRateLimitHeaders(
        NextResponse.json({ error: "Too many requests" }, { status: 429 }),
        { limit, remaining: limitInfo.remaining, resetAt: limitInfo.resetAt }
      );
    }

    let deviceHeaders;
    try {
      deviceHeaders = getMobileDeviceHeaders(request);
    } catch {
      return withRateLimitHeaders(
        NextResponse.json({ error: "Missing or invalid device" }, { status: 400 }),
        { limit, remaining: limitInfo.remaining, resetAt: limitInfo.resetAt }
      );
    }

    let bodyRefreshToken: string | null = null;
    try {
      const body = await request.json();
      const parsed = schema.safeParse(body);
      if (parsed.success && parsed.data.refreshToken) bodyRefreshToken = parsed.data.refreshToken;
    } catch {
      // Allow empty body (cookie-based logout).
    }

    const cookieRefreshToken = getMobileRefreshCookie(request);
    const rawRefreshToken = bodyRefreshToken ?? cookieRefreshToken;
    if (!rawRefreshToken) {
      const res = NextResponse.json({ error: "Invalid payload" }, { status: 400 });
      clearMobileRefreshCookie(res);
      return withRateLimitHeaders(res, {
        limit,
        remaining: limitInfo.remaining,
        resetAt: limitInfo.resetAt
      });
    }

    const ok = await revokeRefreshToken(prisma, {
      rawRefreshToken,
      deviceId: deviceHeaders.deviceId
    });

    // best-effort audit log: only if token was valid (otherwise we don't know user)
    if (ok) {
      const tokenHash = hashRefreshToken(rawRefreshToken);
      const row = await prisma.mobileRefreshToken.findUnique({
        where: { tokenHash },
        select: { userId: true, user: { select: { tenantId: true } } }
      });
      if (row) {
        await prisma.auditLog.create({
          data: {
            tenantId: row.user.tenantId,
            userId: row.userId,
            action: "MOBILE_LOGOUT",
            entity: "User",
            entityId: row.userId
          }
        });
      }
    }

    const res = NextResponse.json({ data: { ok: true } });
    clearMobileRefreshCookie(res);
    return withRateLimitHeaders(res, {
      limit,
      remaining: limitInfo.remaining,
      resetAt: limitInfo.resetAt
    });
  } catch (error) {
    logger.error("Mobile logout error", undefined, error);
    return NextResponse.json({ error: "Failed to logout" }, { status: 500 });
  }
}
