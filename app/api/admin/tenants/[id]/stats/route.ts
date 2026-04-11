/**
 * Tenant Stats API - Super Admin Only
 * /api/admin/tenants/[id]/stats
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await context.params;

    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ success: false, error: "Access denied" }, { status: 403 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            employees: true,
            users: true,
            departments: true
          }
        },
        users: {
          orderBy: { updatedAt: "desc" },
          take: 1,
          select: { updatedAt: true }
        }
      }
    });

    if (!tenant) {
      return NextResponse.json({ success: false, error: "Tenant not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        employeesCount: tenant._count.employees,
        usersCount: tenant._count.users,
        departmentsCount: tenant._count.departments,
        lastLoginAt: tenant.users[0]?.updatedAt?.toISOString() ?? null
      }
    });
  } catch (error) {
    console.error("Error fetching tenant stats:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch tenant stats" },
      { status: 500 }
    );
  }
}
