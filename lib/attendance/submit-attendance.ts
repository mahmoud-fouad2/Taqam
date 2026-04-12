import prisma from "@/lib/db";
import { isWithinRadiusMeters } from "@/lib/geo";
import type { CheckSource } from "@prisma/client";

type AttendanceError = Error & { status: number };

function createAttendanceError(message: string, status: number): AttendanceError {
  const error = new Error(message) as AttendanceError;
  error.status = status;
  return error;
}

export type SubmitAttendanceInput = {
  tenantId: string;
  employeeId: string;
  type: "check-in" | "check-out";
  source?: CheckSource;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  address?: string;
};

function buildLocalDateWithTime(baseDate: Date, hhmm?: string | null) {
  if (!hhmm) return null;

  const [hoursRaw, minutesRaw] = hhmm.split(":");
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }

  return new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate(),
    hours,
    minutes,
    0,
    0
  );
}

export async function submitAttendance(input: SubmitAttendanceInput) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const employee = await prisma.employee.findFirst({
    where: { id: input.employeeId, tenantId: input.tenantId },
    select: {
      id: true,
      shiftId: true,
      overtimeEligible: true,
      shift: {
        select: {
          id: true,
          endTime: true,
          overtimeEnabled: true
        }
      }
    }
  });

  if (!employee) {
    throw createAttendanceError("Employee not found", 404);
  }

  const policy = await prisma.tenantAttendancePolicy.findUnique({
    where: { tenantId: input.tenantId }
  });

  const hasLocation = typeof input.latitude === "number" && typeof input.longitude === "number";

  let matchedLocationId: string | null = null;

  if (policy?.enforceGeofence) {
    if (!hasLocation) {
      if (!policy.allowCheckInWithoutLocation) {
        throw createAttendanceError("Location is required for attendance", 400);
      }
    } else {
      if (typeof input.accuracy === "number" && input.accuracy > policy.maxAccuracyMeters) {
        throw createAttendanceError("Location accuracy is too low", 400);
      }

      const locations = await prisma.tenantWorkLocation.findMany({
        where: { tenantId: input.tenantId, isActive: true },
        select: { id: true, lat: true, lng: true, radiusMeters: true }
      });

      if (locations.length === 0) {
        throw createAttendanceError("No work locations configured", 400);
      }

      const point = { lat: input.latitude!, lng: input.longitude! };

      const match = locations.find((loc) =>
        isWithinRadiusMeters(
          point,
          { lat: Number(loc.lat), lng: Number(loc.lng) },
          loc.radiusMeters
        )
      );

      if (!match) {
        throw createAttendanceError("Outside allowed work location", 403);
      }

      matchedLocationId = match.id;
    }
  }

  let record = await prisma.attendanceRecord.findFirst({
    where: {
      tenantId: input.tenantId,
      employeeId: input.employeeId,
      date: today
    }
  });

  const source: CheckSource = input.source || "WEB";

  if (input.type === "check-in") {
    if (record && record.checkInTime) {
      throw createAttendanceError("Already checked in today", 400);
    }

    if (record) {
      record = await prisma.attendanceRecord.update({
        where: { id: record.id },
        data: {
          checkInTime: now,
          checkInSource: source,
          checkInLat: input.latitude,
          checkInLng: input.longitude,
          checkInAddress: input.address,
          checkInLocationId: matchedLocationId,
          status: "PRESENT",
          ...(record.shiftId ? {} : employee.shiftId ? { shiftId: employee.shiftId } : {})
        }
      });
    } else {
      record = await prisma.attendanceRecord.create({
        data: {
          tenantId: input.tenantId,
          employeeId: input.employeeId,
          shiftId: employee.shiftId,
          date: today,
          checkInTime: now,
          checkInSource: source,
          checkInLat: input.latitude,
          checkInLng: input.longitude,
          checkInAddress: input.address,
          checkInLocationId: matchedLocationId,
          status: "PRESENT"
        }
      });
    }
  } else {
    if (!record || !record.checkInTime) {
      throw createAttendanceError("Must check in first", 400);
    }

    if (record.checkOutTime) {
      throw createAttendanceError("Already checked out today", 400);
    }

    const checkInTime = new Date(record.checkInTime);
    const totalMinutes = Math.floor((now.getTime() - checkInTime.getTime()) / 60000);
    const shiftEndTime = buildLocalDateWithTime(today, employee.shift?.endTime);
    const overtimeMinutes =
      policy?.autoCalculateOvertime &&
      employee.overtimeEligible &&
      employee.shift?.overtimeEnabled &&
      shiftEndTime
        ? Math.max(Math.floor((now.getTime() - shiftEndTime.getTime()) / 60000), 0)
        : 0;

    record = await prisma.attendanceRecord.update({
      where: { id: record.id },
      data: {
        checkOutTime: now,
        checkOutSource: source,
        checkOutLat: input.latitude,
        checkOutLng: input.longitude,
        checkOutAddress: input.address,
        checkOutLocationId: matchedLocationId,
        totalWorkMinutes: totalMinutes,
        overtimeMinutes
      }
    });
  }

  return record;
}
