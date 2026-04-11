import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { logger } from "@/lib/logger";
import { prisma } from "@/lib/db";
import { checkRateLimit, withRateLimitHeaders } from "@/lib/rate-limit";

const requestSchema = z.object({
  captchaToken: z.string().min(1),
  companyName: z.string().min(2),
  companyNameAr: z.string().min(2).optional().or(z.literal("")),
  contactName: z.string().min(2),
  contactEmail: z.string().email(),
  contactPhone: z.string().optional().or(z.literal("")),
  employeesCount: z.string().min(1),
  message: z.string().max(2000).optional().or(z.literal(""))
});

const EMAIL_RATE_LIMIT = {
  limit: 3,
  windowMs: 30 * 60 * 1000,
  keyPrefix: "public:tenant_requests:contact_email"
} as const;

async function verifyRecaptcha(token: string) {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) {
    return { ok: false, error: "RECAPTCHA_SECRET_KEY is not configured" } as const;
  }

  const body = new URLSearchParams();
  body.set("secret", secret);
  body.set("response", token);

  const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store"
  });

  const data = (await res.json()) as {
    success: boolean;
    score?: number;
    action?: string;
    challenge_ts?: string;
    hostname?: string;
    "error-codes"?: string[];
  };

  // Support both v2 and v3 responses.
  if (!data.success) {
    return { ok: false, error: "reCAPTCHA verification failed" } as const;
  }

  if (typeof data.score === "number" && data.score < 0.4) {
    return { ok: false, error: "reCAPTCHA score too low" } as const;
  }

  return { ok: true } as const;
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

    const captcha = await verifyRecaptcha(input.captchaToken);
    if (!captcha.ok) {
      return withRateLimitHeaders(NextResponse.json({ error: captcha.error }, { status: 400 }), {
        limit,
        remaining: limitInfo.remaining,
        resetAt: limitInfo.resetAt
      });
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
