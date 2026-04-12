/**
 * Payroll Period Processing API
 * POST /api/payroll/periods/:id/process - Calculate payroll totals (MVP)
 */

import { NextRequest, NextResponse } from "next/server";
import { logApiError, requireRole } from "@/lib/api/route-helper";
import { checkRateLimit, withRateLimitHeaders } from "@/lib/rate-limit";
import { ensurePayslipsForPeriod, summarizePayrollPeriod } from "@/lib/payroll/payslips";
import {
  canTransitionPayrollPeriodStatus,
  getPayrollPeriodById,
  getPayrollPeriodStatusTransitionError,
  mapPayrollPeriod
} from "@/lib/payroll/periods";
import prisma from "@/lib/db";
import { PAYROLL_ALLOWED_ROLES } from "@/lib/payroll/constants";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const limit = 5;
    const rl = await checkRateLimit(_request, {
      keyPrefix: "api:payroll:process",
      limit,
      windowMs: 60 * 1000
    });
    if (!rl.allowed) {
      return withRateLimitHeaders(
        NextResponse.json({ error: "Too many requests" }, { status: 429 }),
        { limit, remaining: rl.remaining, resetAt: rl.resetAt }
      );
    }

    const auth = await requireRole(_request, PAYROLL_ALLOWED_ROLES);
    if (!auth.ok) return auth.response;
    const { tenantId, session } = auth;
    const userId = session.user.id;
    const { id } = await params;

    const existing = await getPayrollPeriodById(tenantId, id);

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (!canTransitionPayrollPeriodStatus(existing.status, "PENDING_APPROVAL")) {
      return NextResponse.json(
        { error: getPayrollPeriodStatusTransitionError(existing.status, "PENDING_APPROVAL") },
        { status: 400 }
      );
    }

    await ensurePayslipsForPeriod(tenantId, id);
    const summary = await summarizePayrollPeriod(tenantId, id);

    const updated = await prisma.payrollPeriod.update({
      where: { id },
      data: {
        status: "PENDING_APPROVAL",
        employeeCount: summary.employeeCount,
        totalGross: summary.totalGross,
        totalDeductions: summary.totalDeductions,
        totalNet: summary.totalNet,
        processedById: userId,
        processedAt: new Date()
      }
    });

    return NextResponse.json({ data: mapPayrollPeriod(updated) });
  } catch (error) {
    logApiError("Error processing payroll period", error);
    return NextResponse.json({ error: "Failed to process payroll period" }, { status: 500 });
  }
}
