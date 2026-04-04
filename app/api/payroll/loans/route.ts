import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import prisma from "@/lib/db";
import { parsePagination, requireTenantSession } from "@/lib/api/route-helper";
import { mapLoan, parseLoanStatus, parseLoanType, resolveLoanEmployeeScope } from "@/lib/payroll/loans";

const createLoanSchema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  type: z.string().min(1, "Loan type is required"),
  amount: z.number().positive("Amount must be positive"),
  installments: z.number().int().positive("Installments must be positive"),
  interestRate: z.number().min(0).max(100).optional().default(0),
  startDate: z.string().optional().nullable(),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await requireTenantSession(request);
    if (!auth.ok) return auth.response;

    const { tenantId, session } = auth;
    const { searchParams } = new URL(request.url);
    const requestedEmployeeId = searchParams.get("employeeId") || undefined;
    const statusRaw = searchParams.get("status") || undefined;
    const { page, limit, skip } = parsePagination(searchParams);

    const employeeScope = await resolveLoanEmployeeScope({
      tenantId,
      userId: session.user.id,
      role: session.user.role,
      requestedEmployeeId,
    });

    if (!("employeeId" in employeeScope)) {
      return NextResponse.json({ error: employeeScope.error.message }, { status: employeeScope.error.status });
    }

    const parsedStatus = statusRaw && statusRaw !== "all" ? parseLoanStatus(statusRaw) : null;
    if (statusRaw && statusRaw !== "all" && !parsedStatus) {
      return NextResponse.json({ error: "Invalid loan status" }, { status: 400 });
    }

    const where: any = {
      tenantId,
      ...(employeeScope.employeeId ? { employeeId: employeeScope.employeeId } : {}),
      ...(parsedStatus ? { status: parsedStatus } : {}),
    };

    const [total, loans] = await Promise.all([
      prisma.loan.count({ where }),
      prisma.loan.findMany({
        where,
        include: {
          approvedBy: {
            select: { firstName: true, lastName: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      data: loans.map(mapLoan),
      meta: {
        page,
        pageSize: limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching payroll loans:", error);
    return NextResponse.json({ error: "Failed to fetch payroll loans" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireTenantSession(request);
    if (!auth.ok) return auth.response;

    const { tenantId, session } = auth;
    const body = await request.json();
    const validated = createLoanSchema.parse(body);
    const loanType = parseLoanType(validated.type);

    if (!loanType) {
      return NextResponse.json({ error: "Invalid loan type" }, { status: 400 });
    }

    const employeeScope = await resolveLoanEmployeeScope({
      tenantId,
      userId: session.user.id,
      role: session.user.role,
      requestedEmployeeId: validated.employeeId,
    });

    if (!("employeeId" in employeeScope)) {
      return NextResponse.json({ error: employeeScope.error.message }, { status: employeeScope.error.status });
    }

    const loan = await prisma.loan.create({
      data: {
        tenantId,
        employeeId: employeeScope.employeeId || validated.employeeId,
        type: loanType,
        status: "PENDING",
        amount: new Prisma.Decimal(validated.amount),
        installments: validated.installments,
        installmentAmount: new Prisma.Decimal(validated.amount / validated.installments),
        remainingAmount: new Prisma.Decimal(validated.amount),
        paidInstallments: 0,
        interestRate: new Prisma.Decimal(validated.interestRate || 0),
        startDate: validated.startDate ? new Date(validated.startDate) : null,
        reason: validated.reason,
        notes: validated.notes,
      },
      include: {
        approvedBy: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    return NextResponse.json({ data: mapLoan(loan) }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message || "Invalid payload" }, { status: 400 });
    }

    console.error("Error creating payroll loan:", error);
    return NextResponse.json({ error: "Failed to create payroll loan" }, { status: 500 });
  }
}