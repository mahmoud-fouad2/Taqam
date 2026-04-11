/**
 * Attendance API Routes
 * GET /api/attendance - List attendance records
 * POST /api/attendance - Create attendance record (check-in/out)
 */

import { NextRequest, NextResponse } from "next/server";
import {
  dataResponse,
  errorResponse,
  logApiError,
  parsePagination,
  requireSession
} from "@/lib/api/route-helper";
import prisma from "@/lib/db";
import { submitAttendance } from "@/lib/attendance/submit-attendance";

const STATUS_TO_DB: Record<string, string> = {
  pending: "PENDING",
  present: "PRESENT",
  absent: "ABSENT",
  late: "LATE",
  early_leave: "EARLY_LEAVE",
  on_leave: "ON_LEAVE",
  holiday: "HOLIDAY",
  weekend: "WEEKEND"
};

const STATUS_FROM_DB: Record<string, string> = {
  PENDING: "pending",
  PRESENT: "present",
  ABSENT: "absent",
  LATE: "late",
  EARLY_LEAVE: "early_leave",
  ON_LEAVE: "on_leave",
  HOLIDAY: "holiday",
  WEEKEND: "weekend"
};

const SOURCE_FROM_DB: Record<string, string> = {
  MANUAL: "manual",
  BIOMETRIC: "biometric",
  MOBILE: "mobile",
  WEB: "web"
};

function toIsoDateOnly(d: Date) {
  return d.toISOString().split("T")[0];
}

function combineDateAndTimeUtc(dateOnly: string, hhmm: string | null | undefined) {
  if (!hhmm) return "";
  const [y, m, d] = dateOnly.split("-").map((x) => Number(x));
  const [hh, mm] = hhmm.split(":").map((x) => Number(x));
  if (!y || !m || !d || Number.isNaN(hh) || Number.isNaN(mm)) return "";
  return new Date(Date.UTC(y, m - 1, d, hh, mm, 0, 0)).toISOString();
}

function mapAttendanceRecord(record: any) {
  const dateOnly = toIsoDateOnly(record.date);
  const expectedCheckIn = combineDateAndTimeUtc(dateOnly, record.shift?.startTime);
  const expectedCheckOut = combineDateAndTimeUtc(dateOnly, record.shift?.endTime);

  return {
    id: record.id,
    tenantId: record.tenantId,
    employeeId: record.employeeId,
    shiftId: record.shiftId ?? record.employee?.shiftId ?? "",
    date: dateOnly,
    checkInTime: record.checkInTime ? new Date(record.checkInTime).toISOString() : undefined,
    checkOutTime: record.checkOutTime ? new Date(record.checkOutTime).toISOString() : undefined,
    expectedCheckIn,
    expectedCheckOut,
    status: STATUS_FROM_DB[String(record.status)] ?? "pending",
    lateMinutes: record.lateMinutes ?? undefined,
    earlyLeaveMinutes: record.earlyLeaveMinutes ?? undefined,
    totalWorkMinutes: record.totalWorkMinutes ?? undefined,
    overtimeMinutes: record.overtimeMinutes ?? undefined,
    checkInSource: record.checkInSource
      ? (SOURCE_FROM_DB[String(record.checkInSource)] ?? String(record.checkInSource).toLowerCase())
      : undefined,
    checkOutSource: record.checkOutSource
      ? (SOURCE_FROM_DB[String(record.checkOutSource)] ??
        String(record.checkOutSource).toLowerCase())
      : undefined,
    checkInLocation:
      record.checkInLat && record.checkInLng
        ? {
            latitude: Number(record.checkInLat),
            longitude: Number(record.checkInLng),
            address: record.checkInAddress ?? undefined
          }
        : undefined,
    checkOutLocation:
      record.checkOutLat && record.checkOutLng
        ? {
            latitude: Number(record.checkOutLat),
            longitude: Number(record.checkOutLng),
            address: record.checkOutAddress ?? undefined
          }
        : undefined,
    notes: record.notes ?? undefined,
    modifiedById: record.modifiedById ?? undefined,
    modifiedAt: record.modifiedAt ? new Date(record.modifiedAt).toISOString() : undefined,
    createdAt: new Date(record.createdAt).toISOString(),
    updatedAt: new Date(record.updatedAt).toISOString()
  };
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireSession(request);
    if (!auth.ok) return auth.response;
    const { session } = auth;

    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = parsePagination(searchParams);
    const employeeId = searchParams.get("employeeId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const status = searchParams.get("status");

    const tenantId = session.user.tenantId;

    const where: any = {};

    if (tenantId) {
      where.tenantId = tenantId;
    }

    if (employeeId) {
      where.employeeId = employeeId;
    }

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    if (status) {
      const normalized = String(status).toLowerCase();
      where.status = STATUS_TO_DB[normalized] ?? String(status).toUpperCase();
    }

    const [records, total] = await Promise.all([
      prisma.attendanceRecord.findMany({
        where,
        include: {
          employee: {
            select: {
              id: true,
              shiftId: true,
              firstName: true,
              lastName: true,
              employeeNumber: true,
              department: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
          shift: true
        },
        skip,
        take: limit,
        orderBy: { date: "desc" }
      }),
      prisma.attendanceRecord.count({ where })
    ]);

    return NextResponse.json({
      data: records.map(mapAttendanceRecord),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logApiError("Error fetching attendance", error);
    return errorResponse("Failed to fetch attendance records");
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireSession(request);
    if (!auth.ok) return auth.response;
    const { session } = auth;

    const tenantId = session.user.tenantId;

    if (!tenantId) {
      return errorResponse("Tenant required", 400);
    }

    const body = await request.json();

    if (!body?.employeeId) {
      return errorResponse("employeeId is required", 400);
    }

    if (body.type !== "check-in" && body.type !== "check-out") {
      return errorResponse("type must be check-in or check-out", 400);
    }

    const record = await submitAttendance({
      tenantId,
      employeeId: body.employeeId,
      type: body.type,
      source: body.source || "WEB",
      latitude: body.latitude,
      longitude: body.longitude,
      accuracy: body.accuracy,
      address: body.address
    });

    return dataResponse(mapAttendanceRecord(record), 201);
  } catch (error) {
    const status = typeof (error as any)?.status === "number" ? (error as any).status : 500;
    const message =
      typeof (error as any)?.message === "string"
        ? (error as any).message
        : "Failed to record attendance";
    if (status >= 500) logApiError("Error creating attendance", error);
    return errorResponse(message, status);
  }
}
