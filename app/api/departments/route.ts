/**
 * Departments API Routes
 * GET /api/departments - List departments
 * POST /api/departments - Create department
 */

import { logApiError } from "@/lib/api/route-helper";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function isSuperAdmin(role: string | undefined) {
  return role === "SUPER_ADMIN";
}

function canManageDepartments(role: string | undefined) {
  return role === "SUPER_ADMIN" || role === "TENANT_ADMIN" || role === "HR_MANAGER";
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const requestedTenantId = searchParams.get("tenantId")?.trim() || undefined;
    const tenantId = isSuperAdmin(session.user.role)
      ? (requestedTenantId ?? session.user.tenantId ?? undefined)
      : (session.user.tenantId ?? undefined);

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant context required" }, { status: 400 });
    }

    const departments = await prisma.department.findMany({
      where: { tenantId },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            nameAr: true
          }
        },
        children: {
          select: {
            id: true,
            name: true,
            nameAr: true
          }
        },
        _count: {
          select: {
            employees: true
          }
        }
      },
      orderBy: { name: "asc" }
    });

    return NextResponse.json({ data: departments });
  } catch (error) {
    logApiError("Error fetching departments", error);
    return NextResponse.json({ error: "Failed to fetch departments" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canManageDepartments(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const requestedTenantId = typeof body.tenantId === "string" ? body.tenantId.trim() : undefined;
    const tenantId = isSuperAdmin(session.user.role)
      ? requestedTenantId || session.user.tenantId || undefined
      : session.user.tenantId || undefined;

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant required" }, { status: 400 });
    }

    // Clean parentId - convert "none" or empty string to null
    const parentId = body.parentId === "none" || body.parentId === "" ? null : body.parentId;

    if (parentId) {
      const parent = await prisma.department.findFirst({
        where: {
          id: parentId,
          tenantId
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
          tenantId
        },
        select: { id: true }
      });

      if (!manager) {
        return NextResponse.json({ error: "Manager not found" }, { status: 400 });
      }
    }

    const department = await prisma.department.create({
      data: {
        tenantId,
        name: body.name,
        nameAr: body.nameAr,
        code: body.code,
        description: body.description,
        parentId: parentId,
        managerId: body.managerId,
        isActive: true
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json({ data: department }, { status: 201 });
  } catch (error) {
    logApiError("Error creating department", error);
    return NextResponse.json({ error: "Failed to create department" }, { status: 500 });
  }
}
