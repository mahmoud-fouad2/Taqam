import { NextRequest, NextResponse } from "next/server";
import { APPROVER_ROLES } from "@/lib/access-control";
import prisma from "@/lib/db";
import { logger } from "@/lib/logger";
import { requireMobileEmployeeAuthWithDevice } from "@/lib/mobile/auth";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * POST /api/mobile/approvals/[id]/approve
 * Approve a pending leave request.
 */
export async function POST(request: NextRequest, context: RouteContext) {
  const payloadOrRes = await requireMobileEmployeeAuthWithDevice(request);
  if (payloadOrRes instanceof NextResponse) return payloadOrRes;

  const { tenantId, employeeId, role } = payloadOrRes;
  const { id } = await context.params;

  if (!APPROVER_ROLES.includes(role as (typeof APPROVER_ROLES)[number])) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  try {
    const leave = await prisma.leaveRequest.findFirst({
      where: { id, tenantId, status: "PENDING" },
      include: { employee: { select: { managerId: true } } }
    });

    if (!leave) {
      return NextResponse.json(
        { error: "Request not found or already processed" },
        { status: 404 }
      );
    }

    // MANAGER can only approve their direct reports
    if (role === "MANAGER" && leave.employee.managerId !== employeeId) {
      return NextResponse.json({ error: "Not your direct report" }, { status: 403 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.leaveRequest.update({
        where: { id },
        data: {
          status: "APPROVED",
          approvedById: payloadOrRes.userId,
          approvedAt: new Date()
        }
      });

      // Move days from pending → used in balance
      await tx.leaveBalance.updateMany({
        where: {
          tenantId,
          employeeId: leave.employeeId,
          leaveTypeId: leave.leaveTypeId,
          year: leave.startDate.getFullYear()
        },
        data: {
          pending: { decrement: leave.totalDays },
          used: { increment: leave.totalDays }
        }
      });
    });

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    logger.error("Mobile approve error", undefined, error);
    return NextResponse.json({ error: "Failed to approve" }, { status: 500 });
  }
}
