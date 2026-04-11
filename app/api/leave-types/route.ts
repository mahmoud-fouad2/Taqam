/**
 * Leave Types API Routes
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function isSuperAdmin(role: string | undefined) {
  return role === "SUPER_ADMIN";
}

function parseRequiredString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const s = value.trim();
  return s.length ? s : null;
}

function parseOptionalInt(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.trunc(n);
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const requestedTenantId = searchParams.get("tenantId") ?? undefined;

    const tenantId = isSuperAdmin(session.user.role)
      ? (requestedTenantId ?? session.user.tenantId)
      : session.user.tenantId;

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant required" }, { status: 400 });
    }

    const where: any = { tenantId };

    const leaveTypes = await prisma.leaveType.findMany({
      where,
      orderBy: { name: "asc" }
    });

    return NextResponse.json({ data: leaveTypes });
  } catch (error) {
    console.error("Error fetching leave types:", error);
    return NextResponse.json({ error: "Failed to fetch leave types" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const requestedTenantId = searchParams.get("tenantId") ?? undefined;

    const body = (await request.json()) as any;

    const tenantId = isSuperAdmin(session.user.role)
      ? typeof body.tenantId === "string"
        ? body.tenantId
        : (requestedTenantId ?? session.user.tenantId)
      : session.user.tenantId;

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant required" }, { status: 400 });
    }

    const name = parseRequiredString(body.name);
    const code = parseRequiredString(body.code);

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!code) {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }

    const leaveType = await prisma.leaveType.create({
      data: {
        tenantId,
        name,
        nameAr: body.nameAr,
        code,
        description: body.description,
        defaultDays: parseOptionalInt(body.defaultDays) ?? 0,
        maxDays: parseOptionalInt(body.maxDays),
        carryOverDays: parseOptionalInt(body.carryOverDays) ?? 0,
        carryOverExpiry: parseOptionalInt(body.carryOverExpiry),
        isPaid: body.isPaid ?? true,
        requiresApproval: body.requiresApproval ?? true,
        requiresAttachment: body.requiresAttachment ?? false,
        minServiceMonths: parseOptionalInt(body.minServiceMonths) ?? 0,
        applicableGenders: Array.isArray(body.applicableGenders) ? body.applicableGenders : [],
        color: body.color || "#3B82F6",
        isActive: body.isActive ?? true
      }
    });

    return NextResponse.json({ data: leaveType }, { status: 201 });
  } catch (error) {
    console.error("Error creating leave type:", error);
    return NextResponse.json({ error: "Failed to create leave type" }, { status: 500 });
  }
}
