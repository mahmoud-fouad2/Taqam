import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/db";
import { requireRole } from "@/lib/api/route-helper";
import { LOAN_ADMIN_ROLES, mapLoan } from "@/lib/payroll/loans";
import { notifyLoanApproved } from "@/lib/notifications/send";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireRole(request, [...LOAN_ADMIN_ROLES]);
    if (!auth.ok) return auth.response;

    const { tenantId, session } = auth;
    const { id } = await params;

    const existing = await prisma.loan.findFirst({
      where: { id, tenantId },
      include: { employee: { select: { userId: true } } },
    });

    if (!existing) {
      return NextResponse.json({ error: "Loan not found" }, { status: 404 });
    }

    if (existing.status === "REJECTED" || existing.status === "CANCELLED" || existing.status === "COMPLETED") {
      return NextResponse.json({ error: "Loan cannot be approved in its current state" }, { status: 400 });
    }

    const updated = await prisma.loan.update({
      where: { id },
      data: {
        status: "APPROVED",
        approvedById: session.user.id,
        approvedAt: new Date(),
      },
      include: {
        approvedBy: { select: { firstName: true, lastName: true } },
      },
    });

    const employeeUserId = existing.employee.userId;
    if (employeeUserId) {
      notifyLoanApproved({
        tenantId,
        employeeUserId,
        amount: Number(existing.amount),
        loanId: id,
      }).catch(console.error);
    }

    return NextResponse.json({ data: mapLoan(updated) });
  } catch (error) {
    console.error("Error approving payroll loan:", error);
    return NextResponse.json({ error: "Failed to approve payroll loan" }, { status: 500 });
  }
}