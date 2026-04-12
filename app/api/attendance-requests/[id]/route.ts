import { logApiError } from "@/lib/api/route-helper";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

function isSuperAdmin(role: string | undefined) {
  return role === "SUPER_ADMIN";
}

function canManageAttendanceRequests(role: string | undefined) {
  return (
    role === "SUPER_ADMIN" || role === "TENANT_ADMIN" || role === "HR_MANAGER" || role === "MANAGER"
  );
}

async function canManagerAccessEmployee(params: {
  tenantId: string;
  managerUserId: string;
  targetEmployeeManagerId: string | null;
}) {
  const requesterEmployee = await prisma.employee.findFirst({
    where: { tenantId: params.tenantId, userId: params.managerUserId },
    select: { id: true }
  });

  return Boolean(requesterEmployee && params.targetEmployeeManagerId === requesterEmployee.id);
}

function serializeAttendanceRequest(item: {
  id: string;
  tenantId: string;
  employeeId: string;
  type: string;
  status: string;
  date: Date;
  requestedCheckIn: Date | null;
  requestedCheckOut: Date | null;
  overtimeHours: { toString(): string } | number | null;
  permissionStartTime: Date | null;
  permissionEndTime: Date | null;
  reason: string;
  attachmentUrl: string | null;
  approvedById: string | null;
  approvedAt: Date | null;
  rejectionReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: item.id,
    tenantId: item.tenantId,
    employeeId: item.employeeId,
    type: item.type.toLowerCase(),
    status: item.status.toLowerCase(),
    date: item.date.toISOString().split("T")[0],
    requestedCheckIn: item.requestedCheckIn?.toISOString(),
    requestedCheckOut: item.requestedCheckOut?.toISOString(),
    overtimeHours: item.overtimeHours == null ? undefined : Number(item.overtimeHours.toString()),
    permissionStartTime: item.permissionStartTime?.toISOString(),
    permissionEndTime: item.permissionEndTime?.toISOString(),
    reason: item.reason,
    attachmentUrl: item.attachmentUrl ?? undefined,
    approvedById: item.approvedById ?? undefined,
    approvedAt: item.approvedAt?.toISOString(),
    rejectionReason: item.rejectionReason ?? undefined,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString()
  };
}

const updateSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  rejectionReason: z.string().trim().min(3).max(2000).optional().nullable()
});

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    if (!tenantId && !isSuperAdmin(session.user.role)) {
      return NextResponse.json({ error: "Tenant required" }, { status: 400 });
    }

    const { id } = await context.params;

    const requestItem = await prisma.attendanceRequest.findFirst({
      where: { id, ...(tenantId ? { tenantId } : {}) },
      include: { employee: { select: { userId: true, managerId: true } } }
    });

    if (!requestItem) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const role = session.user.role;
    const isSelf = requestItem.employee.userId === session.user.id;

    if (role === "MANAGER") {
      const canAccess =
        isSelf ||
        (await canManagerAccessEmployee({
          tenantId: requestItem.tenantId,
          managerUserId: session.user.id,
          targetEmployeeManagerId: requestItem.employee.managerId ?? null
        }));

      if (!canAccess) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    } else if (!canManageAttendanceRequests(role) && !isSelf) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json({ data: serializeAttendanceRequest(requestItem) });
  } catch (error) {
    logApiError("Error fetching attendance request", error);
    return NextResponse.json({ error: "Failed to fetch attendance request" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    if (!tenantId && !isSuperAdmin(session.user.role)) {
      return NextResponse.json({ error: "Tenant required" }, { status: 400 });
    }

    if (!canManageAttendanceRequests(session.user.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { id } = await context.params;
    const parsed = updateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const existing = await prisma.attendanceRequest.findFirst({
      where: { id, ...(tenantId ? { tenantId } : {}) },
      include: { employee: { select: { userId: true, managerId: true } } }
    });

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (session.user.role === "MANAGER") {
      const canAccess = await canManagerAccessEmployee({
        tenantId: existing.tenantId,
        managerUserId: session.user.id,
        targetEmployeeManagerId: existing.employee.managerId ?? null
      });

      if (!canAccess) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    if (existing.status !== "PENDING") {
      return NextResponse.json({ error: "Can only update pending requests" }, { status: 400 });
    }

    if (parsed.data.status === "rejected" && !parsed.data.rejectionReason) {
      return NextResponse.json({ error: "Rejection reason is required" }, { status: 400 });
    }

    const nextStatus = parsed.data.status === "approved" ? "APPROVED" : "REJECTED";
    const updated = await prisma.attendanceRequest.update({
      where: { id },
      data: {
        status: nextStatus,
        approvedById: nextStatus === "APPROVED" ? session.user.id : null,
        approvedAt: nextStatus === "APPROVED" ? new Date() : null,
        rejectionReason: nextStatus === "REJECTED" ? (parsed.data.rejectionReason ?? null) : null
      }
    });

    return NextResponse.json({ data: serializeAttendanceRequest(updated) });
  } catch (error) {
    logApiError("Error updating attendance request", error);
    return NextResponse.json({ error: "Failed to update attendance request" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    if (!tenantId && !isSuperAdmin(session.user.role)) {
      return NextResponse.json({ error: "Tenant required" }, { status: 400 });
    }

    const { id } = await context.params;

    const existing = await prisma.attendanceRequest.findFirst({
      where: { id, ...(tenantId ? { tenantId } : {}) },
      include: { employee: { select: { userId: true } } }
    });

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (existing.status !== "PENDING") {
      return NextResponse.json({ error: "Can only cancel pending requests" }, { status: 400 });
    }

    if (!isSuperAdmin(session.user.role)) {
      if (existing.employee.userId !== session.user.id) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    await prisma.attendanceRequest.update({
      where: { id },
      data: { status: "CANCELLED" }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logApiError("Error cancelling attendance request", error);
    return NextResponse.json({ error: "Failed to cancel attendance request" }, { status: 500 });
  }
}
