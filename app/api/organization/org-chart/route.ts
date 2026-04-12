import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { logApiError } from "@/lib/api/route-helper";
import { buildDepartmentTree, buildEmployeeOrgForest } from "@/lib/organization/tree";

const ALLOWED_ROLES = new Set(["SUPER_ADMIN", "TENANT_ADMIN", "HR_MANAGER", "MANAGER"]);

function countEmployeeIssues(nodes: Array<{ hasHierarchyIssue?: boolean; directReports: any[] }>): number {
  return nodes.reduce((sum, node) => {
    return sum + (node.hasHierarchyIssue ? 1 : 0) + countEmployeeIssues(node.directReports);
  }, 0);
}

function countDepartmentIssues(nodes: Array<{ hasHierarchyIssue?: boolean; children: any[] }>): number {
  return nodes.reduce((sum, node) => {
    return sum + (node.hasHierarchyIssue ? 1 : 0) + countDepartmentIssues(node.children);
  }, 0);
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!ALLOWED_ROLES.has(session.user.role || "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const requestedTenantId = searchParams.get("tenantId")?.trim() || undefined;
    const tenantId = session.user.role === "SUPER_ADMIN"
      ? (requestedTenantId ?? session.user.tenantId ?? undefined)
      : (session.user.tenantId ?? undefined);

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant context required" }, { status: 400 });
    }

    const [employees, departments] = await Promise.all([
      prisma.employee.findMany({
        where: {
          tenantId,
          deletedAt: null,
          status: {
            notIn: ["TERMINATED", "RESIGNED"]
          }
        },
        select: {
          id: true,
          employeeNumber: true,
          firstName: true,
          firstNameAr: true,
          lastName: true,
          lastNameAr: true,
          email: true,
          avatar: true,
          managerId: true,
          status: true,
          department: {
            select: {
              id: true,
              name: true,
              nameAr: true
            }
          },
          jobTitle: {
            select: {
              id: true,
              name: true,
              nameAr: true
            }
          },
          branch: {
            select: {
              id: true,
              name: true,
              nameAr: true
            }
          }
        },
        orderBy: [{ firstName: "asc" }, { lastName: "asc" }]
      }),
      prisma.department.findMany({
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
      })
    ]);

    const employeeSummaryById = new Map(
      employees.map((employee) => [
        employee.id,
        {
          id: employee.id,
          employeeNumber: employee.employeeNumber,
          firstName: employee.firstName,
          firstNameAr: employee.firstNameAr,
          lastName: employee.lastName,
          lastNameAr: employee.lastNameAr,
          email: employee.email,
          avatar: employee.avatar
        }
      ])
    );

    const employeeTree = buildEmployeeOrgForest(employees);
    const departmentTree = buildDepartmentTree(
      departments.map((department) => ({
        id: department.id,
        name: department.name,
        nameAr: department.nameAr,
        code: department.code,
        parentId: department.parentId,
        isActive: department.isActive,
        employeesCount: department._count.employees,
        manager: department.managerId
          ? (employeeSummaryById.get(department.managerId) ?? null)
          : null
      }))
    );

    return NextResponse.json({
      data: {
        employeeTree,
        departmentTree,
        stats: {
          employeesCount: employees.length,
          departmentsCount: departments.length,
          leadersCount: employeeTree.length,
          departmentRoots: departmentTree.length,
          employeeHierarchyIssues: countEmployeeIssues(employeeTree),
          departmentHierarchyIssues: countDepartmentIssues(departmentTree)
        }
      }
    });
  } catch (error) {
    logApiError("Error fetching organization chart", error);
    return NextResponse.json({ error: "Failed to fetch organization chart" }, { status: 500 });
  }
}