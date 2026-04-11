/**
 * Single Tenant API Routes - Super Admin Only
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            employees: true,
            departments: true,
            shifts: true,
            leaveTypes: true
          }
        }
      }
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    return NextResponse.json({ data: tenant });
  } catch (error) {
    console.error("Error fetching tenant:", error);
    return NextResponse.json({ error: "Failed to fetch tenant" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const existingTenant = await prisma.tenant.findUnique({
      where: { id }
    });

    if (!existingTenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const body = await request.json();

    // Check slug uniqueness if changed
    if (body.slug && body.slug !== existingTenant.slug) {
      const duplicateSlug = await prisma.tenant.findFirst({
        where: { slug: body.slug, id: { not: id } }
      });
      if (duplicateSlug) {
        return NextResponse.json({ error: "Slug already exists" }, { status: 400 });
      }
    }

    const tenant = await prisma.tenant.update({
      where: { id },
      data: {
        name: body.name,
        nameAr: body.nameAr,
        slug: body.slug,
        domain: body.domain,
        logo: body.logo,
        timezone: body.timezone,
        currency: body.currency,
        weekStartDay: body.weekStartDay,
        plan: body.plan,
        planExpiresAt: body.planExpiresAt ? new Date(body.planExpiresAt) : undefined,
        maxEmployees: body.maxEmployees,
        status: body.status,
        settings: body.settings
      }
    });

    return NextResponse.json({ data: tenant });
  } catch (error) {
    console.error("Error updating tenant:", error);
    return NextResponse.json({ error: "Failed to update tenant" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const existingTenant = await prisma.tenant.findUnique({
      where: { id }
    });

    if (!existingTenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Soft delete - set status to CANCELLED
    await prisma.tenant.update({
      where: { id },
      data: { status: "CANCELLED" }
    });

    return NextResponse.json({ message: "Tenant deleted successfully" });
  } catch (error) {
    console.error("Error deleting tenant:", error);
    return NextResponse.json({ error: "Failed to delete tenant" }, { status: 500 });
  }
}
