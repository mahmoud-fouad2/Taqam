/**
 * Leave Requests API Routes
 */

import { NextRequest, NextResponse } from "next/server";
import {
  dataResponse,
  errorResponse,
  logApiError,
  parsePagination,
  requireSession
} from "@/lib/api/route-helper";
import prisma from "@/lib/db";
import { notifyLeaveRequestSubmitted } from "@/lib/notifications/send";
import { z } from "zod";

const createLeaveSchema = z.object({
  employeeId: z.string().min(1),
  leaveTypeId: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  isHalfDay: z.boolean().optional(),
  reason: z.string().optional(),
  attachmentUrl: z.string().optional(),
  delegateToId: z.string().optional()
});

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

function canCreateLeaveForOthers(role: string | undefined) {
  return role === "SUPER_ADMIN" || role === "TENANT_ADMIN" || role === "HR_MANAGER";
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireSession(request);
    if (!auth.ok) return auth.response;
    const { session } = auth;

    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = parsePagination(searchParams);
    const employeeId = searchParams.get("employeeId");
    const status = searchParams.get("status");
    const yearParam = searchParams.get("year");

    const requestedTenantId = searchParams.get("tenantId") ?? undefined;

    const tenantId = isSuperAdmin(session.user.role)
      ? (requestedTenantId ?? session.user.tenantId)
      : session.user.tenantId;

    if (!tenantId) {
      return errorResponse("Tenant required", 400);
    }

    const where: any = {};

    where.tenantId = tenantId;

    const requesterEmployee = await prisma.employee.findFirst({
      where: { tenantId, userId: session.user.id },
      select: { id: true }
    });

    if (session.user.role === "MANAGER") {
      if (!requesterEmployee) {
        return errorResponse("Access denied", 403);
      }

      const allowedFilters: any[] = [
        { employeeId: requesterEmployee.id },
        { employee: { managerId: requesterEmployee.id } }
      ];

      if (employeeId) {
        where.employeeId = employeeId;
      }

      where.OR = allowedFilters;
    } else if (!canManageLeaveRequests(session.user.role)) {
      if (!requesterEmployee) {
        return errorResponse("Access denied", 403);
      }

      if (employeeId && employeeId !== requesterEmployee.id) {
        return errorResponse("Access denied", 403);
      }

      where.employeeId = requesterEmployee.id;
    } else if (employeeId) {
      where.employeeId = employeeId;
    }

    if (status) {
      where.status = status;
    }

    if (yearParam) {
      const year = Number(yearParam);
      if (Number.isFinite(year)) {
        const start = new Date(Date.UTC(year, 0, 1));
        const end = new Date(Date.UTC(year + 1, 0, 1));
        where.startDate = { gte: start, lt: end };
      }
    }

    const [requests, total] = await Promise.all([
      prisma.leaveRequest.findMany({
        where,
        include: {
          employee: {
            select: {
              id: true,
              employeeNumber: true,
              departmentId: true,
              firstName: true,
              lastName: true,
              department: {
                select: { name: true }
              }
            }
          },
          leaveType: true
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" }
      }),
      prisma.leaveRequest.count({ where })
    ]);

    return NextResponse.json({
      data: requests.map(mapLeaveRequest),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logApiError("Error fetching leave requests", error);
    return errorResponse("Failed to fetch leave requests");
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireSession(request);
    if (!auth.ok) return auth.response;
    const { session } = auth;

    const tenantId = session.user.tenantId;

    if (!tenantId) {
      return errorResponse("Tenant required", 400);
    }

    const rawBody = await request.json();
    const parsed = createLeaveSchema.safeParse(rawBody);
    if (!parsed.success) {
      return errorResponse("بيانات غير صالحة", 400, { details: parsed.error.flatten() });
    }
    const body = parsed.data;

    if (!canCreateLeaveForOthers(session.user.role)) {
      const requesterEmployee = await prisma.employee.findFirst({
        where: { tenantId, userId: session.user.id },
        select: { id: true }
      });

      if (!requesterEmployee || requesterEmployee.id !== body.employeeId) {
        return errorResponse("Access denied", 403);
      }
    }

    const startDate = new Date(body.startDate);
    const endDate = new Date(body.endDate);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return errorResponse("Invalid dates", 400);
    }

    const isHalfDay = Boolean(body.isHalfDay);

    // Calculate total days
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    const totalDays = isHalfDay ? 0.5 : diffDays;

    const year = startDate.getFullYear();

    const leaveRequest = await prisma.$transaction(async (tx) => {
      const created = await tx.leaveRequest.create({
        data: {
          tenantId,
          employeeId: body.employeeId,
          leaveTypeId: body.leaveTypeId,
          startDate,
          endDate,
          totalDays,
          reason: body.reason,
          attachmentUrl: body.attachmentUrl,
          delegateToId: body.delegateToId,
          status: "PENDING"
        },
        include: {
          employee: {
            select: {
              userId: true,
              firstName: true,
              lastName: true,
              firstNameAr: true,
              lastNameAr: true,
              manager: {
                select: {
                  userId: true
                }
              }
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

      // Track pending in balance (create if missing)
      await tx.leaveBalance.upsert({
        where: {
          employeeId_leaveTypeId_year: {
            employeeId: created.employeeId,
            leaveTypeId: created.leaveTypeId,
            year
          }
        },
        update: {
          pending: { increment: totalDays }
        },
        create: {
          tenantId,
          employeeId: created.employeeId,
          leaveTypeId: created.leaveTypeId,
          year,
          pending: totalDays
        }
      });

      return created;
    });

    if (leaveRequest.employee.manager?.userId) {
      await notifyLeaveRequestSubmitted({
        tenantId,
        managerUserId: leaveRequest.employee.manager.userId,
        employeeName: `${leaveRequest.employee.firstNameAr || leaveRequest.employee.firstName} ${leaveRequest.employee.lastNameAr || leaveRequest.employee.lastName}`,
        leaveType: leaveRequest.leaveType.nameAr || leaveRequest.leaveType.name,
        startDate: startDate.toISOString().split("T")[0] ?? "",
        endDate: endDate.toISOString().split("T")[0] ?? "",
        requestId: leaveRequest.id
      });
    }

    return dataResponse(mapLeaveRequest(leaveRequest), 201);
  } catch (error) {
    logApiError("Error creating leave request", error);
    return errorResponse("Failed to create leave request");
  }
}
