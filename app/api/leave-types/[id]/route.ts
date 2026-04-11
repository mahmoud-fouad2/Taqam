/**
 * Leave Type (single) API Routes
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function isSuperAdmin(role: string | undefined) {
  return role === "SUPER_ADMIN";
}

function parseOptionalInt(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.trunc(n);
}

function parseRequiredString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const s = value.trim();
  return s.length ? s : null;
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
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

    const { id } = await params;

    const existing = await prisma.leaveType.findFirst({
      where: { id, tenantId }
    });

    if (!existing) {
      return NextResponse.json({ error: "Leave type not found" }, { status: 404 });
    }

    const body = (await request.json()) as any;

    const name = body.name !== undefined ? parseRequiredString(body.name) : undefined;
    const code = body.code !== undefined ? parseRequiredString(body.code) : undefined;

    if (name === null) {
      return NextResponse.json({ error: "Invalid name" }, { status: 400 });
    }
    if (code === null) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }

    const updated = await prisma.leaveType.update({
      where: { id },
      data: {
        name: name ?? undefined,
        nameAr: body.nameAr === undefined ? undefined : body.nameAr,
        code: code ?? undefined,
        description: body.description === undefined ? undefined : body.description,
        defaultDays:
          body.defaultDays === undefined ? undefined : (parseOptionalInt(body.defaultDays) ?? 0),
        maxDays: body.maxDays === undefined ? undefined : parseOptionalInt(body.maxDays),
        carryOverDays:
          body.carryOverDays === undefined
            ? undefined
            : (parseOptionalInt(body.carryOverDays) ?? 0),
        carryOverExpiry:
          body.carryOverExpiry === undefined ? undefined : parseOptionalInt(body.carryOverExpiry),
        isPaid: body.isPaid === undefined ? undefined : Boolean(body.isPaid),
        requiresApproval:
          body.requiresApproval === undefined ? undefined : Boolean(body.requiresApproval),
        requiresAttachment:
          body.requiresAttachment === undefined ? undefined : Boolean(body.requiresAttachment),
        minServiceMonths:
          body.minServiceMonths === undefined
            ? undefined
            : (parseOptionalInt(body.minServiceMonths) ?? 0),
        applicableGenders: Array.isArray(body.applicableGenders)
          ? body.applicableGenders
          : undefined,
        color: body.color === undefined ? undefined : String(body.color),
        isActive: body.isActive === undefined ? undefined : Boolean(body.isActive)
      }
    });

    return NextResponse.json({ data: updated });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "Duplicate leave type code for this tenant" },
        { status: 400 }
      );
    }

    console.error("Error updating leave type:", error);
    return NextResponse.json({ error: "Failed to update leave type" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    const { id } = await params;

    const existing = await prisma.leaveType.findFirst({
      where: { id, tenantId },
      select: { id: true }
    });

    if (!existing) {
      return NextResponse.json({ error: "Leave type not found" }, { status: 404 });
    }

    await prisma.leaveType.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    // Likely used by leave requests (onDelete: Restrict)
    if (error?.code === "P2003") {
      return NextResponse.json(
        { error: "Cannot delete leave type while it is referenced by leave requests" },
        { status: 409 }
      );
    }

    console.error("Error deleting leave type:", error);
    return NextResponse.json({ error: "Failed to delete leave type" }, { status: 500 });
  }
}
