import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { logger } from "@/lib/logger";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { parseLoanStatus, resolveLoanEmployeeScope } from "@/lib/payroll/loans";

const ALLOWED_ROLES = new Set(["SUPER_ADMIN", "TENANT_ADMIN", "HR_MANAGER"]);

const loanCreateSchema = z.object({
  employeeId: z.string().min(1, "الموظف مطلوب"),
  type: z.enum([
    "SALARY_ADVANCE",
    "PERSONAL_LOAN",
    "EMERGENCY_LOAN",
    "HOUSING_LOAN",
    "CAR_LOAN",
    "OTHER"
  ]),
  amount: z.number().positive("المبلغ يجب أن يكون موجب"),
  installments: z.number().int().positive("عدد الأقساط يجب أن يكون موجب"),
  interestRate: z.number().min(0).max(100).optional().default(0),
  startDate: z.string().optional(),
  reason: z.string().optional(),
  notes: z.string().optional()
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const employeeId = searchParams.get("employeeId");
    const page = Math.max(parseInt(searchParams.get("page") || "1"), 1);
    const pageSize = Math.min(Math.max(parseInt(searchParams.get("pageSize") || "20"), 1), 100);

    const where: any = { tenantId };

    // Non-admin users can only see their own loans
    if (!ALLOWED_ROLES.has(session.user.role)) {
      const employee = await prisma.employee.findFirst({
        where: { userId: session.user.id, tenantId },
        select: { id: true }
      });
      if (!employee) {
        return NextResponse.json({ error: "Employee not found" }, { status: 404 });
      }
      where.employeeId = employee.id;
    } else if (employeeId) {
      where.employeeId = employeeId;
    }

    if (status && status !== "all") {
      where.status = parseLoanStatus(status) ?? status;
    }

    const [total, loans] = await Promise.all([
      prisma.loan.count({ where }),
      prisma.loan.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          employee: {
            select: {
              id: true,
              employeeNumber: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                  avatar: true
                }
              }
            }
          },
          approvedBy: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      })
    ]);

    // Calculate stats
    const stats = await prisma.loan.groupBy({
      by: ["status"],
      where: { tenantId },
      _count: { id: true },
      _sum: { remainingAmount: true }
    });

    const statsMap = {
      total: 0,
      pending: 0,
      active: 0,
      completed: 0,
      totalActiveAmount: 0
    };

    for (const s of stats) {
      statsMap.total += s._count.id;
      if (s.status === "PENDING") statsMap.pending = s._count.id;
      if (s.status === "ACTIVE") {
        statsMap.active = s._count.id;
        statsMap.totalActiveAmount = Number(s._sum.remainingAmount || 0);
      }
      if (s.status === "COMPLETED") statsMap.completed = s._count.id;
    }

    return NextResponse.json({
      success: true,
      data: {
        loans: loans.map((loan) => ({
          ...loan,
          amount: Number(loan.amount),
          installmentAmount: Number(loan.installmentAmount),
          remainingAmount: Number(loan.remainingAmount),
          interestRate: Number(loan.interestRate)
        })),
        stats: statsMap
      },
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    logger.error("Error fetching loans", undefined, error);
    return NextResponse.json({ error: "Failed to fetch loans" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant required" }, { status: 403 });
    }

    const body = await request.json();

    const employeeScope = await resolveLoanEmployeeScope({
      tenantId,
      userId: session.user.id,
      role: session.user.role,
      requestedEmployeeId: body?.employeeId
    });

    if (!("employeeId" in employeeScope)) {
      return NextResponse.json(
        { error: employeeScope.error.message },
        { status: employeeScope.error.status }
      );
    }

    const validated = loanCreateSchema.parse(body);

    // Check if employee exists in tenant
    const employee = await prisma.employee.findFirst({
      where: { id: employeeScope.employeeId || validated.employeeId, tenantId }
    });

    if (!employee) {
      return NextResponse.json({ error: "الموظف غير موجود" }, { status: 404 });
    }

    const installmentAmount = validated.amount / validated.installments;

    const loan = await prisma.loan.create({
      data: {
        tenantId,
        employeeId: employeeScope.employeeId || validated.employeeId,
        type: validated.type,
        status: "PENDING",
        amount: new Prisma.Decimal(validated.amount),
        installments: validated.installments,
        installmentAmount: new Prisma.Decimal(installmentAmount),
        remainingAmount: new Prisma.Decimal(validated.amount),
        paidInstallments: 0,
        interestRate: new Prisma.Decimal(validated.interestRate || 0),
        startDate: validated.startDate ? new Date(validated.startDate) : null,
        reason: validated.reason,
        notes: validated.notes
      },
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

    logger.info("Loan created", {
      loanId: loan.id,
      tenantId,
      employeeId: employeeScope.employeeId || validated.employeeId
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          ...loan,
          amount: Number(loan.amount),
          installmentAmount: Number(loan.installmentAmount),
          remainingAmount: Number(loan.remainingAmount),
          interestRate: Number(loan.interestRate)
        }
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    logger.error("Error creating loan", undefined, error);
    return NextResponse.json({ error: "Failed to create loan" }, { status: 500 });
  }
}
