/**
 * Suspend Tenant API - Super Admin Only
 * /api/admin/tenants/[id]/suspend
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logApiError } from "@/lib/api/route-helper";

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

    const body = await request.json().catch(() => ({}));
    const reason = body.reason || "Suspended by admin";

    // Get current settings first
    const currentTenant = await prisma.tenant.findUnique({
      where: { id },
      select: { settings: true }
    });
    const currentSettings = (currentTenant?.settings as Record<string, unknown>) ?? {};

    const tenant = await prisma.tenant.update({
      where: { id },
      data: {
        status: "SUSPENDED",
        settings: {
          ...currentSettings,
          suspendReason: reason,
          suspendedAt: new Date().toISOString(),
          suspendedBy: session.user.id
        }
      },
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
    logApiError("Error suspending tenant", error);
    return NextResponse.json(
      { success: false, error: "Failed to suspend tenant" },
      { status: 500 }
    );
  }
}
