/**
 * Shifts API Routes
 */

import { logApiError } from "@/lib/api/route-helper";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;

    const where: any = {};
    if (tenantId) {
      where.tenantId = tenantId;
    }

    const shifts = await prisma.shift.findMany({
      where,
      include: {
        _count: {
          select: {
            employees: true
          }
        }
      },
      orderBy: { name: "asc" }
    });

    return NextResponse.json({ data: shifts });
  } catch (error) {
    logApiError("Error fetching shifts", error);
    return NextResponse.json({ error: "Failed to fetch shifts" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant required" }, { status: 400 });
    }

    const body = await request.json();

    const shift = await prisma.shift.create({
      data: {
        tenantId,
        name: body.name,
        nameAr: body.nameAr,
        code: body.code,
        startTime: body.startTime,
        endTime: body.endTime,
        breakStartTime: body.breakStartTime,
        breakEndTime: body.breakEndTime,
        breakDurationMinutes: body.breakDurationMinutes,
        flexibleStartMinutes: body.flexibleStartMinutes || 0,
        flexibleEndMinutes: body.flexibleEndMinutes || 0,
        workDays: body.workDays || [0, 1, 2, 3, 4],
        overtimeEnabled: body.overtimeEnabled || false,
        overtimeMultiplier: body.overtimeMultiplier,
        color: body.color || "#3B82F6",
        isDefault: body.isDefault || false,
        isActive: true
      }
    });

    return NextResponse.json({ data: shift }, { status: 201 });
  } catch (error) {
    logApiError("Error creating shift", error);
    return NextResponse.json({ error: "Failed to create shift" }, { status: 500 });
  }
}
