/**
 * Single Employee API Routes
 * GET /api/employees/[id] - Get employee
 * PUT /api/employees/[id] - Update employee
 * DELETE /api/employees/[id] - Delete employee
 */

import { NextRequest, NextResponse } from "next/server";
import {
  dataResponse,
  errorResponse,
  forbiddenResponse,
  logApiError,
  notFoundResponse,
  requireTenantOrSuperAdminSession
} from "@/lib/api/route-helper";
import prisma from "@/lib/db";
import { validateEmployeeManagerAssignment } from "@/lib/employees/manager-validation";

const EMPLOYEE_VIEW_ROLES = new Set(["SUPER_ADMIN", "TENANT_ADMIN", "HR_MANAGER", "MANAGER"]);
const EMPLOYEE_MANAGE_ROLES = new Set(["SUPER_ADMIN", "TENANT_ADMIN", "HR_MANAGER"]);

function canViewEmployee(role: string | undefined) {
  return EMPLOYEE_VIEW_ROLES.has(role ?? "");
}

function canManageEmployee(role: string | undefined) {
  return EMPLOYEE_MANAGE_ROLES.has(role ?? "");
}

function normalizeOptionalString(value: unknown) {
  if (typeof value !== "string") {
    return value === null ? null : undefined;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function buildSelfEmployeeUpdate(body: Record<string, any>) {
  return {
    firstNameAr: body.firstNameAr,
    lastNameAr: body.lastNameAr,
    email: body.email,
    phone: body.phone,
    nationalId: body.nationalId,
    dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
    gender: body.gender,
    nationality: body.nationality,
    maritalStatus: body.maritalStatus,
    address: body.address ?? undefined,
    emergencyContact: body.emergencyContact ?? undefined
  };
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const auth = await requireTenantOrSuperAdminSession(request);
    if (!auth.ok) return auth.response;
    const { session, tenantId, isSuperAdmin } = auth;

    const employee = await prisma.employee.findFirst({
      where: { id, deletedAt: null },
      include: {
        department: true,
        jobTitle: true,
        manager: {
          select: {
            id: true,
            employeeNumber: true,
            firstName: true,
            firstNameAr: true,
            lastName: true,
            lastNameAr: true,
            email: true,
            avatar: true
          }
        },
        shift: true,
        salaryRecords: {
          orderBy: [{ effectiveDate: "desc" }, { createdAt: "desc" }],
          take: 1
        },
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            status: true
          }
        }
      }
    });

    if (!employee) {
      return notFoundResponse("Employee not found");
    }

    if (!isSuperAdmin && employee.tenantId !== tenantId) {
      return errorResponse("Unauthorized", 403);
    }

    if (!canViewEmployee(session.user.role) && employee.user?.id !== session.user.id) {
      return forbiddenResponse();
    }

    return dataResponse(employee);
  } catch (error) {
    logApiError("Error fetching employee", error);
    return errorResponse("Failed to fetch employee");
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const auth = await requireTenantOrSuperAdminSession(request);
    if (!auth.ok) return auth.response;
    const { session, tenantId, isSuperAdmin } = auth;

    const body = await request.json();

    // Verify employee exists and belongs to tenant
    const existing = await prisma.employee.findUnique({
      where: { id },
      select: {
        id: true,
        tenantId: true,
        userId: true
      }
    });

    if (!existing) {
      return notFoundResponse("Employee not found");
    }

    if (!isSuperAdmin && existing.tenantId !== tenantId) {
      return errorResponse("Unauthorized", 403);
    }

    const isPrivilegedManager = canManageEmployee(session.user.role);
    const isSelf = existing.userId === session.user.id;

    if (!isPrivilegedManager && !isSelf) {
      return forbiddenResponse();
    }

    const managerId = normalizeOptionalString(body.managerId);

    if (isPrivilegedManager) {
      const managerValidation = await validateEmployeeManagerAssignment({
        tenantId: existing.tenantId,
        employeeId: existing.id,
        managerId
      });

      if (!managerValidation.ok) {
        return errorResponse(managerValidation.error, 400);
      }
    }

    const data = isPrivilegedManager
      ? {
          firstName: body.firstName,
          lastName: body.lastName,
          firstNameAr: body.firstNameAr,
          lastNameAr: body.lastNameAr,
          email: body.email,
          phone: body.phone,
          nationalId: body.nationalId,
          dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
          gender: body.gender,
          nationality: body.nationality,
          maritalStatus: body.maritalStatus,
          address: body.address ?? undefined,
          emergencyContact: body.emergencyContact ?? undefined,
          departmentId: body.departmentId,
          jobTitleId: body.jobTitleId,
          managerId,
          employmentType: body.employmentType,
          status: body.status,
          shiftId: body.shiftId,
          workLocation: body.workLocation,
          baseSalary: body.baseSalary
        }
      : buildSelfEmployeeUpdate(body);

    const employee = await prisma.employee.update({
      where: { id },
      data,
      include: {
        department: true,
        jobTitle: true
      }
    });

    return dataResponse(employee);
  } catch (error) {
    logApiError("Error updating employee", error);
    return errorResponse("Failed to update employee");
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const auth = await requireTenantOrSuperAdminSession(request);
    if (!auth.ok) return auth.response;
    const { session, tenantId, isSuperAdmin } = auth;

    const existing = await prisma.employee.findUnique({
      where: { id },
      select: {
        id: true,
        tenantId: true,
        status: true
      }
    });

    if (!existing) {
      return notFoundResponse("Employee not found");
    }

    if (!isSuperAdmin && existing.tenantId !== tenantId) {
      return errorResponse("Unauthorized", 403);
    }

    if (!canManageEmployee(session.user.role)) {
      return forbiddenResponse();
    }

    // Two-step delete:
    // 1) First delete => soft terminate
    // 2) Second delete (already terminated) => hard delete
    if (existing.status === "TERMINATED") {
      await prisma.employee.delete({ where: { id } });
      return NextResponse.json({ success: true, mode: "hard" });
    }

    await prisma.employee.update({
      where: { id },
      data: {
        status: "TERMINATED",
        terminationDate: new Date()
      }
    });

    return NextResponse.json({ success: true, mode: "soft" });
  } catch (error) {
    logApiError("Error deleting employee", error);
    return errorResponse("Failed to delete employee");
  }
}
