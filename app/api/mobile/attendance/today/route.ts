import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/db";
import { logger } from "@/lib/logger";
import { requireMobileEmployeeAuthWithDevice } from "@/lib/mobile/auth";

function getTodayDate() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export async function GET(request: NextRequest) {
  const payloadOrRes = await requireMobileEmployeeAuthWithDevice(request);
  if (payloadOrRes instanceof NextResponse) return payloadOrRes;

  try {
    const today = getTodayDate();

    const record = await prisma.attendanceRecord.findFirst({
      where: {
        tenantId: payloadOrRes.tenantId,
        employeeId: payloadOrRes.employeeId,
        date: today
      }
    });

    const status = !record?.checkInTime
      ? "NONE"
      : record.checkOutTime
        ? "CHECKED_OUT"
        : "CHECKED_IN";

    const canCheckIn = status === "NONE";
    const canCheckOut = status === "CHECKED_IN";

    return NextResponse.json({
      data: {
        date: today.toISOString(),
        status,
        canCheckIn,
        canCheckOut,
        record
      }
    });
  } catch (error) {
    logger.error("Mobile attendance today error", undefined, error);
    return NextResponse.json({ error: "Failed to load today status" }, { status: 500 });
  }
}
