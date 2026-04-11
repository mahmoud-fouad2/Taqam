import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hash } from "bcryptjs";

import prisma from "@/lib/db";
import { logger } from "@/lib/logger";
import { checkRateLimit, withRateLimitHeaders } from "@/lib/rate-limit";

const REGISTER_RATE_LIMIT = {
  limit: 10,
  windowMs: 15 * 60 * 1000,
  keyPrefix: "web:auth:register"
} as const;

const REGISTER_EMAIL_RATE_LIMIT = {
  limit: 4,
  windowMs: 60 * 60 * 1000,
  keyPrefix: "web:auth:register:email"
} as const;

const registerSchema = z.object({
  name: z.string().min(2).max(200),
  email: z.string().email().max(320),
  password: z.string().min(8).max(200),
  companyName: z.string().min(2).max(200).optional()
});

function splitName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0]!, lastName: "" };
  return { firstName: parts[0]!, lastName: parts.slice(1).join(" ") };
}

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

  try {
    const json = await req.json();
    const parsed = registerSchema.safeParse(json);
    if (!parsed.success) {
      return withRateLimitHeaders(
        NextResponse.json(
          { error: "Invalid input", details: parsed.error.flatten() },
          { status: 400 }
        ),
        {
          limit: REGISTER_RATE_LIMIT.limit,
          remaining: limitInfo.remaining,
          resetAt: limitInfo.resetAt
        }
      );
    }

    const email = parsed.data.email.toLowerCase();
    const emailLimitInfo = await checkRateLimit(req, {
      ...REGISTER_EMAIL_RATE_LIMIT,
      identifier: email
    });

    if (!emailLimitInfo.allowed) {
      return withRateLimitHeaders(
        NextResponse.json({ error: "Too many requests" }, { status: 429 }),
        {
          limit: REGISTER_EMAIL_RATE_LIMIT.limit,
          remaining: emailLimitInfo.remaining,
          resetAt: emailLimitInfo.resetAt
        }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.user.findUnique({ where: { email }, select: { id: true } });
      if (existing) {
        return { ok: false as const, status: 400 as const, error: "Email already in use" };
      }

      const { firstName, lastName } = splitName(parsed.data.name);
      const passwordHash = await hash(parsed.data.password, 12);

      const newTenant = await tx.tenant.create({
        data: {
          name: parsed.data.companyName || `${firstName}'s Company`,
          slug: `${firstName.toLowerCase().replace(/[^a-z0-9]/g, "")}-${Date.now().toString(36)}`,
          domain: `${firstName.toLowerCase().replace(/[^a-z0-9]/g, "")}-${Date.now().toString(36)}`,
          status: "ACTIVE"
        },
        select: { id: true }
      });

      const user = await tx.user.create({
        data: {
          email,
          password: passwordHash,
          firstName,
          lastName,
          role: "TENANT_ADMIN",
          status: "ACTIVE",
          permissions: [],
          tenantId: newTenant.id
        },
        select: { id: true, email: true }
      });

      // Automatically create an employee profile for the admin so they can use the app properly
      await tx.employee.create({
        data: {
          tenantId: newTenant.id,
          userId: user.id,
          employeeNumber: "ADMIN-001",
          firstName: firstName,
          lastName: lastName,
          email: email,
          hireDate: new Date()
        }
      });

      await tx.auditLog.create({
        data: {
          tenantId: newTenant.id,
          userId: user.id,
          action: "REGISTER",
          entity: "User",
          entityId: user.id
        }
      });

      return { ok: true as const, user };
    });

    if (!result.ok) {
      return withRateLimitHeaders(
        NextResponse.json({ error: result.error }, { status: result.status }),
        {
          limit: REGISTER_RATE_LIMIT.limit,
          remaining: limitInfo.remaining,
          resetAt: limitInfo.resetAt
        }
      );
    }

    return withRateLimitHeaders(
      NextResponse.json({ ok: true, user: result.user }, { status: 201 }),
      {
        limit: REGISTER_RATE_LIMIT.limit,
        remaining: limitInfo.remaining,
        resetAt: limitInfo.resetAt
      }
    );
  } catch (error) {
    logger.error("Register error", undefined, error);
    return withRateLimitHeaders(NextResponse.json({ error: "Server error" }, { status: 500 }), {
      limit: REGISTER_RATE_LIMIT.limit,
      remaining: limitInfo.remaining,
      resetAt: limitInfo.resetAt
    });
  }
}
