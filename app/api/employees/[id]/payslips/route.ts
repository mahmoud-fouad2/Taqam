import { NextRequest, NextResponse } from "next/server";

import {
  dataResponse,
  errorResponse,
  logApiError,
  requireTenantSession
} from "@/lib/api/route-helper";
import { listPayslipsForEmployee } from "@/lib/payroll/payslips";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireTenantSession(request);
    if (!auth.ok) return auth.response;
    const { tenantId } = auth;
    const { id } = await params;

    const url = new URL(request.url);
    const yearRaw = url.searchParams.get("year");
    const year = yearRaw ? Number(yearRaw) : undefined;
    const status = url.searchParams.get("status") || undefined;

    const payslips = await listPayslipsForEmployee(tenantId, id, {
      year: Number.isFinite(year) ? year : undefined,
      status
    });

    return dataResponse(payslips);
  } catch (error) {
    logApiError("Error fetching employee payslips", error);
    return errorResponse("Failed to fetch employee payslips");
  }
}
