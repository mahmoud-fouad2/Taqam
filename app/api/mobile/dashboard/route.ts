import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireMobileEmployeeAuthWithDevice } from "@/lib/mobile/auth";

/**
 * GET /api/mobile/dashboard
 * Aggregated dashboard data for the mobile home screen.
 * Returns attendance status, leave balances, pending requests count,
 * and pending approvals count (for managers).
 */
export async function GET(request: NextRequest) {
  const payloadOrRes = await requireMobileEmployeeAuthWithDevice(request);
  if (payloadOrRes instanceof NextResponse) return payloadOrRes;

  const { tenantId, employeeId, role } = payloadOrRes;

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentYear = today.getFullYear();

    // Run all queries in parallel
    const [
      todayAttendance,
      pendingLeaves,
      leaveBalances,
      recentRequests,
      pendingApprovals,
    ] = await Promise.all([
      // 1. Today's attendance
      prisma.attendanceRecord.findFirst({
        where: { tenantId, employeeId, date: today },
        select: {
          id: true,
          checkInTime: true,
          checkOutTime: true,
          status: true,
          lateMinutes: true,
          totalWorkMinutes: true,
        },
      }),

      // 2. Count pending leave requests
      prisma.leaveRequest.count({
        where: { tenantId, employeeId, status: "PENDING" },
      }),

      // 3. Top leave balances (up to 4 types)
      prisma.leaveBalance.findMany({
        where: { tenantId, employeeId, year: currentYear },
        include: {
          leaveType: { select: { name: true, nameAr: true, color: true } },
        },
        take: 4,
      }),

      // 4. Recent requests (last 5)
      prisma.leaveRequest.findMany({
        where: { tenantId, employeeId },
        include: {
          leaveType: { select: { name: true, nameAr: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),

      // 5. Pending approvals count (for managers only)
      ["TENANT_ADMIN", "HR_MANAGER", "MANAGER"].includes(role)
        ? prisma.leaveRequest.count({
            where: {
              tenantId,
              status: "PENDING",
              // MANAGER: only direct reports; TENANT_ADMIN/HR_MANAGER: all pending
              ...(role === "MANAGER" ? { employee: { managerId: employeeId } } : {}),
            },
          })
        : Promise.resolve(0),
    ]);

    // Determine attendance status
    let attendanceStatus: "none" | "checked_in" | "checked_out" = "none";
    if (todayAttendance?.checkOutTime) {
      attendanceStatus = "checked_out";
    } else if (todayAttendance?.checkInTime) {
      attendanceStatus = "checked_in";
    }

    return NextResponse.json({
      data: {
        attendance: {
          status: attendanceStatus,
          checkInTime: todayAttendance?.checkInTime?.toISOString() ?? null,
          checkOutTime: todayAttendance?.checkOutTime?.toISOString() ?? null,
          lateMinutes: todayAttendance?.lateMinutes ?? 0,
          totalWorkMinutes: todayAttendance?.totalWorkMinutes ?? 0,
        },
        leaves: {
          pendingCount: pendingLeaves,
          balances: leaveBalances.map((b) => ({
            typeName: b.leaveType.nameAr || b.leaveType.name,
            color: b.leaveType.color,
            entitled: Number(b.entitled),
            used: Number(b.used),
            remaining: Math.max(
              0,
              Number(b.entitled) - Number(b.used) - Number(b.pending) +
                Number(b.carriedOver) + Number(b.adjustment)
            ),
          })),
        },
        recentRequests: recentRequests.map((r) => ({
          id: r.id,
          type: r.leaveType.nameAr || r.leaveType.name,
          startDate: r.startDate.toISOString().slice(0, 10),
          endDate: r.endDate.toISOString().slice(0, 10),
          totalDays: Number(r.totalDays),
          status: r.status.toLowerCase(),
        })),
        approvals: {
          pendingCount: pendingApprovals,
        },
      },
    });
  } catch (error) {
    console.error("Mobile dashboard GET error:", error);
    return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 });
  }
}
