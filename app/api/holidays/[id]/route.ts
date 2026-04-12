/**
 * Single Holiday API Routes
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

    const holiday = await prisma.holiday.findUnique({
      where: { id }
    });

    if (!holiday) {
      return NextResponse.json({ error: "Holiday not found" }, { status: 404 });
    }

    if (session.user.tenantId && holiday.tenantId !== session.user.tenantId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json({ data: holiday });
  } catch (error) {
    logApiError("Error fetching holiday", error);
    return NextResponse.json({ error: "Failed to fetch holiday" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existingHoliday = await prisma.holiday.findUnique({
      where: { id }
    });

    if (!existingHoliday) {
      return NextResponse.json({ error: "Holiday not found" }, { status: 404 });
    }

    if (session.user.tenantId && existingHoliday.tenantId !== session.user.tenantId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();

    const holiday = await prisma.holiday.update({
      where: { id },
      data: {
        name: body.name,
        nameAr: body.nameAr,
        date: body.date ? new Date(body.date) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : null,
        isRecurring: body.isRecurring
      }
    });

    return NextResponse.json({ data: holiday });
  } catch (error) {
    logApiError("Error updating holiday", error);
    return NextResponse.json({ error: "Failed to update holiday" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existingHoliday = await prisma.holiday.findUnique({
      where: { id }
    });

    if (!existingHoliday) {
      return NextResponse.json({ error: "Holiday not found" }, { status: 404 });
    }

    if (session.user.tenantId && existingHoliday.tenantId !== session.user.tenantId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    await prisma.holiday.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Holiday deleted successfully" });
  } catch (error) {
    logApiError("Error deleting holiday", error);
    return NextResponse.json({ error: "Failed to delete holiday" }, { status: 500 });
  }
}
