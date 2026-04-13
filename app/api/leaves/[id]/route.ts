/**
 * Single Leave Request API Routes
 */

import { NextRequest, NextResponse } from "next/server";
import {
  dataResponse,
  errorResponse,
  logApiError,
  notFoundResponse,
  requireSession
} from "@/lib/api/route-helper";
import { triggerWorkflowEvent } from "@/lib/automation";
import prisma from "@/lib/db";

function isSuperAdmin(role: string | undefined) {
  return role === "SUPER_ADMIN";
}

function mapLeaveRequest(r: any) {
  return { ...r, totalDays: Number(r.totalDays) };
}

function canManageLeaveRequests(role: string | undefined) {
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

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const auth = await requireSession(request);
    if (!auth.ok) return auth.response;
    const { session } = auth;

    const tenantId = session.user.tenantId;
    if (!tenantId && !isSuperAdmin(session.user.role)) {
      return errorResponse("Tenant required", 400);
    }

    const leaveRequest = await prisma.leaveRequest.findFirst({
      where: {
        id,
        ...(tenantId ? { tenantId } : {})
      },
      include: {
        employee: {
          include: {
            user: {
              select: {
                id: true
              }
            },
            department: true,
            jobTitle: true
          }
        },
        leaveType: true
      }
    });

    if (!leaveRequest) {
      return notFoundResponse("Leave request not found");
    }

    const role = session.user.role;
    const isSelf = leaveRequest.employee.userId === session.user.id;

    if (role === "MANAGER") {
      const canAccess =
        isSelf ||
        (await canManagerAccessEmployee({
          tenantId: leaveRequest.tenantId,
          managerUserId: session.user.id,
          targetEmployeeManagerId: leaveRequest.employee.managerId ?? null
        }));

      if (!canAccess) {
        return errorResponse("Access denied", 403);
      }
    } else if (!canManageLeaveRequests(role) && !isSelf) {
      return errorResponse("Access denied", 403);
    }

    return dataResponse(mapLeaveRequest(leaveRequest));
  } catch (error) {
    logApiError("Error fetching leave request", error);
    return errorResponse("Failed to fetch leave request");
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const auth = await requireSession(request);
    if (!auth.ok) return auth.response;
    const { session } = auth;

    const body = await request.json();

    const tenantId = session.user.tenantId;
    if (!tenantId && !isSuperAdmin(session.user.role)) {
      return errorResponse("Tenant required", 400);
    }

    const existing = await prisma.leaveRequest.findFirst({
      where: {
        id,
        ...(tenantId ? { tenantId } : {})
      },
      include: {
        employee: {
          select: {
            userId: true,
            managerId: true,
            firstName: true,
            lastName: true,
            firstNameAr: true,
            lastNameAr: true
          }
        },
        leaveType: {
          select: {
            name: true,
            nameAr: true
          }
        }
      }
    });

    if (!existing) {
      return notFoundResponse("Leave request not found");
    }

    const canManage = canManageLeaveRequests(session.user.role);
    const isSelf = existing.employee.userId === session.user.id;
    const role = session.user.role;

    // Handle approval/rejection
    const actionRaw = typeof body.action === "string" ? body.action : "";
    const action = actionRaw.toLowerCase();
    if (action === "approve" || action === "reject") {
      if (!canManage) {
        return errorResponse("Access denied", 403);
      }

      if (role === "MANAGER") {
        const canAccess = await canManagerAccessEmployee({
          tenantId: existing.tenantId,
          managerUserId: session.user.id,
          targetEmployeeManagerId: existing.employee.managerId ?? null
        });

        if (!canAccess) {
          return errorResponse("Access denied", 403);
        }
      }

      const year = existing.startDate.getFullYear();
      const totalDays = Number(existing.totalDays);

      const leaveRequest = await prisma.$transaction(async (tx) => {
        const updated = await tx.leaveRequest.update({
          where: { id },
          data: {
            status: action === "approve" ? "APPROVED" : "REJECTED",
            approvedById: session.user.id,
            approvedAt: new Date(),
            rejectionReason: action === "reject" ? body.rejectionReason : null
          }
        });

        // If approved, move days from pending -> used
        if (action === "approve") {
          await tx.leaveBalance.upsert({
            where: {
              employeeId_leaveTypeId_year: {
                employeeId: existing.employeeId,
                leaveTypeId: existing.leaveTypeId,
                year
              }
            },
            update: {
              used: { increment: totalDays },
              pending: { decrement: totalDays }
            },
            create: {
              tenantId: existing.tenantId,
              employeeId: existing.employeeId,
              leaveTypeId: existing.leaveTypeId,
              year,
              used: totalDays
            }
          });
        }

        return updated;
      });

      await triggerWorkflowEvent(
        existing.tenantId,
        action === "approve" ? "leave.approved" : "leave.rejected",
        {
          employeeUserId: existing.employee.userId ?? null,
          leaveType: existing.leaveType.nameAr || existing.leaveType.name,
          rejectionReason: action === "reject" ? body.rejectionReason ?? "" : "",
          rejectionSuffix:
            action === "reject" && body.rejectionReason
              ? `: ${body.rejectionReason}`
              : "",
          requestId: leaveRequest.id
        }
      );

      return dataResponse(mapLeaveRequest(leaveRequest));
    }

    if (!canManage && !isSelf) {
      return errorResponse("Access denied", 403);
    }

    // Managers should not edit other employees' leave requests.
    if (role === "MANAGER" && !isSelf) {
      return errorResponse("Access denied", 403);
    }

    // Regular update
    const leaveRequest = await prisma.leaveRequest.update({
      where: { id },
      data: {
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
        reason: body.reason,
        attachmentUrl: body.attachmentUrl
      }
    });

    return dataResponse(mapLeaveRequest(leaveRequest));
  } catch (error) {
    logApiError("Error updating leave request", error);
    return errorResponse("Failed to update leave request");
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const auth = await requireSession(request);
    if (!auth.ok) return auth.response;
    const { session } = auth;

    const tenantId = session.user.tenantId;
    if (!tenantId && !isSuperAdmin(session.user.role)) {
      return errorResponse("Tenant required", 400);
    }

    const existing = await prisma.leaveRequest.findFirst({
      where: {
        id,
        ...(tenantId ? { tenantId } : {})
      }
    });

    if (!existing) {
      return notFoundResponse("Leave request not found");
    }

    const role = session.user.role;

    // Managers are not allowed to cancel other employees' requests.
    if (!canManageLeaveRequests(role) || role === "MANAGER") {
      const requesterEmployee = await prisma.employee.findFirst({
        where: { tenantId: existing.tenantId, userId: session.user.id },
        select: { id: true }
      });

      if (!requesterEmployee || requesterEmployee.id !== existing.employeeId) {
        return errorResponse("Access denied", 403);
      }
    }

    if (existing.status !== "PENDING") {
      return errorResponse("Can only cancel pending requests", 400);
    }

    const year = existing.startDate.getFullYear();
    const totalDays = Number(existing.totalDays);

    await prisma.$transaction(async (tx) => {
      await tx.leaveRequest.update({
        where: { id },
        data: { status: "CANCELLED" }
      });

      // Remove pending from balance
      await tx.leaveBalance.updateMany({
        where: {
          employeeId: existing.employeeId,
          leaveTypeId: existing.leaveTypeId,
          year
        },
        data: {
          pending: { decrement: totalDays }
        }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logApiError("Error deleting leave request", error);
    return errorResponse("Failed to cancel leave request");
  }
}
