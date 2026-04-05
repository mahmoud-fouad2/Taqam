import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { UserRole, UserStatus } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { hasRole } from "@/lib/access-control";
import prisma from "@/lib/db";
import { logger } from "@/lib/logger";
import { z } from "zod";

const updateUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: z.nativeEnum(UserRole).optional(),
  status: z.nativeEnum(UserStatus).optional(),
  phone: z.string().optional(),
});

const ALLOWED_ROLES = [UserRole.TENANT_ADMIN, UserRole.HR_MANAGER] as const;
const MANAGEABLE_ROLES = new Set<UserRole>([
  UserRole.EMPLOYEE,
  UserRole.HR_MANAGER,
  UserRole.MANAGER,
  UserRole.TENANT_ADMIN,
]);

function canManageTargetUser(actorRole: string | undefined, targetRole: UserRole): boolean {
  if (!MANAGEABLE_ROLES.has(targetRole)) {
    return false;
  }

  if (targetRole === UserRole.TENANT_ADMIN) {
    return actorRole === UserRole.TENANT_ADMIN;
  }

  return hasRole(actorRole, ALLOWED_ROLES);
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant required" }, { status: 403 });
    }

    if (!hasRole(session.user.role, ALLOWED_ROLES)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;

    const user = await prisma.user.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        role: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
        employee: {
          select: {
            id: true,
            employeeNumber: true,
            hireDate: true,
            department: { select: { name: true, nameAr: true } },
            jobTitle: { select: { name: true, nameAr: true } },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ data: user });
  } catch (error) {
    logger.error("Error fetching user", undefined, error);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant required" }, { status: 403 });
    }

    if (!hasRole(session.user.role, ALLOWED_ROLES)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;

    // Check if user exists and belongs to tenant
    const existingUser = await prisma.user.findFirst({
      where: { id, tenantId },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!canManageTargetUser(session.user.role, existingUser.role)) {
      return NextResponse.json({ error: "غير مسموح بتعديل هذا المستخدم" }, { status: 403 });
    }

    const rawBody = await request.json();
    const parsed = updateUserSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json({ error: "بيانات غير صالحة", details: parsed.error.flatten() }, { status: 400 });
    }
    const { firstName, lastName, email, role, status, phone } = parsed.data;

    if (role && !canManageTargetUser(session.user.role, role)) {
      return NextResponse.json({ error: "غير مسموح بتعيين هذا الدور" }, { status: 403 });
    }

    // Check if email is being changed and if it's already taken
    if (email && email.toLowerCase() !== existingUser.email.toLowerCase()) {
      const emailTaken = await prisma.user.findFirst({
        where: { 
          email: email.toLowerCase(),
          id: { not: id },
        },
      });

      if (emailTaken) {
        return NextResponse.json({ error: "البريد الإلكتروني مستخدم بالفعل" }, { status: 400 });
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(email && { email: email.toLowerCase() }),
        ...(role && { role }),
        ...(status && { status }),
        phone: phone || null,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
      },
    });

    logger.info("User updated", { userId: user.id, tenantId });

    return NextResponse.json({ data: user });
  } catch (error) {
    logger.error("Error updating user", undefined, error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant required" }, { status: 403 });
    }

    if (!hasRole(session.user.role, ALLOWED_ROLES)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;

    // Check if user exists and belongs to tenant
    const existingUser = await prisma.user.findFirst({
      where: { id, tenantId },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!canManageTargetUser(session.user.role, existingUser.role)) {
      return NextResponse.json({ error: "غير مسموح بحذف هذا المستخدم" }, { status: 403 });
    }

    // Don't allow deleting yourself
    if (id === session.user.id) {
      return NextResponse.json({ error: "لا يمكنك حذف حسابك" }, { status: 400 });
    }

    await prisma.user.delete({
      where: { id },
    });

    logger.info("User deleted", { userId: id, tenantId });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error deleting user", undefined, error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
