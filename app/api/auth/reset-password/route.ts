import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { createHash } from "crypto";
import { z } from "zod";

import prisma from "@/lib/db";
import { logger } from "@/lib/logger";
import { checkRateLimit, withRateLimitHeaders } from "@/lib/rate-limit";
import { verifyActionToken } from "@/lib/security/action-tokens";
import { revokeAllRefreshTokensForUser } from "@/lib/mobile/refresh-tokens";
import { ensureTenantAdminWorkspaceProfile } from "@/lib/tenant-activation";

const RESET_PASSWORD_RATE_LIMIT = {
  limit: 10,
  windowMs: 15 * 60 * 1000,
  keyPrefix: "public:reset_password"
} as const;

const RESET_PASSWORD_TOKEN_RATE_LIMIT = {
  limit: 5,
  windowMs: 30 * 60 * 1000,
  keyPrefix: "public:reset_password:token"
} as const;

const schema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8).max(200)
});

export async function POST(request: NextRequest) {
  const limitInfo = await checkRateLimit(request, RESET_PASSWORD_RATE_LIMIT);

  if (!limitInfo.allowed) {
    return withRateLimitHeaders(
      NextResponse.json({ error: "Too many requests" }, { status: 429 }),
      {
        limit: RESET_PASSWORD_RATE_LIMIT.limit,
        remaining: limitInfo.remaining,
        resetAt: limitInfo.resetAt
      }
    );
  }

  try {
    const json = await request.json();
    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      return withRateLimitHeaders(NextResponse.json({ error: "Invalid input" }, { status: 400 }), {
        limit: RESET_PASSWORD_RATE_LIMIT.limit,
        remaining: limitInfo.remaining,
        resetAt: limitInfo.resetAt
      });
    }

    const tokenLimitInfo = await checkRateLimit(request, {
      ...RESET_PASSWORD_TOKEN_RATE_LIMIT,
      identifier: createHash("sha256").update(parsed.data.token).digest("hex")
    });

    if (!tokenLimitInfo.allowed) {
      return withRateLimitHeaders(
        NextResponse.json({ error: "Too many requests" }, { status: 429 }),
        {
          limit: RESET_PASSWORD_TOKEN_RATE_LIMIT.limit,
          remaining: tokenLimitInfo.remaining,
          resetAt: tokenLimitInfo.resetAt
        }
      );
    }

    const payload = await verifyActionToken(parsed.data.token);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        tenantId: true,
        status: true,
        emailVerified: true,
        passwordChangedAt: true
      }
    });

    if (!user || user.email.toLowerCase() !== payload.email.toLowerCase()) {
      return withRateLimitHeaders(
        NextResponse.json({ error: "Invalid or expired token" }, { status: 400 }),
        {
          limit: RESET_PASSWORD_RATE_LIMIT.limit,
          remaining: limitInfo.remaining,
          resetAt: limitInfo.resetAt
        }
      );
    }

    if (
      payload.type === "tenant-admin-activation" &&
      payload.tenantId &&
      user.tenantId !== payload.tenantId
    ) {
      return withRateLimitHeaders(
        NextResponse.json({ error: "Invalid or expired token" }, { status: 400 }),
        {
          limit: RESET_PASSWORD_RATE_LIMIT.limit,
          remaining: limitInfo.remaining,
          resetAt: limitInfo.resetAt
        }
      );
    }

    const currentPasswordChangedAt = user.passwordChangedAt?.toISOString() ?? null;
    if (currentPasswordChangedAt !== (payload.passwordChangedAt ?? null)) {
      return withRateLimitHeaders(
        NextResponse.json({ error: "This link is no longer valid" }, { status: 400 }),
        {
          limit: RESET_PASSWORD_RATE_LIMIT.limit,
          remaining: limitInfo.remaining,
          resetAt: limitInfo.resetAt
        }
      );
    }

    if (user.status === "SUSPENDED" || user.status === "INACTIVE") {
      return withRateLimitHeaders(
        NextResponse.json({ error: "This account is not available" }, { status: 403 }),
        {
          limit: RESET_PASSWORD_RATE_LIMIT.limit,
          remaining: limitInfo.remaining,
          resetAt: limitInfo.resetAt
        }
      );
    }

    const hashedPassword = await hash(parsed.data.newPassword, 12);
    await prisma.$transaction(async (tx) => {
      await tx.user.updateMany({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          passwordChangedAt: new Date(),
          status: "ACTIVE",
          emailVerified: user.emailVerified ?? new Date(),
          failedLoginAttempts: 0,
          lockedUntil: null
        }
      });

      if (payload.type === "tenant-admin-activation" && user.tenantId) {
        const adminWorkspaceProfile = await ensureTenantAdminWorkspaceProfile(tx, {
          tenantId: user.tenantId,
          userId: user.id
        });

        const activatedTenant = await tx.tenant.updateMany({
          where: { id: user.tenantId, status: "PENDING" },
          data: { status: "ACTIVE" }
        });

        if (adminWorkspaceProfile && adminWorkspaceProfile.action !== "existing") {
          await tx.auditLog.create({
            data: {
              tenantId: user.tenantId,
              userId: user.id,
              action: "TENANT_ADMIN_EMPLOYEE_LINKED",
              entity: "Employee",
              entityId: adminWorkspaceProfile.employeeId,
              newData: {
                source: "tenant-admin-activation",
                action: adminWorkspaceProfile.action
              }
            }
          });
        }

        if (activatedTenant.count > 0) {
          await tx.auditLog.create({
            data: {
              tenantId: user.tenantId,
              userId: user.id,
              action: "TENANT_ACTIVATED",
              entity: "Tenant",
              entityId: user.tenantId
            }
          });
        }
      }

      await tx.auditLog.create({
        data: {
          tenantId: user.tenantId,
          userId: user.id,
          action: payload.type === "tenant-admin-activation" ? "ACCOUNT_ACTIVATED" : "PASSWORD_RESET",
          entity: "User",
          entityId: user.id
        }
      });
    });

    await revokeAllRefreshTokensForUser(prisma as any, user.id);

    return withRateLimitHeaders(
      NextResponse.json({
        success: true,
        mode: payload.type
      }),
      {
        limit: RESET_PASSWORD_RATE_LIMIT.limit,
        remaining: limitInfo.remaining,
        resetAt: limitInfo.resetAt
      }
    );
  } catch (error) {
    logger.error("Reset password failed", undefined, error);
    return withRateLimitHeaders(
      NextResponse.json({ error: "Invalid or expired token" }, { status: 400 }),
      {
        limit: RESET_PASSWORD_RATE_LIMIT.limit,
        remaining: limitInfo.remaining,
        resetAt: limitInfo.resetAt
      }
    );
  }
}
