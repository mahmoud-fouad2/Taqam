/**
 * Tenant Users API - Super Admin Only
 * /api/admin/tenants/[id]/users
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    const { id: tenantId } = await context.params;

    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ success: false, error: "Access denied" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      where: { tenantId },
      orderBy: [{ createdAt: "asc" }],
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        createdAt: true,
        lastLoginAt: true,
        employee: {
          select: {
            id: true,
            employeeNumber: true
          }
        }
      }
    });

    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    console.error("Error fetching tenant users:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch tenant users" },
      { status: 500 }
    );
  }
}
