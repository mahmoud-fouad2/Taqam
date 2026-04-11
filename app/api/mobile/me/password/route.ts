import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireMobileEmployeeAuthWithDevice } from "@/lib/mobile/auth";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { revokeAllRefreshTokensForUser } from "@/lib/mobile/refresh-tokens";
import { clearMobileRefreshCookie } from "@/lib/mobile/cookies";

export async function PUT(request: NextRequest) {
  const payloadOrRes = await requireMobileEmployeeAuthWithDevice(request);
  if (payloadOrRes instanceof NextResponse) return payloadOrRes;

  try {
    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (
      typeof currentPassword !== "string" ||
      typeof newPassword !== "string" ||
      !currentPassword ||
      newPassword.length < 8
    ) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: payloadOrRes.userId },
      select: { id: true, password: true }
    });

    if (!user?.password) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const valid = await verifyPassword(currentPassword, user.password);
    if (!valid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 403 });
    }

    const hashed = await hashPassword(newPassword);
    const passwordChangedAt = new Date();

    const revoked = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { password: hashed, passwordChangedAt }
      });

      const count = await revokeAllRefreshTokensForUser(tx as any, user.id);

      await tx.auditLog.create({
        data: {
          tenantId: payloadOrRes.tenantId,
          userId: user.id,
          action: "PASSWORD_CHANGED",
          entity: "User",
          entityId: user.id
        }
      });

      return count;
    });

    const res = NextResponse.json({ data: { success: true, revoked } });
    clearMobileRefreshCookie(res);
    return res;
  } catch (error) {
    logger.error("Mobile password change error", undefined, error);
    return NextResponse.json({ error: "Failed to change password" }, { status: 500 });
  }
}
