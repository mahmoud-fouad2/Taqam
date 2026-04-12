import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { logger } from "@/lib/logger";
import { prisma } from "@/lib/db";
import { checkRateLimit, withRateLimitHeaders } from "@/lib/rate-limit";
import { verifyGoogleRecaptcha } from "@/lib/security/recaptcha";

const requestSchema = z.object({
  captchaToken: z.string().min(1),
  companyName: z.string().min(2),
  companyNameAr: z.string().min(2).optional().or(z.literal("")),
  contactName: z.string().min(2),
  contactEmail: z.string().email(),
  contactPhone: z.string().optional().or(z.literal("")),
  employeesCount: z.string().min(1),
  message: z.string().max(2000).optional().or(z.literal("")),
  locale: z.enum(["ar", "en"]).optional()
});

const EMAIL_RATE_LIMIT = {
  limit: 3,
  windowMs: 30 * 60 * 1000,
  keyPrefix: "public:tenant_requests:contact_email"
} as const;

function getCaptchaErrorMessage(locale: "ar" | "en") {
  return {
    ar: "رمز التحقق غير صحيح أو انتهت صلاحيته. حدّثه وحاول مرة أخرى.",
    en: "The captcha is invalid or has expired. Refresh it and try again."
  }[locale];
}

export async function POST(req: NextRequest) {
  try {
    const limit = 10;
    const limitInfo = await checkRateLimit(req, {
      keyPrefix: "public:tenant_requests",
      limit,
      windowMs: 15 * 60 * 1000
    });

    if (!limitInfo.allowed) {
      return withRateLimitHeaders(
        NextResponse.json({ error: "Too many requests" }, { status: 429 }),
        { limit, remaining: limitInfo.remaining, resetAt: limitInfo.resetAt }
      );
    }

    const json = await req.json();
    const parsed = requestSchema.safeParse(json);
    if (!parsed.success) {
      return withRateLimitHeaders(
        NextResponse.json(
          { error: "Invalid input", details: parsed.error.flatten() },
          { status: 400 }
        ),
        { limit, remaining: limitInfo.remaining, resetAt: limitInfo.resetAt }
      );
    }

    const input = parsed.data;
    const locale = input.locale === "en" ? "en" : "ar";

    const emailRate = await checkRateLimit(req, {
      ...EMAIL_RATE_LIMIT,
      identifier: input.contactEmail.toLowerCase()
    });

    if (!emailRate.allowed) {
      return withRateLimitHeaders(
        NextResponse.json({ error: "Too many requests" }, { status: 429 }),
        {
          limit: EMAIL_RATE_LIMIT.limit,
          remaining: emailRate.remaining,
          resetAt: emailRate.resetAt
        }
      );
    }

    const captcha = await verifyGoogleRecaptcha({
      token: input.captchaToken,
      remoteIp: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null
    });

    if (!captcha.ok) {
      return withRateLimitHeaders(
        NextResponse.json({ error: getCaptchaErrorMessage(locale) }, { status: 400 }),
        {
          limit,
          remaining: limitInfo.remaining,
          resetAt: limitInfo.resetAt
        }
      );
    }

    await prisma.tenantRequest.create({
      data: {
        companyName: input.companyName,
        companyNameAr: input.companyNameAr || null,
        employeeCount: input.employeesCount,
        contactName: input.contactName,
        contactEmail: input.contactEmail,
        contactPhone: input.contactPhone || null,
        message: input.message || null
      }
    });

    return withRateLimitHeaders(NextResponse.json({ ok: true }), {
      limit,
      remaining: limitInfo.remaining,
      resetAt: limitInfo.resetAt
    });
  } catch (e) {
    logger.error("Public tenant request error", undefined, e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
