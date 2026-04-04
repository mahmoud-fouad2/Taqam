/**
 * Payroll Payslips API (MVP)
 * GET  /api/payroll/payslips?periodId=...&status=...&q=...
 * POST /api/payroll/payslips  (send all for a period)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireTenantSession } from "@/lib/api/route-helper";
import { listPayslipsForPeriod, sendPayslipsForPeriod, toIsoDate } from "@/lib/payroll/payslips";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireTenantSession(request);
    if (!auth.ok) return auth.response;
    const { tenantId } = auth;

    const url = new URL(request.url);
    const periodId = url.searchParams.get("periodId") || "";
    const status = (url.searchParams.get("status") || "").toLowerCase();
    const q = (url.searchParams.get("q") || "").trim();

    if (!periodId) {
      return NextResponse.json({ error: "periodId is required" }, { status: 400 });
    }

    const result = await listPayslipsForPeriod(tenantId, periodId, { status, q });
    const period = result.period;

    if (!period) {
      return NextResponse.json({ error: "Payroll period not found" }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        period: {
          id: period.id,
          startDate: toIsoDate(period.startDate),
          endDate: toIsoDate(period.endDate),
          paymentDate: toIsoDate(period.paymentDate),
        },
        payslips: result.payslips,
      },
    });
  } catch (error) {
    console.error("Error loading payslips:", error);
    return NextResponse.json({ error: "Failed to load payslips" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireTenantSession(request);
    if (!auth.ok) return auth.response;
    const { tenantId } = auth;

    const body = (await request.json().catch(() => null)) as
      | { periodId?: string }
      | null;

    const periodId = body?.periodId || "";
    if (!periodId) {
      return NextResponse.json({ error: "periodId is required" }, { status: 400 });
    }

    const result = await sendPayslipsForPeriod(tenantId, periodId);
    if (!result) {
      return NextResponse.json({ error: "Payroll period not found" }, { status: 404 });
    }

    return NextResponse.json({ data: { updatedCount: result.updatedCount } });
  } catch (error) {
    console.error("Error sending payslips:", error);
    return NextResponse.json({ error: "Failed to send payslips" }, { status: 500 });
  }
}
