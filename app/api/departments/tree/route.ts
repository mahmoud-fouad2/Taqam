import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { logApiError } from "@/lib/api/route-helper";
import { buildDepartmentTree } from "@/lib/organization/tree";

function isSuperAdmin(role: string | undefined) {
  return role === "SUPER_ADMIN";
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
      select: {
        id: true,
        name: true,
        nameAr: true,
        code: true,
        parentId: true,
        managerId: true,
        isActive: true,
        _count: {
          select: {
            employees: {
              where: {
                deletedAt: null,
                status: {
                  notIn: ["TERMINATED", "RESIGNED"]
                }
              }
            }
          }
        }
      },
      orderBy: [{ name: "asc" }]
    });

    const managerIds = [
      ...new Set(
        departments
          .map((department) => department.managerId)
          .filter((managerId): managerId is string => Boolean(managerId))
      )
    ];
    const managers = managerIds.length
      ? await prisma.employee.findMany({
          where: {
            tenantId,
            id: { in: managerIds }
          },
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
        })
      : [];

    const managerById = new Map(managers.map((manager) => [manager.id, manager]));

    const tree = buildDepartmentTree(
      departments.map((department) => ({
        id: department.id,
        name: department.name,
        nameAr: department.nameAr,
        code: department.code,
        parentId: department.parentId,
        isActive: department.isActive,
        employeesCount: department._count.employees,
        manager: department.managerId ? (managerById.get(department.managerId) ?? null) : null
      }))
    );

    return NextResponse.json({
      data: tree,
      stats: {
        totalDepartments: departments.length,
        rootDepartments: tree.length
      }
    });
  } catch (error) {
    logApiError("Error fetching department tree", error);
    return NextResponse.json({ error: "Failed to fetch department tree" }, { status: 500 });
  }
}