/**
 * Tenant Settings API - Super Admin Only
 * /api/admin/tenants/[id]/settings
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logApiError } from "@/lib/api/route-helper";

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
      select: {
        settings: true,
        maxEmployees: true,
        plan: true
      }
    });

    if (!tenant) {
      return NextResponse.json({ success: false, error: "Tenant not found" }, { status: 404 });
    }

    const settings = (tenant.settings as Record<string, unknown>) ?? {};

    return NextResponse.json({
      success: true,
      data: {
        allowedModules: settings.allowedModules ?? ["employees", "attendance", "leaves", "payroll"],
        maxEmployees: tenant.maxEmployees ?? 10,
        maxUsers: settings.maxUsers ?? 5,
        features: settings.features ?? {}
      }
    });
  } catch (error) {
    logApiError("Error fetching tenant settings", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch tenant settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await context.params;

    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ success: false, error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();

    const tenant = await prisma.tenant.findUnique({
      where: { id },
      select: { settings: true, maxEmployees: true }
    });

    if (!tenant) {
      return NextResponse.json({ success: false, error: "Tenant not found" }, { status: 404 });
    }

    const currentSettings = (tenant.settings as Record<string, unknown>) ?? {};

    const updatedTenant = await prisma.tenant.update({
      where: { id },
      data: {
        ...(body.maxEmployees !== undefined && { maxEmployees: body.maxEmployees }),
        settings: {
          ...currentSettings,
          ...(body.allowedModules !== undefined && { allowedModules: body.allowedModules }),
          ...(body.maxUsers !== undefined && { maxUsers: body.maxUsers }),
          ...(body.features !== undefined && { features: body.features })
        }
      }
    });

    const newSettings = (updatedTenant.settings as Record<string, unknown>) ?? {};

    return NextResponse.json({
      success: true,
      data: {
        allowedModules: newSettings.allowedModules ?? [],
        maxEmployees: updatedTenant.maxEmployees ?? 10,
        maxUsers: newSettings.maxUsers ?? 5,
        features: newSettings.features ?? {}
      }
    });
  } catch (error) {
    logApiError("Error updating tenant settings", error);
    return NextResponse.json(
      { success: false, error: "Failed to update tenant settings" },
      { status: 500 }
    );
  }
}
