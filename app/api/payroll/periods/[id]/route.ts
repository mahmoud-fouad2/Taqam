/**
 * Payroll Period API
 * GET /api/payroll/periods/:id
 */

import { NextRequest, NextResponse } from "next/server";
import { PayrollPeriodStatus } from "@prisma/client";
import { requireRole } from "@/lib/api/route-helper";
import {
  getPayrollPeriodStatusTransitionError,
  getPayrollPeriodById,
  mapPayrollPeriod,
  updatePayrollPeriodStatus
} from "@/lib/payroll/periods";
import { PAYROLL_ALLOWED_ROLES } from "@/lib/payroll/constants";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireRole(_request, PAYROLL_ALLOWED_ROLES);
    if (!auth.ok) return auth.response;
    const { tenantId } = auth;

    const { id } = await params;

    const period = await getPayrollPeriodById(tenantId, id);

    if (!period) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ data: mapPayrollPeriod(period) });
  } catch (error) {
    console.error("Error fetching payroll period:", error);
    return NextResponse.json({ error: "Failed to fetch payroll period" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireRole(request, PAYROLL_ALLOWED_ROLES);
    if (!auth.ok) return auth.response;
    const { tenantId } = auth;

    const { id } = await params;
    const body = await request.json();

    const statusInput = body?.status ?? body?.action;
    if (!statusInput) {
      return NextResponse.json({ error: "status is required" }, { status: 400 });
    }

    const nextStatus = String(statusInput).toUpperCase();
    const allowed: PayrollPeriodStatus[] = ["DRAFT", "APPROVED", "PAID", "CANCELLED"];
    if (!allowed.includes(nextStatus as PayrollPeriodStatus)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const nextStatusEnum = nextStatus as PayrollPeriodStatus;

    const updated = await updatePayrollPeriodStatus({
      tenantId,
      id,
      status: nextStatusEnum,
      note: body?.notes
    });

    if (!updated.ok) {
      if (updated.error === "not-found") {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      return NextResponse.json(
        { error: getPayrollPeriodStatusTransitionError(updated.currentStatus, nextStatusEnum) },
        { status: 400 }
      );
    }

    return NextResponse.json({ data: mapPayrollPeriod(updated.period) });
  } catch (error) {
    console.error("Error updating payroll period:", error);
    return NextResponse.json({ error: "Failed to update payroll period" }, { status: 500 });
  }
}
