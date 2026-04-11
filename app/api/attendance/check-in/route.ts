/**
 * Attendance Check-in API
 * POST /api/attendance/check-in
 */

import { NextRequest, NextResponse } from "next/server";
import { dataResponse, errorResponse, logApiError, requireSession } from "@/lib/api/route-helper";
import { submitAttendance } from "@/lib/attendance/submit-attendance";

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

    const record = await submitAttendance({
      tenantId,
      employeeId: body.employeeId,
      type: "check-in",
      source: "WEB",
      latitude: body.location?.lat,
      longitude: body.location?.lng,
      address: body.notes
    });

    return dataResponse(record, 201);
  } catch (error) {
    const status = typeof (error as any)?.status === "number" ? (error as any).status : 500;
    const message =
      typeof (error as any)?.message === "string" ? (error as any).message : "Failed to check in";
    if (status >= 500) logApiError("Error during check-in", error);
    return errorResponse(message, status);
  }
}
