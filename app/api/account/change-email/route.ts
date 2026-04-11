import { NextRequest, NextResponse } from "next/server";
import {
  errorResponse,
  logApiError,
  notFoundResponse,
  requireSession,
  validationErrorResponse
} from "@/lib/api/route-helper";
import { verifyPassword } from "@/lib/auth";
import prisma from "@/lib/db";
import { logger } from "@/lib/logger";
import { checkRateLimit, withRateLimitHeaders } from "@/lib/rate-limit";
import { z } from "zod";

const CHANGE_EMAIL_RATE_LIMIT = {
  limit: 6,
  windowMs: 15 * 60 * 1000,
  keyPrefix: "api:account:change_email:user"
} as const;

const changeEmailSchema = z.object({
  currentPassword: z.string().min(1),
  newEmail: z.string().email()
});

export async function POST(request: NextRequest) {
  const auth = await requireSession(request);
  if (!auth.ok) return auth.response;
  const { session } = auth;

  const limitInfo = await checkRateLimit(request, {
    ...CHANGE_EMAIL_RATE_LIMIT,
    identifier: session.user.id
  });

  if (!limitInfo.allowed) {
    return withRateLimitHeaders(
      NextResponse.json({ error: "Too many requests" }, { status: 429 }),
      {
        limit: CHANGE_EMAIL_RATE_LIMIT.limit,
        remaining: limitInfo.remaining,
        resetAt: limitInfo.resetAt
      }
    );
  }

  try {
    const rawBody = await request.json();
    const parsed = changeEmailSchema.safeParse(rawBody);
    if (!parsed.success) {
      return withRateLimitHeaders(
        validationErrorResponse(parsed.error.flatten(), "بيانات غير صالحة"),
        {
          limit: CHANGE_EMAIL_RATE_LIMIT.limit,
          remaining: limitInfo.remaining,
          resetAt: limitInfo.resetAt
        }
      );
    }
    const { currentPassword, newEmail } = parsed.data;

    const normalizedEmail = newEmail.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, password: true, email: true }
    });

    if (!user || !user.password) {
      return withRateLimitHeaders(notFoundResponse("المستخدم غير موجود"), {
        limit: CHANGE_EMAIL_RATE_LIMIT.limit,
        remaining: limitInfo.remaining,
        resetAt: limitInfo.resetAt
      });
    }

    const isValidPassword = await verifyPassword(currentPassword, user.password);
    if (!isValidPassword) {
      return withRateLimitHeaders(errorResponse("كلمة المرور الحالية غير صحيحة", 400), {
        limit: CHANGE_EMAIL_RATE_LIMIT.limit,
        remaining: limitInfo.remaining,
        resetAt: limitInfo.resetAt
      });
    }

    if (user.email === normalizedEmail) {
      return withRateLimitHeaders(NextResponse.json({ success: true, message: "لا يوجد تغيير" }), {
        limit: CHANGE_EMAIL_RATE_LIMIT.limit,
        remaining: limitInfo.remaining,
        resetAt: limitInfo.resetAt
      });
    }

    const existing = await prisma.user.findFirst({
      where: { email: normalizedEmail },
      select: { id: true }
    });

    if (existing) {
      return withRateLimitHeaders(errorResponse("البريد الإلكتروني مستخدم بالفعل", 400), {
        limit: CHANGE_EMAIL_RATE_LIMIT.limit,
        remaining: limitInfo.remaining,
        resetAt: limitInfo.resetAt
      });
    }

    await prisma.user.updateMany({
      where: { id: session.user.id },
      data: { email: normalizedEmail }
    });

    logger.info("Email changed successfully", { userId: session.user.id });

    return withRateLimitHeaders(
      NextResponse.json({ success: true, message: "تم تغيير البريد الإلكتروني بنجاح" }),
      {
        limit: CHANGE_EMAIL_RATE_LIMIT.limit,
        remaining: limitInfo.remaining,
        resetAt: limitInfo.resetAt
      }
    );
  } catch (error) {
    logApiError("Error changing email", error, { userId: session.user.id });
    return withRateLimitHeaders(errorResponse("فشل في تغيير البريد الإلكتروني"), {
      limit: CHANGE_EMAIL_RATE_LIMIT.limit,
      remaining: limitInfo.remaining,
      resetAt: limitInfo.resetAt
    });
  }
}
