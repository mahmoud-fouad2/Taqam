/**
 * Adjust Leave Balance API Route (HR/admin)
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

function isSuperAdmin(role: string | undefined) {
  return role === "SUPER_ADMIN";
}

function canAdjust(role: string | undefined) {
  return role === "TENANT_ADMIN" || role === "HR_MANAGER" || role === "HR" || isSuperAdmin(role);
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canAdjust(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const tenantId = session.user.tenantId;
    if (!tenantId && !isSuperAdmin(session.user.role)) {
      return NextResponse.json({ error: "Tenant required" }, { status: 400 });
    }

    const body = await request.json();
    const adjustmentType = body?.adjustmentType;
    const daysRaw = body?.days;

    const days = typeof daysRaw === "number" ? daysRaw : Number(daysRaw);
    if (!Number.isFinite(days) || days <= 0) {
      return NextResponse.json({ error: "Invalid days" }, { status: 400 });
    }

    const delta = adjustmentType === "subtract" ? -days : days;

    const existing = await prisma.leaveBalance.findFirst({
      where: {
        id,
        ...(tenantId ? { tenantId } : {})
      }
    });

    if (!existing) {
      return NextResponse.json({ error: "Leave balance not found" }, { status: 404 });
    }

    const updated = await prisma.leaveBalance.update({
      where: { id },
      data: {
        adjustment: { increment: delta }
      }
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("Error adjusting leave balance:", error);
    return NextResponse.json({ error: "Failed to adjust leave balance" }, { status: 500 });
  }
}
