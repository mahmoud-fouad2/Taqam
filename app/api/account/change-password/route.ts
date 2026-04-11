import { NextRequest, NextResponse } from "next/server";
import {
  errorResponse,
  logApiError,
  notFoundResponse,
  requireSession,
  validationErrorResponse
} from "@/lib/api/route-helper";
import { hashPassword, verifyPassword } from "@/lib/auth";
import prisma from "@/lib/db";
import { logger } from "@/lib/logger";
import { revokeAllRefreshTokensForUser } from "@/lib/mobile/refresh-tokens";
import { checkRateLimit, withRateLimitHeaders } from "@/lib/rate-limit";
import { z } from "zod";

const CHANGE_PASSWORD_RATE_LIMIT = {
  limit: 6,
  windowMs: 15 * 60 * 1000,
  keyPrefix: "api:account:change_password:user"
} as const;

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(200)
});

export async function POST(request: NextRequest) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const { session } = auth;

  const limitInfo = await checkRateLimit(request, {
    ...CHANGE_PASSWORD_RATE_LIMIT,
    identifier: session.user.id
  });

  if (!limitInfo.allowed) {
    return withRateLimitHeaders(
      NextResponse.json({ error: "Too many requests" }, { status: 429 }),
      {
        limit: CHANGE_PASSWORD_RATE_LIMIT.limit,
        remaining: limitInfo.remaining,
        resetAt: limitInfo.resetAt
      }
    );
  }

  try {
    const rawBody = await request.json();
    const parsed = changePasswordSchema.safeParse(rawBody);
    if (!parsed.success) {
      return withRateLimitHeaders(
        validationErrorResponse(parsed.error.flatten(), "بيانات غير صالحة"),
        {
          limit: CHANGE_PASSWORD_RATE_LIMIT.limit,
          remaining: limitInfo.remaining,
          resetAt: limitInfo.resetAt
        }
      );
    }
    const { currentPassword, newPassword } = parsed.data;

    // Get current user with password
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, password: true, tenantId: true }
    });

    if (!user || !user.password) {
      return withRateLimitHeaders(notFoundResponse("المستخدم غير موجود"), {
        limit: CHANGE_PASSWORD_RATE_LIMIT.limit,
        remaining: limitInfo.remaining,
        resetAt: limitInfo.resetAt
      });
    }

    // Verify current password
    const isValidPassword = await verifyPassword(currentPassword, user.password);
    if (!isValidPassword) {
      return withRateLimitHeaders(errorResponse("كلمة المرور الحالية غير صحيحة", 400), {
        limit: CHANGE_PASSWORD_RATE_LIMIT.limit,
        remaining: limitInfo.remaining,
        resetAt: limitInfo.resetAt
      });
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);
    const passwordChangedAt = new Date();

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          passwordChangedAt
        }
      });

      await revokeAllRefreshTokensForUser(tx as any, user.id);

      await tx.auditLog.create({
        data: {
          tenantId: user.tenantId,
          userId: user.id,
          action: "PASSWORD_CHANGED",
          entity: "User",
          entityId: user.id
        }
      });
    });

    logger.info("Password changed successfully", { userId: session.user.id });

    return withRateLimitHeaders(
      NextResponse.json({ success: true, message: "تم تغيير كلمة المرور بنجاح" }),
      {
        limit: CHANGE_PASSWORD_RATE_LIMIT.limit,
        remaining: limitInfo.remaining,
        resetAt: limitInfo.resetAt
      }
    );
  } catch (error) {
    logApiError("Error changing password", error, { userId: session.user.id });
    return withRateLimitHeaders(errorResponse("فشل في تغيير كلمة المرور"), {
      limit: CHANGE_PASSWORD_RATE_LIMIT.limit,
      remaining: limitInfo.remaining,
      resetAt: limitInfo.resetAt
    });
  }
}
