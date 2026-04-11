import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import prisma from "@/lib/db";
import { logger } from "@/lib/logger";
import { getMobileDeviceHeaders } from "@/lib/mobile/device";
import { rotateRefreshToken } from "@/lib/mobile/refresh-tokens";
import { issueMobileAccessToken } from "@/lib/mobile/jwt";
import {
  clearMobileRefreshCookie,
  getMobileRefreshCookie,
  setMobileRefreshCookie
} from "@/lib/mobile/cookies";
import { checkRateLimit, withRateLimitHeaders } from "@/lib/rate-limit";

const schema = z.object({
  refreshToken: z.string().min(10).optional()
});

export async function POST(request: NextRequest) {
  try {
    const limit = 30;
    const limitInfo = await checkRateLimit(request, {
      keyPrefix: "mobile:auth:refresh",
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
      if (parsed.success && parsed.data.refreshToken) {
        bodyRefreshToken = parsed.data.refreshToken;
      }
    } catch {
      // Allow empty body for cookie-based refresh.
    }

    const cookieRefreshToken = getMobileRefreshCookie(request);
    const rawRefreshToken = bodyRefreshToken ?? cookieRefreshToken;
    const fromCookie = !bodyRefreshToken && !!cookieRefreshToken;

    if (!rawRefreshToken) {
      return withRateLimitHeaders(
        NextResponse.json({ error: "Invalid payload" }, { status: 400 }),
        { limit, remaining: limitInfo.remaining, resetAt: limitInfo.resetAt }
      );
    }

    const xff = request.headers.get("x-forwarded-for") ?? undefined;
    const ipAddress = xff ? xff.split(",")[0]?.trim() : undefined;

    const rotated = await rotateRefreshToken(prisma, {
      rawRefreshToken,
      deviceId: deviceHeaders.deviceId,
      userAgent: deviceHeaders.userAgent,
      ipAddress
    });

    if (!rotated.ok) {
      const res = NextResponse.json({ error: "Invalid refresh token" }, { status: 401 });
      // If the client relied on cookie-based refresh, clear it to avoid infinite refresh loops.
      if (fromCookie) clearMobileRefreshCookie(res);
      return withRateLimitHeaders(res, {
        limit,
        remaining: limitInfo.remaining,
        resetAt: limitInfo.resetAt
      });
    }

    await prisma.mobileDevice.update({
      where: { id: rotated.mobileDeviceId },
      data: { lastSeenAt: new Date() }
    });

    const user = await prisma.user.findUnique({
      where: { id: rotated.userId },
      select: {
        id: true,
        role: true,
        tenantId: true,
        status: true,
        tenant: { select: { status: true } },
        employee: { select: { id: true } }
      }
    });

    if (!user)
      return withRateLimitHeaders(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), {
        limit,
        remaining: limitInfo.remaining,
        resetAt: limitInfo.resetAt
      });

    if (user.status === "INACTIVE" || user.status === "SUSPENDED") {
      return withRateLimitHeaders(
        NextResponse.json({ error: "Account is disabled" }, { status: 403 }),
        { limit, remaining: limitInfo.remaining, resetAt: limitInfo.resetAt }
      );
    }

    if (user.status === "PENDING_VERIFICATION") {
      return withRateLimitHeaders(
        NextResponse.json({ error: "Email verification required" }, { status: 403 }),
        { limit, remaining: limitInfo.remaining, resetAt: limitInfo.resetAt }
      );
    }

    if (user.tenant && user.tenant.status !== "ACTIVE" && user.role !== "SUPER_ADMIN") {
      return withRateLimitHeaders(
        NextResponse.json({ error: "Tenant is not active" }, { status: 403 }),
        { limit, remaining: limitInfo.remaining, resetAt: limitInfo.resetAt }
      );
    }

    if (!user.employee?.id) {
      return withRateLimitHeaders(
        NextResponse.json({ error: "هذا التطبيق مخصص للموظفين فقط" }, { status: 403 }),
        { limit, remaining: limitInfo.remaining, resetAt: limitInfo.resetAt }
      );
    }

    await prisma.auditLog.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        action: "MOBILE_REFRESH",
        entity: "User",
        entityId: user.id
      }
    });

    const accessToken = await issueMobileAccessToken({
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role,
      employeeId: user.employee.id,
      deviceId: deviceHeaders.deviceId
    });

    const res = NextResponse.json({
      data: {
        accessToken,
        refreshToken: rotated.refreshToken
      }
    });

    // Rotate cookie alongside the DB refresh token rotation.
    setMobileRefreshCookie(res, rotated.refreshToken, { expiresAt: rotated.expiresAt });

    return withRateLimitHeaders(res, {
      limit,
      remaining: limitInfo.remaining,
      resetAt: limitInfo.resetAt
    });
  } catch (error) {
    logger.error("Mobile refresh error", undefined, error);
    return NextResponse.json({ error: "Failed to refresh" }, { status: 500 });
  }
}
