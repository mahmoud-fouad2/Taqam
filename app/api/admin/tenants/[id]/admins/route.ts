/**
 * Tenant Admin Users API - Super Admin Only
 * /api/admin/tenants/[id]/admins
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";

import { authOptions } from "@/lib/auth";
import { logApiError } from "@/lib/api/route-helper";
import prisma from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    const { id: tenantId } = await context.params;

    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ success: false, error: "Access denied" }, { status: 403 });
    }

    const admins = await prisma.user.findMany({
      where: { tenantId, role: "TENANT_ADMIN" },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
        createdAt: true
      }
    });

    return NextResponse.json({ success: true, data: admins });
  } catch (error) {
    logApiError("Error fetching tenant admins", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch tenant admins" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    const { id: tenantId } = await context.params;

    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ success: false, error: "Access denied" }, { status: 403 });
    }

    const body = (await request.json()) as {
      userId?: string;
      newEmail?: string;
      newPassword?: string;
    };

    const userId = String(body.userId ?? "").trim();
    if (!userId) {
      return NextResponse.json({ success: false, error: "userId مطلوب" }, { status: 400 });
    }

    const newEmailRaw =
      body.newEmail !== undefined ? String(body.newEmail).trim().toLowerCase() : undefined;
    const newPasswordRaw = body.newPassword !== undefined ? String(body.newPassword) : undefined;

    if (!newEmailRaw && !newPasswordRaw) {
      return NextResponse.json(
        { success: false, error: "يجب إرسال newEmail أو newPassword" },
        { status: 400 }
      );
    }

    if (newEmailRaw && !isValidEmail(newEmailRaw)) {
      return NextResponse.json(
        { success: false, error: "بريد إلكتروني غير صالح" },
        { status: 400 }
      );
    }

    if (newPasswordRaw && newPasswordRaw.length < 6) {
      return NextResponse.json(
        { success: false, error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" },
        { status: 400 }
      );
    }

    const admin = await prisma.user.findFirst({
      where: { id: userId, tenantId, role: "TENANT_ADMIN" },
      select: { id: true, email: true, status: true }
    });

    if (!admin) {
      return NextResponse.json(
        { success: false, error: "TENANT_ADMIN غير موجود لهذه الشركة" },
        { status: 404 }
      );
    }

    if (newEmailRaw) {
      const existing = await prisma.user.findFirst({
        where: { email: newEmailRaw },
        select: { id: true }
      });

      if (existing && existing.id !== admin.id) {
        return NextResponse.json(
          { success: false, error: "البريد الإلكتروني مستخدم بالفعل" },
          { status: 400 }
        );
      }
    }

    const data: Record<string, unknown> = {};

    if (newEmailRaw && newEmailRaw !== admin.email) {
      data.email = newEmailRaw;
    }

    if (newPasswordRaw) {
      data.password = await bcrypt.hash(newPasswordRaw, 10);
      data.passwordChangedAt = new Date();
      data.failedLoginAttempts = 0;
      data.lockedUntil = null;

      if (admin.status === "PENDING_VERIFICATION") {
        data.status = "ACTIVE";
        data.emailVerified = new Date();
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ success: true, message: "لا يوجد تغيير" });
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.updateMany({
        where: { id: admin.id },
        data
      });

      if (newPasswordRaw && admin.status === "PENDING_VERIFICATION") {
        await tx.tenant.updateMany({
          where: { id: tenantId, status: "PENDING" },
          data: { status: "ACTIVE" }
        });
      }
    });

    return NextResponse.json({ success: true, message: "تم تحديث بيانات مدير الشركة" });
  } catch (error) {
    logApiError("Error updating tenant admin", error);
    return NextResponse.json(
      { success: false, error: "Failed to update tenant admin" },
      { status: 500 }
    );
  }
}
