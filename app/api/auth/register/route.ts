import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hash } from "bcryptjs";

import prisma from "@/lib/db";
import { logger } from "@/lib/logger";
import { checkRateLimit, withRateLimitHeaders } from "@/lib/rate-limit";

const registerSchema = z.object({
  name: z.string().min(2).max(200),
  email: z.string().email().max(320),
  password: z.string().min(8).max(200),
});

function splitName(name: string): { firstName: string; lastName: string } {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0]!, lastName: "" };
  return { firstName: parts[0]!, lastName: parts.slice(1).join(" ") };
}

export async function POST(req: NextRequest) {
  try {
    const limit = 10;
    const limitInfo = await checkRateLimit(req, {
      keyPrefix: "web:auth:register",
      limit,
      windowMs: 15 * 60 * 1000,
    });

    if (!limitInfo.allowed) {
      return withRateLimitHeaders(
        NextResponse.json({ error: "Too many requests" }, { status: 429 }),
        { limit, remaining: limitInfo.remaining, resetAt: limitInfo.resetAt }
      );
    }

    const json = await req.json();
    const parsed = registerSchema.safeParse(json);
    if (!parsed.success) {
      return withRateLimitHeaders(
        NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 }),
        { limit, remaining: limitInfo.remaining, resetAt: limitInfo.resetAt }
      );
    }

    const email = parsed.data.email.toLowerCase();

    const result = await prisma.$transaction(async (tx) => {
      const usersCount = await tx.user.count();
      if (usersCount > 0) {
        return { ok: false as const, status: 403 as const, error: "Registration is disabled" };
      }

      const existing = await tx.user.findUnique({ where: { email }, select: { id: true } });
      if (existing) {
        return { ok: false as const, status: 400 as const, error: "Email already in use" };
      }

      const { firstName, lastName } = splitName(parsed.data.name);
      const passwordHash = await hash(parsed.data.password, 12);

      const user = await tx.user.create({
        data: {
          email,
          password: passwordHash,
          firstName,
          lastName,
          role: "SUPER_ADMIN",
          status: "ACTIVE",
          permissions: [],
        },
        select: { id: true, email: true },
      });

      await tx.auditLog.create({
        data: {
          tenantId: null,
          userId: user.id,
          action: "REGISTER",
          entity: "User",
          entityId: user.id,
        },
      });

      return { ok: true as const, user };
    });

    if (!result.ok) {
      return withRateLimitHeaders(
        NextResponse.json({ error: result.error }, { status: result.status }),
        { limit, remaining: limitInfo.remaining, resetAt: limitInfo.resetAt }
      );
    }

    return withRateLimitHeaders(NextResponse.json({ ok: true, user: result.user }, { status: 201 }), {
      limit,
      remaining: limitInfo.remaining,
      resetAt: limitInfo.resetAt,
    });
  } catch (error) {
    logger.error("Register error", undefined, error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
