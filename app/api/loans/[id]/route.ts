import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { logger } from "@/lib/logger";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const ALLOWED_ROLES = new Set(["SUPER_ADMIN", "TENANT_ADMIN", "HR_MANAGER"]);

interface RouteContext {
  params: Promise<{ id: string }>;
}

const loanUpdateSchema = z.object({
  status: z
    .enum(["PENDING", "APPROVED", "ACTIVE", "COMPLETED", "REJECTED", "CANCELLED"])
    .optional(),
  amount: z.number().positive().optional(),
  installments: z.number().int().positive().optional(),
  interestRate: z.number().min(0).max(100).optional(),
  startDate: z.string().optional().nullable(),
  reason: z.string().optional(),
  notes: z.string().optional(),
  rejectedReason: z.string().optional()
});

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant required" }, { status: 403 });
    }

    const { id } = await context.params;

    const loan = await prisma.loan.findFirst({
      where: { id, tenantId },
      include: {
        employee: {
          select: {
            id: true,
            employeeNumber: true,
            user: {
              select: { firstName: true, lastName: true, email: true, avatar: true }
            },
            department: { select: { name: true, nameAr: true } },
            jobTitle: { select: { name: true, nameAr: true } }
          }
        },
        approvedBy: {
          select: { firstName: true, lastName: true }
        },
        payments: {
          orderBy: { paymentDate: "desc" }
        }
      }
    });

    if (!loan) {
      return NextResponse.json({ error: "Loan not found" }, { status: 404 });
    }

    // Non-admin users can only view their own loans
    if (!ALLOWED_ROLES.has(session.user.role)) {
      const employee = await prisma.employee.findFirst({
        where: { userId: session.user.id, tenantId },
        select: { id: true }
      });
      if (!employee || employee.id !== loan.employeeId) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...loan,
        amount: Number(loan.amount),
        installmentAmount: Number(loan.installmentAmount),
        remainingAmount: Number(loan.remainingAmount),
        interestRate: Number(loan.interestRate),
        payments: loan.payments.map((p) => ({
          ...p,
          amount: Number(p.amount)
        }))
      }
    });
  } catch (error) {
    logger.error("Error fetching loan", undefined, error);
    return NextResponse.json({ error: "Failed to fetch loan" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant required" }, { status: 403 });
    }

    if (!ALLOWED_ROLES.has(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;

    const existingLoan = await prisma.loan.findFirst({
      where: { id, tenantId }
    });

    if (!existingLoan) {
      return NextResponse.json({ error: "Loan not found" }, { status: 404 });
    }

    const body = await request.json();
    const validated = loanUpdateSchema.parse(body);

    // Calculate new installment amount if amount or installments changed
    let installmentAmount = Number(existingLoan.installmentAmount);
    let remainingAmount = Number(existingLoan.remainingAmount);

    if (validated.amount || validated.installments) {
      const newAmount = validated.amount || Number(existingLoan.amount);
      const newInstallments = validated.installments || existingLoan.installments;
      installmentAmount = newAmount / newInstallments;

      // Recalculate remaining based on paid installments
      const paidAmount = existingLoan.paidInstallments * Number(existingLoan.installmentAmount);
      remainingAmount = newAmount - paidAmount;
    }

    // Handle status changes
    const updateData: any = {
      ...(validated.amount && { amount: new Prisma.Decimal(validated.amount) }),
      ...(validated.installments && { installments: validated.installments }),
      ...(validated.interestRate !== undefined && {
        interestRate: new Prisma.Decimal(validated.interestRate)
      }),
      ...(validated.startDate !== undefined && {
        startDate: validated.startDate ? new Date(validated.startDate) : null
      }),
      ...(validated.reason !== undefined && { reason: validated.reason }),
      ...(validated.notes !== undefined && { notes: validated.notes }),
      installmentAmount: new Prisma.Decimal(installmentAmount),
      remainingAmount: new Prisma.Decimal(remainingAmount)
    };

    if (validated.status) {
      updateData.status = validated.status;

      if (validated.status === "APPROVED" || validated.status === "ACTIVE") {
        updateData.approvedById = session.user.id;
        updateData.approvedAt = new Date();
      }

      if (validated.status === "REJECTED") {
        updateData.rejectedReason = validated.rejectedReason || "تم الرفض";
      }
    }

    const loan = await prisma.loan.update({
      where: { id },
      data: updateData,
      include: {
        employee: {
          select: {
            id: true,
            employeeNumber: true,
            user: {
              select: { firstName: true, lastName: true, email: true }
            }
          }
        }
      }
    });

    logger.info("Loan updated", { loanId: id, tenantId, status: validated.status });

    return NextResponse.json({
      success: true,
      data: {
        ...loan,
        amount: Number(loan.amount),
        installmentAmount: Number(loan.installmentAmount),
        remainingAmount: Number(loan.remainingAmount),
        interestRate: Number(loan.interestRate)
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    logger.error("Error updating loan", undefined, error);
    return NextResponse.json({ error: "Failed to update loan" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant required" }, { status: 403 });
    }

    if (!ALLOWED_ROLES.has(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;

    const existingLoan = await prisma.loan.findFirst({
      where: { id, tenantId }
    });

    if (!existingLoan) {
      return NextResponse.json({ error: "Loan not found" }, { status: 404 });
    }

    // Don't allow deleting active loans with payments
    if (existingLoan.status === "ACTIVE" && existingLoan.paidInstallments > 0) {
      return NextResponse.json({ error: "لا يمكن حذف قرض نشط تم سداد أقساط منه" }, { status: 400 });
    }

    await prisma.loan.delete({
      where: { id }
    });

    logger.info("Loan deleted", { loanId: id, tenantId });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error deleting loan", undefined, error);
    return NextResponse.json({ error: "Failed to delete loan" }, { status: 500 });
  }
}
