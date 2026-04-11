/**
 * Activate Tenant API - Super Admin Only
 * /api/admin/tenants/[id]/activate
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await context.params;

    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ success: false, error: "Access denied" }, { status: 403 });
    }

    const tenant = await prisma.tenant.update({
      where: { id },
      data: { status: "ACTIVE" },
      include: {
        _count: {
          select: {
            employees: true,
            users: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: tenant.id,
        name: tenant.name,
        nameAr: tenant.nameAr,
        slug: tenant.slug,
        status: tenant.status.toLowerCase()
      }
    });
  } catch (error) {
    console.error("Error activating tenant:", error);
    return NextResponse.json(
      { success: false, error: "Failed to activate tenant" },
      { status: 500 }
    );
  }
}
