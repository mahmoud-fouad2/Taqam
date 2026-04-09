import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireMobileEmployeeAuthWithDevice } from "@/lib/mobile/auth";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * DELETE /api/mobile/leaves/[id]
 * Cancel a pending leave request (employee self-service).
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  const payloadOrRes = await requireMobileEmployeeAuthWithDevice(request);
  if (payloadOrRes instanceof NextResponse) return payloadOrRes;

  const { tenantId, employeeId } = payloadOrRes;
  const { id } = await context.params;

  try {
    const leave = await prisma.leaveRequest.findFirst({
      where: { id, tenantId, employeeId },
    });

    if (!leave) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (leave.status !== "PENDING") {
      return NextResponse.json(
        { error: "Only pending requests can be cancelled" },
        { status: 400 },
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.leaveRequest.update({
        where: { id },
        data: { status: "CANCELLED" },
      });

      // Decrement pending days from balance
      await tx.leaveBalance.updateMany({
        where: {
          tenantId,
          employeeId,
          leaveTypeId: leave.leaveTypeId,
          year: leave.startDate.getFullYear(),
        },
        data: {
          pending: { decrement: leave.totalDays },
        },
      });
    });

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    console.error("Mobile leave cancel error:", error);
    return NextResponse.json({ error: "Failed to cancel request" }, { status: 500 });
  }
}
