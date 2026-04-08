import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireMobileEmployeeAuthWithDevice } from "@/lib/mobile/auth";

export async function GET(request: NextRequest) {
  const payloadOrRes = await requireMobileEmployeeAuthWithDevice(request);
  if (payloadOrRes instanceof NextResponse) return payloadOrRes;

  try {
    const types = await prisma.leaveType.findMany({
      where: { tenantId: payloadOrRes.tenantId, isActive: true },
      select: {
        id: true,
        name: true,
        nameAr: true,
        code: true,
        isPaid: true,
        requiresAttachment: true,
        defaultDays: true,
        maxDays: true,
        color: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ data: types });
  } catch (error) {
    console.error("Mobile leave types GET error:", error);
    return NextResponse.json({ error: "Failed to fetch leave types" }, { status: 500 });
  }
}
