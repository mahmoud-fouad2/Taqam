import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { checkRateLimit, withRateLimitHeaders } from "@/lib/rate-limit";
import { createPublicJobApplication } from "@/lib/recruitment/public";

const createApplicationSchema = z.object({
  jobPostingId: z.string().min(1),
  tenantSlug: z.string().min(2).optional(),
  firstName: z.string().min(2).max(80),
  lastName: z.string().min(2).max(80),
  email: z.string().email(),
  phone: z.string().min(7).max(30).optional(),
  resumeUrl: z.string().url().max(2000),
  coverLetter: z.string().min(20).max(5000).optional(),
});

const RATE_LIMIT = {
  limit: 10,
  windowMs: 15 * 60 * 1000,
  keyPrefix: "public-job-application",
} as const;

export async function POST(request: NextRequest) {
  const rate = checkRateLimit(request, RATE_LIMIT);
  if (!rate.allowed) {
    return withRateLimitHeaders(
      NextResponse.json({ error: "Too many requests" }, { status: 429 }),
      { remaining: rate.remaining, resetAt: rate.resetAt, limit: RATE_LIMIT.limit }
    );
  }

  try {
    const parsed = createApplicationSchema.safeParse(await request.json());
    if (!parsed.success) {
      return withRateLimitHeaders(
        NextResponse.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 }),
        { remaining: rate.remaining, resetAt: rate.resetAt, limit: RATE_LIMIT.limit }
      );
    }

    const result = await createPublicJobApplication(parsed.data);

    if (!result.ok) {
      return withRateLimitHeaders(
        NextResponse.json({ error: result.error }, { status: result.code }),
        { remaining: rate.remaining, resetAt: rate.resetAt, limit: RATE_LIMIT.limit }
      );
    }

    return withRateLimitHeaders(
      NextResponse.json(
        {
          data: {
            applicantId: result.applicantId,
            job: result.job,
          },
        },
        { status: 201 }
      ),
      { remaining: rate.remaining, resetAt: rate.resetAt, limit: RATE_LIMIT.limit }
    );
  } catch (error) {
    console.error("POST public job application error:", error);
    return withRateLimitHeaders(
      NextResponse.json({ error: "Internal server error" }, { status: 500 }),
      { remaining: rate.remaining, resetAt: rate.resetAt, limit: RATE_LIMIT.limit }
    );
  }
}