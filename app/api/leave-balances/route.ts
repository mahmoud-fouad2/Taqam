/**
 * Leave Balances API Routes
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { Prisma } from "@prisma/client";

function isSuperAdmin(role: string | undefined) {
  return role === "SUPER_ADMIN";
}

function nonEmpty(value: string | null): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

function parseYear(value: string | undefined): number | null {
  if (!value) return new Date().getFullYear();
  const year = Number(value);
  if (!Number.isFinite(year) || !Number.isInteger(year)) return null;
  if (year < 1970 || year > 2100) return null;
  return year;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const requestedTenantId = nonEmpty(searchParams.get("tenantId"));
    const employeeId = nonEmpty(searchParams.get("employeeId"));
    const departmentId = nonEmpty(searchParams.get("departmentId"));
    const leaveTypeId = nonEmpty(searchParams.get("leaveTypeId"));
    const yearParam = nonEmpty(searchParams.get("year"));

    const tenantId = isSuperAdmin(session.user.role)
      ? (requestedTenantId ?? session.user.tenantId)
      : session.user.tenantId;

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant required" }, { status: 400 });
    }

    const year = parseYear(yearParam);
    if (year == null) {
      return NextResponse.json({ error: "Invalid year" }, { status: 400 });
    }

    const where: Prisma.LeaveBalanceWhereInput = { tenantId, year };
    if (employeeId) where.employeeId = employeeId;
    if (leaveTypeId) where.leaveTypeId = leaveTypeId;
    if (departmentId) {
      where.employee = { departmentId };
    }

    const items = await prisma.leaveBalance.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            employeeNumber: true,
            firstName: true,
            lastName: true,
            departmentId: true,
            department: { select: { name: true } }
          }
        },
        leaveType: true
      },
      orderBy: [{ employee: { firstName: "asc" } }, { leaveType: { name: "asc" } }]
    });

    return NextResponse.json({ data: items });
  } catch (error) {
    console.error("Error fetching leave balances:", error);
    return NextResponse.json({ error: "Failed to fetch leave balances" }, { status: 500 });
  }
}
