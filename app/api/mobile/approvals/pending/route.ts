import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireMobileEmployeeAuthWithDevice } from "@/lib/mobile/auth";

/**
 * GET /api/mobile/approvals/pending
 * List leave requests pending approval for the authenticated manager.
 */
export async function GET(request: NextRequest) {
  const payloadOrRes = await requireMobileEmployeeAuthWithDevice(request);
  if (payloadOrRes instanceof NextResponse) return payloadOrRes;

  const { tenantId, employeeId, role } = payloadOrRes;

  // Only managers/admins can view approvals
  if (!["TENANT_ADMIN", "HR_MANAGER", "MANAGER"].includes(role)) {
    return NextResponse.json({ data: [], total: 0 });
  }

  try {
    const where: any = {
      tenantId,
      status: "PENDING",
    };

    // MANAGER can only see their direct reports
    if (role === "MANAGER") {
      where.employee = { managerId: employeeId };
    }

    const [requests, total] = await Promise.all([
      prisma.leaveRequest.findMany({
        where,
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              firstNameAr: true,
              lastNameAr: true,
              employeeNumber: true,
              department: { select: { name: true, nameAr: true } },
              jobTitle: { select: { name: true, nameAr: true } },
            },
          },
          leaveType: {
            select: { name: true, nameAr: true, color: true },
          },
        },
        orderBy: { createdAt: "asc" },
        take: 50,
      }),
      prisma.leaveRequest.count({ where }),
    ]);

    return NextResponse.json({
      data: requests.map((r) => ({
        id: r.id,
        employeeName: `${r.employee.firstNameAr || r.employee.firstName} ${r.employee.lastNameAr || r.employee.lastName}`,
        employeeNumber: r.employee.employeeNumber,
        department: r.employee.department?.nameAr || r.employee.department?.name || null,
        jobTitle: r.employee.jobTitle?.nameAr || r.employee.jobTitle?.name || null,
        leaveTypeName: r.leaveType.nameAr || r.leaveType.name,
        leaveTypeColor: r.leaveType.color,
        startDate: r.startDate.toISOString().slice(0, 10),
        endDate: r.endDate.toISOString().slice(0, 10),
        totalDays: Number(r.totalDays),
        reason: r.reason,
        createdAt: r.createdAt.toISOString(),
      })),
      total,
    });
  } catch (error) {
    console.error("Mobile approvals GET error:", error);
    return NextResponse.json({ error: "Failed to load approvals" }, { status: 500 });
  }
}
