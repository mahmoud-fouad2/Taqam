/**
 * Single Department API Routes
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

function isSuperAdmin(role: string | undefined) {
  return role === "SUPER_ADMIN";
}

function canManageDepartments(role: string | undefined) {
  return role === "SUPER_ADMIN" || role === "TENANT_ADMIN" || role === "HR_MANAGER";
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    const superAdmin = isSuperAdmin(session.user.role);

    if (!tenantId && !superAdmin) {
      return NextResponse.json({ error: "Tenant required" }, { status: 400 });
    }

    const department = await prisma.department.findFirst({
      where: {
        id,
        ...(superAdmin ? {} : { tenantId: tenantId! })
      },
      include: {
        parent: true,
        children: true,
        employees: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            jobTitle: true
          }
        }
      }
    });

    if (!department) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 });
    }

    return NextResponse.json({ data: department });
  } catch (error) {
    console.error("Error fetching department:", error);
    return NextResponse.json({ error: "Failed to fetch department" }, { status: 500 });
  }
}

async function updateDepartment(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canManageDepartments(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const tenantId = session.user.tenantId;
    const superAdmin = isSuperAdmin(session.user.role);

    if (!tenantId && !superAdmin) {
      return NextResponse.json({ error: "Tenant required" }, { status: 400 });
    }

    const existingDepartment = await prisma.department.findFirst({
      where: {
        id,
        ...(superAdmin ? {} : { tenantId: tenantId! })
      },
      select: {
        id: true,
        tenantId: true
      }
    });

    if (!existingDepartment) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 });
    }

    const body = await request.json();

    // Clean parentId - convert "none" or empty string to null
    const parentId = body.parentId === "none" || body.parentId === "" ? null : body.parentId;

    if (parentId) {
      const parent = await prisma.department.findFirst({
        where: {
          id: parentId,
          tenantId: existingDepartment.tenantId
        },
        select: { id: true }
      });

      if (!parent) {
        return NextResponse.json({ error: "Parent department not found" }, { status: 400 });
      }
    }

    if (body.managerId) {
      const manager = await prisma.employee.findFirst({
        where: {
          id: body.managerId,
          tenantId: existingDepartment.tenantId
        },
        select: { id: true }
      });

      if (!manager) {
        return NextResponse.json({ error: "Manager not found" }, { status: 400 });
      }
    }

    const department = await prisma.department.update({
      where: { id },
      data: {
        name: body.name,
        nameAr: body.nameAr,
        code: body.code,
        description: body.description,
        parentId: parentId,
        managerId: body.managerId,
        isActive: body.isActive
      }
    });

    return NextResponse.json({ data: department });
  } catch (error) {
    console.error("Error updating department:", error);
    return NextResponse.json({ error: "Failed to update department" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: RouteParams) {
  return updateDepartment(request, context);
}

export async function PATCH(request: NextRequest, context: RouteParams) {
  return updateDepartment(request, context);
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canManageDepartments(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const tenantId = session.user.tenantId;
    const superAdmin = isSuperAdmin(session.user.role);

    if (!tenantId && !superAdmin) {
      return NextResponse.json({ error: "Tenant required" }, { status: 400 });
    }

    const existingDepartment = await prisma.department.findFirst({
      where: {
        id,
        ...(superAdmin ? {} : { tenantId: tenantId! })
      },
      select: {
        id: true,
        tenantId: true
      }
    });

    if (!existingDepartment) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 });
    }

    // Check if department has employees
    const employeeCount = await prisma.employee.count({
      where: {
        departmentId: id,
        tenantId: existingDepartment.tenantId
      }
    });

    if (employeeCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete department with employees" },
        { status: 400 }
      );
    }

    await prisma.department.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting department:", error);
    return NextResponse.json({ error: "Failed to delete department" }, { status: 500 });
  }
}
