import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { compare } from "bcryptjs";

import prisma from "@/lib/db";
import { logger } from "@/lib/logger";
import { getMobileDeviceHeaders } from "@/lib/mobile/device";
import { issueMobileAccessToken } from "@/lib/mobile/jwt";
import { mintRefreshToken, upsertMobileDevice } from "@/lib/mobile/refresh-tokens";
import { setMobileRefreshCookie } from "@/lib/mobile/cookies";
import { checkRateLimit, withRateLimitHeaders } from "@/lib/rate-limit";
import { getTenantAccessIssue, getTenantAccessMessage } from "@/lib/tenant-access";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const limit = 10;
    const limitInfo = checkRateLimit(request, {
      keyPrefix: "mobile:auth:login",
      limit,
      windowMs: 5 * 60 * 1000,
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

    let body;
    try {
      body = await request.json();
    } catch (e) {
      logger.error("JSON parsing error in login", { error: String(e) });
      return withRateLimitHeaders(
        NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 }),
        { limit, remaining: limitInfo.remaining, resetAt: limitInfo.resetAt }
      );
    }

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return withRateLimitHeaders(
        NextResponse.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 }),
        { limit, remaining: limitInfo.remaining, resetAt: limitInfo.resetAt }
      );
    }

    const email = parsed.data.email.toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true,
        permissions: true,
        tenantId: true,
        status: true,
        lockedUntil: true,
        failedLoginAttempts: true,
        password: true,
        tenant: {
          select: {
            id: true,
            slug: true,
            name: true,
            nameAr: true,
            status: true,
            plan: true,
            planExpiresAt: true,
          },
        },
        employee: { select: { id: true } },
      },
    });

    if (!user) {
      return withRateLimitHeaders(
        NextResponse.json({ error: "Invalid credentials" }, { status: 401 }),
        { limit, remaining: limitInfo.remaining, resetAt: limitInfo.resetAt }
      );
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return withRateLimitHeaders(
        NextResponse.json({ error: "Account is temporarily locked" }, { status: 403 }),
        { limit, remaining: limitInfo.remaining, resetAt: limitInfo.resetAt }
      );
    }

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

    const tenantIssue = user.role !== "SUPER_ADMIN"
      ? getTenantAccessIssue(user.tenantId ? user.tenant : null)
      : null;

    if (tenantIssue) {
      return withRateLimitHeaders(
        NextResponse.json({ error: getTenantAccessMessage(tenantIssue, "en") }, { status: 403 }),
        { limit, remaining: limitInfo.remaining, resetAt: limitInfo.resetAt }
      );
    }

    if (!user.employee?.id) {
      return withRateLimitHeaders(
        NextResponse.json({ error: "هذا التطبيق مخصص للموظفين فقط" }, { status: 403 }),
        { limit, remaining: limitInfo.remaining, resetAt: limitInfo.resetAt }
      );
    }

    const passwordOk = await compare(parsed.data.password, user.password);
    if (!passwordOk) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: { increment: 1 },
          lockedUntil:
            user.failedLoginAttempts >= 4
              ? new Date(Date.now() + 30 * 60 * 1000)
              : undefined,
        },
      });

      return withRateLimitHeaders(
        NextResponse.json({ error: "Invalid credentials" }, { status: 401 }),
        { limit, remaining: limitInfo.remaining, resetAt: limitInfo.resetAt }
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        action: "MOBILE_LOGIN",
        entity: "User",
        entityId: user.id,
      },
    });

    const device = await upsertMobileDevice(prisma, {
      userId: user.id,
      deviceId: deviceHeaders.deviceId,
      platform: deviceHeaders.platform,
      name: deviceHeaders.name,
      appVersion: deviceHeaders.appVersion,
    });

    const xff = request.headers.get("x-forwarded-for") ?? undefined;
    const ipAddress = xff ? xff.split(",")[0]?.trim() : undefined;

    const { refreshToken, expiresAt } = await mintRefreshToken(prisma, {
      userId: user.id,
      mobileDeviceId: device.id,
      userAgent: deviceHeaders.userAgent,
      ipAddress,
    });

    const accessToken = await issueMobileAccessToken({
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role,
      employeeId: user.employee.id,
      deviceId: deviceHeaders.deviceId,
    });

    const res = NextResponse.json({
        data: {
          accessToken,
          refreshToken,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            avatar: user.avatar,
            role: user.role,
            permissions: user.permissions,
            tenantId: user.tenantId,
            tenant: user.tenant,
            employeeId: user.employee.id,
          },
        },
      });

    // More secure for WebView clients: keep refresh token in httpOnly cookie.
    // Still return refreshToken in JSON for backward compatibility with native clients.
    setMobileRefreshCookie(res, refreshToken, { expiresAt });

    return withRateLimitHeaders(res, { limit, remaining: limitInfo.remaining, resetAt: limitInfo.resetAt });
  } catch (error) {
    logger.error("Mobile login error", undefined, error);
    return NextResponse.json({ error: "Failed to login" }, { status: 500 });
  }
}
