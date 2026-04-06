import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import prisma from "@/lib/db";
import { getAppBaseUrl, sendEmail } from "@/lib/email";
import { logger } from "@/lib/logger";
import { checkRateLimit, withRateLimitHeaders } from "@/lib/rate-limit";
import { createActionToken } from "@/lib/security/action-tokens";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  const limit = 8;
  const limitInfo = await checkRateLimit(request, {
    keyPrefix: "public:forgot_password",
    limit,
    windowMs: 15 * 60 * 1000,
  });

  if (!limitInfo.allowed) {
    return withRateLimitHeaders(
      NextResponse.json({ error: "Too many requests" }, { status: 429 }),
      { limit, remaining: limitInfo.remaining, resetAt: limitInfo.resetAt }
    );
  }

  try {
    const json = await request.json();
    const parsed = schema.safeParse(json);

    if (!parsed.success) {
      return withRateLimitHeaders(
        NextResponse.json({ error: "Invalid input" }, { status: 400 }),
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
        status: true,
        tenantId: true,
        passwordChangedAt: true,
      },
    });

    if (user && user.status !== "INACTIVE" && user.status !== "SUSPENDED") {
      const tokenType = user.status === "PENDING_VERIFICATION" ? "tenant-admin-activation" : "password-reset";
      const token = await createActionToken(
        {
          type: tokenType,
          userId: user.id,
          email: user.email,
          tenantId: user.tenantId,
          passwordChangedAt: user.passwordChangedAt?.toISOString() ?? null,
        },
        tokenType === "tenant-admin-activation" ? "72h" : "2h"
      );

      const actionUrl = `${getAppBaseUrl()}/reset-password?token=${encodeURIComponent(token)}`;

      await sendEmail({
        to: user.email,
        subject:
          tokenType === "tenant-admin-activation"
            ? "تفعيل حسابك على طاقم"
            : "إعادة تعيين كلمة المرور | طاقم",
        text:
          tokenType === "tenant-admin-activation"
            ? `مرحبًا ${user.firstName}\n\nاستخدم الرابط التالي لتفعيل حسابك وتحديد كلمة المرور:\n${actionUrl}`
            : `مرحبًا ${user.firstName}\n\nاستخدم الرابط التالي لإعادة تعيين كلمة المرور:\n${actionUrl}`,
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.8;color:#111827">
            <h2 style="margin:0 0 16px">${
              tokenType === "tenant-admin-activation" ? "تفعيل حسابك" : "إعادة تعيين كلمة المرور"
            }</h2>
            <p>مرحبًا ${user.firstName}،</p>
            <p>${
              tokenType === "tenant-admin-activation"
                ? "استخدم الرابط التالي لتفعيل حسابك وتحديد كلمة مرور جديدة."
                : "تلقينا طلبًا لإعادة تعيين كلمة المرور الخاصة بك."
            }</p>
            <p style="margin:24px 0">
              <a href="${actionUrl}" style="display:inline-block;padding:12px 20px;border-radius:12px;background:#0ea5e9;color:#fff;text-decoration:none;font-weight:700">${
                tokenType === "tenant-admin-activation" ? "تفعيل الحساب" : "إعادة تعيين كلمة المرور"
              }</a>
            </p>
            <p>أو استخدم هذا الرابط مباشرة:</p>
            <p><a href="${actionUrl}">${actionUrl}</a></p>
          </div>
        `,
      });

      logger.security("password_reset", {
        userId: user.id,
        email: user.email,
        mode: tokenType,
      });
    }

    return withRateLimitHeaders(NextResponse.json({ success: true }), {
      limit,
      remaining: limitInfo.remaining,
      resetAt: limitInfo.resetAt,
    });
  } catch (error) {
    logger.error("Forgot password failed", undefined, error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}