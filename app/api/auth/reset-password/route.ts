import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";

import prisma from "@/lib/db";
import { logger } from "@/lib/logger";
import { verifyActionToken } from "@/lib/security/action-tokens";

const schema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8).max(200),
});

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
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
        passwordChangedAt: true,
      },
    });

    if (!user || user.email.toLowerCase() !== payload.email.toLowerCase()) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
    }

    const currentPasswordChangedAt = user.passwordChangedAt?.toISOString() ?? null;
    if (currentPasswordChangedAt !== (payload.passwordChangedAt ?? null)) {
      return NextResponse.json({ error: "This link is no longer valid" }, { status: 400 });
    }

    if (user.status === "SUSPENDED" || user.status === "INACTIVE") {
      return NextResponse.json({ error: "This account is not available" }, { status: 403 });
    }

    const hashedPassword = await hash(parsed.data.newPassword, 12);
    await prisma.user.updateMany({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordChangedAt: new Date(),
        status: "ACTIVE",
        emailVerified: user.emailVerified ?? new Date(),
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    await prisma.auditLog.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        action: payload.type === "tenant-admin-activation" ? "ACCOUNT_ACTIVATED" : "PASSWORD_RESET",
        entity: "User",
        entityId: user.id,
      },
    });

    return NextResponse.json({
      success: true,
      mode: payload.type,
    });
  } catch (error) {
    logger.error("Reset password failed", undefined, error);
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
  }
}