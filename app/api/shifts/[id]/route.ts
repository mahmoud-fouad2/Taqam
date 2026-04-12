/**
 * Single Shift API Routes
 */

import { logApiError } from "@/lib/api/route-helper";
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

    const shift = await prisma.shift.findUnique({
      where: { id },
      include: {
        employees: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeNumber: true
          }
        }
      }
    });

    if (!shift) {
      return NextResponse.json({ error: "Shift not found" }, { status: 404 });
    }

    // Check tenant access
    if (session.user.tenantId && shift.tenantId !== session.user.tenantId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json({ data: shift });
  } catch (error) {
    logApiError("Error fetching shift", error);
    return NextResponse.json({ error: "Failed to fetch shift" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existingShift = await prisma.shift.findUnique({
      where: { id }
    });

    if (!existingShift) {
      return NextResponse.json({ error: "Shift not found" }, { status: 404 });
    }

    if (session.user.tenantId && existingShift.tenantId !== session.user.tenantId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();

    const shift = await prisma.shift.update({
      where: { id },
      data: {
        name: body.name,
        nameAr: body.nameAr,
        code: body.code,
        startTime: body.startTime,
        endTime: body.endTime,
        breakStartTime: body.breakStartTime,
        breakEndTime: body.breakEndTime,
        breakDurationMinutes: body.breakDurationMinutes,
        flexibleStartMinutes: body.flexibleStartMinutes,
        flexibleEndMinutes: body.flexibleEndMinutes,
        workDays: body.workDays,
        overtimeEnabled: body.overtimeEnabled,
        overtimeMultiplier: body.overtimeMultiplier,
        color: body.color,
        isDefault: body.isDefault,
        isActive: body.isActive
      }
    });

    return NextResponse.json({ data: shift });
  } catch (error) {
    logApiError("Error updating shift", error);
    return NextResponse.json({ error: "Failed to update shift" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existingShift = await prisma.shift.findUnique({
      where: { id }
    });

    if (!existingShift) {
      return NextResponse.json({ error: "Shift not found" }, { status: 404 });
    }

    if (session.user.tenantId && existingShift.tenantId !== session.user.tenantId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Soft delete by deactivating
    await prisma.shift.update({
      where: { id },
      data: { isActive: false }
    });

    return NextResponse.json({ message: "Shift deleted successfully" });
  } catch (error) {
    logApiError("Error deleting shift", error);
    return NextResponse.json({ error: "Failed to delete shift" }, { status: 500 });
  }
}
