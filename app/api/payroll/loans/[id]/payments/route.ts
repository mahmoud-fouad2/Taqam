import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import prisma from "@/lib/db";
import { requireRole, requireTenantSession } from "@/lib/api/route-helper";
import { getScopedLoan, LOAN_ADMIN_ROLES, mapLoanPayment } from "@/lib/payroll/loans";

const createPaymentSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  paymentDate: z.string().optional(),
  paymentMethod: z.string().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireTenantSession(request);
    if (!auth.ok) return auth.response;

    const { tenantId, session } = auth;
    const { id } = await params;
    const result = await getScopedLoan({
      tenantId,
      loanId: id,
      userId: session.user.id,
      role: session.user.role,
      includePayments: true,
    });

    if (!("loan" in result)) {
      return NextResponse.json({ error: result.error.message }, { status: result.error.status });
    }

    if (!result.loan) {
      return NextResponse.json({ error: "Loan not found" }, { status: 404 });
    }

    return NextResponse.json({
      data: result.loan.payments.map((payment, index) => mapLoanPayment(payment, index + 1)),
    });
  } catch (error) {
    console.error("Error fetching payroll loan payments:", error);
    return NextResponse.json({ error: "Failed to fetch payroll loan payments" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireRole(request, [...LOAN_ADMIN_ROLES]);
    if (!auth.ok) return auth.response;

    const { tenantId } = auth;
    const { id } = await params;
    const body = await request.json();
    const validated = createPaymentSchema.parse(body);

    const existing = await prisma.loan.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        status: true,
        paidInstallments: true,
        remainingAmount: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Loan not found" }, { status: 404 });
    }

    if (["REJECTED", "CANCELLED", "COMPLETED"].includes(existing.status)) {
      return NextResponse.json({ error: "Loan cannot accept payments in its current state" }, { status: 400 });
    }

    const remainingAmount = Number(existing.remainingAmount);
    if (validated.amount > remainingAmount) {
      return NextResponse.json({ error: "Payment amount exceeds remaining balance" }, { status: 400 });
    }

    const paymentDate = validated.paymentDate ? new Date(validated.paymentDate) : new Date();
    const nextInstallmentNumber = existing.paidInstallments + 1;
    const nextRemainingAmount = Math.max(0, remainingAmount - validated.amount);
    const nextStatus = nextRemainingAmount === 0
      ? "COMPLETED"
      : existing.status === "APPROVED"
        ? "ACTIVE"
        : existing.status;

    const payment = await prisma.$transaction(async (tx) => {
      const created = await tx.loanPayment.create({
        data: {
          loanId: id,
          amount: new Prisma.Decimal(validated.amount),
          paymentDate,
          paymentMethod: validated.paymentMethod,
          reference: validated.reference,
          notes: validated.notes,
        },
      });

      await tx.loan.update({
        where: { id },
        data: {
          paidInstallments: nextInstallmentNumber,
          remainingAmount: new Prisma.Decimal(nextRemainingAmount),
          status: nextStatus,
          ...(nextStatus === "COMPLETED" ? { endDate: paymentDate } : {}),
        },
      });

      return created;
    });

    return NextResponse.json({ data: mapLoanPayment(payment, nextInstallmentNumber) }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message || "Invalid payload" }, { status: 400 });
    }

    console.error("Error recording payroll loan payment:", error);
    return NextResponse.json({ error: "Failed to record payroll loan payment" }, { status: 500 });
  }
}