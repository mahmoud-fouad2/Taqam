/**
 * Single Leave Request API Routes
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notifyLeaveStatusChanged } from "@/lib/notifications/send";

function isSuperAdmin(role: string | undefined) {
  return role === "SUPER_ADMIN";
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    if (!tenantId && !isSuperAdmin(session.user.role)) {
      return NextResponse.json({ error: "Tenant required" }, { status: 400 });
    }

    const leaveRequest = await prisma.leaveRequest.findFirst({
      where: {
        id,
        ...(tenantId ? { tenantId } : {}),
      },
      include: {
        employee: {
          include: {
            department: true,
            jobTitle: true,
          },
        },
        leaveType: true,
      },
    });

    if (!leaveRequest) {
      return NextResponse.json({ error: "Leave request not found" }, { status: 404 });
    }

    return NextResponse.json({ data: leaveRequest });
  } catch (error) {
    console.error("Error fetching leave request:", error);
    return NextResponse.json(
      { error: "Failed to fetch leave request" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const tenantId = session.user.tenantId;
    if (!tenantId && !isSuperAdmin(session.user.role)) {
      return NextResponse.json({ error: "Tenant required" }, { status: 400 });
    }

    const existing = await prisma.leaveRequest.findFirst({
      where: {
        id,
        ...(tenantId ? { tenantId } : {}),
      },
      include: {
        employee: {
          select: {
            userId: true,
            firstName: true,
            lastName: true,
            firstNameAr: true,
            lastNameAr: true,
          },
        },
        leaveType: {
          select: {
            name: true,
            nameAr: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Leave request not found" }, { status: 404 });
    }

    // Handle approval/rejection
    const actionRaw = typeof body.action === "string" ? body.action : "";
    const action = actionRaw.toLowerCase();
    if (action === "approve" || action === "reject") {
      const year = existing.startDate.getFullYear();
      const totalDays = Number(existing.totalDays);

      const leaveRequest = await prisma.$transaction(async (tx) => {
        const updated = await tx.leaveRequest.update({
          where: { id },
          data: {
            status: action === "approve" ? "APPROVED" : "REJECTED",
            approvedById: session.user.id,
            approvedAt: new Date(),
            rejectionReason: action === "reject" ? body.rejectionReason : null,
          },
        });

        // If approved, move days from pending -> used
        if (action === "approve") {
          await tx.leaveBalance.upsert({
            where: {
              employeeId_leaveTypeId_year: {
                employeeId: existing.employeeId,
                leaveTypeId: existing.leaveTypeId,
                year,
              },
            },
            update: {
              used: { increment: totalDays },
              pending: { decrement: totalDays },
            },
            create: {
              tenantId: existing.tenantId,
              employeeId: existing.employeeId,
              leaveTypeId: existing.leaveTypeId,
              year,
              used: totalDays,
            },
          });
        }

        return updated;
      });

      if (existing.employee.userId) {
        await notifyLeaveStatusChanged({
          tenantId: existing.tenantId,
          employeeUserId: existing.employee.userId,
          status: action === "approve" ? "approved" : "rejected",
          leaveType: existing.leaveType.nameAr || existing.leaveType.name,
          rejectionReason: action === "reject" ? body.rejectionReason : undefined,
          requestId: leaveRequest.id,
        });
      }

      return NextResponse.json({ data: leaveRequest });
    }

    // Regular update
    const leaveRequest = await prisma.leaveRequest.update({
      where: { id },
      data: {
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
        reason: body.reason,
        attachmentUrl: body.attachmentUrl,
      },
    });

    return NextResponse.json({ data: leaveRequest });
  } catch (error) {
    console.error("Error updating leave request:", error);
    return NextResponse.json(
      { error: "Failed to update leave request" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    if (!tenantId && !isSuperAdmin(session.user.role)) {
      return NextResponse.json({ error: "Tenant required" }, { status: 400 });
    }

    const existing = await prisma.leaveRequest.findFirst({
      where: {
        id,
        ...(tenantId ? { tenantId } : {}),
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Leave request not found" }, { status: 404 });
    }

    if (existing.status !== "PENDING") {
      return NextResponse.json(
        { error: "Can only cancel pending requests" },
        { status: 400 }
      );
    }

    const year = existing.startDate.getFullYear();
    const totalDays = Number(existing.totalDays);

    await prisma.$transaction(async (tx) => {
      await tx.leaveRequest.update({
        where: { id },
        data: { status: "CANCELLED" },
      });

      // Remove pending from balance
      await tx.leaveBalance.updateMany({
        where: {
          employeeId: existing.employeeId,
          leaveTypeId: existing.leaveTypeId,
          year,
        },
        data: {
          pending: { decrement: totalDays },
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting leave request:", error);
    return NextResponse.json(
      { error: "Failed to cancel leave request" },
      { status: 500 }
    );
  }
}
