import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, withRateLimitHeaders } from "@/lib/rate-limit";

const REGISTER_RATE_LIMIT = {
  limit: 10,
  windowMs: 15 * 60 * 1000,
  keyPrefix: "web:auth:register"
} as const;

const REGISTER_DISABLED_RESPONSE = {
  code: "ASSISTED_ACTIVATION_REQUIRED",
  error:
    "Self-service registration is disabled. Please request a demo or contact sales to activate your workspace.",
  nextStep: "/request-demo"
} as const;

export async function POST(req: NextRequest) {
  const limitInfo = await checkRateLimit(req, REGISTER_RATE_LIMIT);

  if (!limitInfo.allowed) {
    return withRateLimitHeaders(
      NextResponse.json({ error: "Too many requests" }, { status: 429 }),
      {
        limit: REGISTER_RATE_LIMIT.limit,
        remaining: limitInfo.remaining,
        resetAt: limitInfo.resetAt
      }
    );
  }

  return withRateLimitHeaders(NextResponse.json(REGISTER_DISABLED_RESPONSE, { status: 403 }), {
    limit: REGISTER_RATE_LIMIT.limit,
    remaining: limitInfo.remaining,
    resetAt: limitInfo.resetAt
  });
}
