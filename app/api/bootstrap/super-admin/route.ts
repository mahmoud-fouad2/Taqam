import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import prisma from "@/lib/db";
import { logger } from "@/lib/logger";
import { checkRateLimit, withRateLimitHeaders } from "@/lib/rate-limit";
import {
  hasValidSuperAdminBootstrapToken,
  isSuperAdminBootstrapEnabled
} from "@/lib/security/bootstrap";

/**
 * TEMPORARY BOOTSTRAP ENDPOINT
 * This creates/updates super admin. DELETE THIS FILE after first use!
 * Only works if environment variables are set.
 */
export async function POST(request: NextRequest) {
  const limit = 5;
  const limitInfo = await checkRateLimit(request, {
    keyPrefix: "bootstrap:super-admin",
    limit,
    windowMs: 15 * 60 * 1000
  });

  const withHeaders = (response: NextResponse) =>
    withRateLimitHeaders(response, {
      limit,
      remaining: limitInfo.remaining,
      resetAt: limitInfo.resetAt
    });

  if (!limitInfo.allowed) {
    return withHeaders(NextResponse.json({ error: "Too many requests" }, { status: 429 }));
  }

  try {
    if (!isSuperAdminBootstrapEnabled()) {
      return withHeaders(NextResponse.json({ error: "Not found" }, { status: 404 }));
    }

    if (!hasValidSuperAdminBootstrapToken(request.headers)) {
      return withHeaders(
        NextResponse.json({ error: "A valid bootstrap token is required" }, { status: 403 })
      );
    }

    // Security: Only work if env vars are set
    const envEmail = process.env.SUPER_ADMIN_EMAIL;
    const envPassword = process.env.SUPER_ADMIN_PASSWORD;

    if (!envEmail || !envPassword) {
      return withHeaders(
        NextResponse.json({ error: "Environment variables not configured" }, { status: 400 })
      );
    }

    const email = envEmail.toLowerCase();
    const passwordHash = await hash(envPassword, 12);

    // Check if super admin exists
    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, role: true }
    });

    let user;
    if (existing) {
      // Update password and ensure SUPER_ADMIN role
      user = await prisma.user.update({
        where: { email },
        data: {
          password: passwordHash,
          role: "SUPER_ADMIN",
          status: "ACTIVE",
          failedLoginAttempts: 0,
          lockedUntil: null
        },
        select: { id: true, email: true, role: true, status: true }
      });
    } else {
      // Create new super admin
      user = await prisma.user.create({
        data: {
          email,
          password: passwordHash,
          firstName: "Super",
          lastName: "Admin",
          role: "SUPER_ADMIN",
          status: "ACTIVE",
          permissions: []
        },
        select: { id: true, email: true, role: true, status: true }
      });
    }

    return withHeaders(
      NextResponse.json({
        success: true,
        message: existing ? "Super admin updated" : "Super admin created",
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          status: user.status
        }
      })
    );
  } catch (error) {
    logger.error("Bootstrap super admin error", undefined, error);
    return withHeaders(
      NextResponse.json({ error: "Failed to bootstrap super admin" }, { status: 500 })
    );
  }
}
