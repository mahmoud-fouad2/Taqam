import { NextRequest, NextResponse } from "next/server";
import { APPROVER_ROLES } from "@/lib/access-control";
import prisma from "@/lib/db";
import { logger } from "@/lib/logger";
import { requireMobileEmployeeAuthWithDevice } from "@/lib/mobile/auth";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * POST /api/mobile/approvals/[id]/reject
 * Reject a pending leave request.
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
    let body: { reason?: string } = {};
    try {
      body = await request.json();
    } catch {
      // No body is fine — reason is optional
    }

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

    if (role === "MANAGER" && leave.employee.managerId !== employeeId) {
      return NextResponse.json({ error: "Not your direct report" }, { status: 403 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.leaveRequest.update({
        where: { id },
        data: {
          status: "REJECTED",
          approvedById: payloadOrRes.userId,
          approvedAt: new Date(),
          rejectionReason: typeof body.reason === "string" ? body.reason.trim().slice(0, 500) : null
        }
      });

      // Remove pending days from balance
      await tx.leaveBalance.updateMany({
        where: {
          tenantId,
          employeeId: leave.employeeId,
          leaveTypeId: leave.leaveTypeId,
          year: leave.startDate.getFullYear()
        },
        data: {
          pending: { decrement: leave.totalDays }
        }
      });
    });

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    logger.error("Mobile reject error", undefined, error);
    return NextResponse.json({ error: "Failed to reject" }, { status: 500 });
  }
}
