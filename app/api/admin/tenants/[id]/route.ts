/**
 * Admin Tenant Detail API Routes - Super Admin Only
 * /api/admin/tenants/[id]
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { TenantStatus } from "@/lib/types/tenant";
import { mapTenantFromDb, readSettings } from "@/lib/admin/tenant-mapping";

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
        }
      }
    });

    if (!tenant) {
      return NextResponse.json({ success: false, error: "Tenant not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: mapTenantFromDb(tenant) });
  } catch (error) {
    console.error("Error fetching tenant:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch tenant" }, { status: 500 });
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

    const existing = await prisma.tenant.findUnique({
      where: { id },
      select: { settings: true }
    });
    const currentSettings = readSettings(existing);

    const incomingSettings =
      body.settings && typeof body.settings === "object"
        ? (body.settings as Record<string, unknown>)
        : {};

    const mergedSettings: Record<string, unknown> = {
      ...currentSettings,
      ...incomingSettings,
      ...(body.email !== undefined && { contactEmail: body.email }),
      ...(body.phone !== undefined && { contactPhone: body.phone }),
      ...(body.address !== undefined && { address: body.address }),
      ...(body.city !== undefined && { city: body.city }),
      ...(body.country !== undefined && { country: body.country }),
      ...(body.defaultLocale !== undefined && { defaultLocale: body.defaultLocale }),
      ...(body.defaultTheme !== undefined && { defaultTheme: body.defaultTheme })
    };

    // Check slug uniqueness if changed
    if (body.slug) {
      const existing = await prisma.tenant.findFirst({
        where: {
          slug: body.slug,
          NOT: { id }
        }
      });
      if (existing) {
        return NextResponse.json({ success: false, error: "Slug already exists" }, { status: 400 });
      }
    }

    const tenant = await prisma.tenant.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.nameAr && { nameAr: body.nameAr }),
        ...(body.slug && { slug: body.slug }),
        ...(body.domain !== undefined && { domain: body.domain }),
        ...(body.logo !== undefined && { logo: body.logo }),
        ...(body.timezone && { timezone: body.timezone }),
        ...(body.currency && { currency: body.currency }),
        ...(body.weekStartDay !== undefined && { weekStartDay: body.weekStartDay }),
        ...(body.plan && { plan: body.plan.toUpperCase() }),
        ...(body.planExpiresAt && { planExpiresAt: new Date(body.planExpiresAt) }),
        ...(body.maxEmployees !== undefined && { maxEmployees: body.maxEmployees }),
        ...(body.status && { status: body.status.toUpperCase() }),
        settings: mergedSettings
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

    return NextResponse.json({ success: true, data: mapTenantFromDb(tenant) });
  } catch (error) {
    console.error("Error updating tenant:", error);
    return NextResponse.json({ success: false, error: "Failed to update tenant" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await context.params;

    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ success: false, error: "Access denied" }, { status: 403 });
    }

    // Soft delete by setting status to CANCELLED
    await prisma.tenant.update({
      where: { id },
      data: { status: "CANCELLED" }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting tenant:", error);
    return NextResponse.json({ success: false, error: "Failed to delete tenant" }, { status: 500 });
  }
}
