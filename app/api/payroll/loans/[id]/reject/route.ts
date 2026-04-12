import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import prisma from "@/lib/db";
import { logApiError, requireRole } from "@/lib/api/route-helper";
import { LOAN_ADMIN_ROLES, mapLoan } from "@/lib/payroll/loans";
import { notifyLoanRejected } from "@/lib/notifications/send";

const rejectLoanSchema = z.object({
  reason: z.string().min(1, "Reason is required")
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireRole(request, [...LOAN_ADMIN_ROLES]);
    if (!auth.ok) return auth.response;

    const { tenantId } = auth;
    const { id } = await params;
    const body = await request.json();
    const validated = rejectLoanSchema.parse(body);

    const existing = await prisma.loan.findFirst({
      where: { id, tenantId },
      include: { employee: { select: { userId: true } } }
    });

    if (!existing) {
      return NextResponse.json({ error: "Loan not found" }, { status: 404 });
    }

    if (existing.status === "COMPLETED" || existing.status === "ACTIVE") {
      return NextResponse.json(
        { error: "Loan cannot be rejected in its current state" },
        { status: 400 }
      );
    }

    const updated = await prisma.loan.update({
      where: { id },
      data: {
        status: "REJECTED",
        rejectedReason: validated.reason
      },
      include: {
        approvedBy: { select: { firstName: true, lastName: true } }
      }
    });

    const employeeUserId = existing.employee.userId;
    if (employeeUserId) {
      notifyLoanRejected({
        tenantId,
        employeeUserId,
        reason: validated.reason,
        loanId: id
      }).catch((error) => logApiError("Failed to send payroll loan rejection notification", error));
    }

    return NextResponse.json({ data: mapLoan(updated) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || "Invalid payload" },
        { status: 400 }
      );
    }

    logApiError("Error rejecting payroll loan", error);
    return NextResponse.json({ error: "Failed to reject payroll loan" }, { status: 500 });
  }
}
