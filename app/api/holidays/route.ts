/**
 * Holidays API Routes
 */

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
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");

    const where: any = {};

    if (tenantId) {
      where.tenantId = tenantId;
    }

    if (year) {
      const startOfYear = new Date(`${year}-01-01`);
      const endOfYear = new Date(`${year}-12-31`);
      where.date = {
        gte: startOfYear,
        lte: endOfYear
      };
    }

    const holidays = await prisma.holiday.findMany({
      where,
      orderBy: { date: "asc" }
    });

    return NextResponse.json({ data: holidays });
  } catch (error) {
    console.error("Error fetching holidays:", error);
    return NextResponse.json({ error: "Failed to fetch holidays" }, { status: 500 });
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

    const holiday = await prisma.holiday.create({
      data: {
        tenantId,
        name: body.name,
        nameAr: body.nameAr,
        date: new Date(body.date),
        endDate: body.endDate ? new Date(body.endDate) : null,
        isRecurring: body.isRecurring || false
      }
    });

    return NextResponse.json({ data: holiday }, { status: 201 });
  } catch (error) {
    console.error("Error creating holiday:", error);
    return NextResponse.json({ error: "Failed to create holiday" }, { status: 500 });
  }
}
