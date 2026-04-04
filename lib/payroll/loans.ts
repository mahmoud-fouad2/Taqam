import { LoanStatus as PrismaLoanStatus, LoanType as PrismaLoanType, type Prisma } from "@prisma/client";

import prisma from "@/lib/db";
import type { Loan, LoanPayment } from "@/lib/types/payroll";

export const LOAN_ADMIN_ROLES = ["SUPER_ADMIN", "TENANT_ADMIN", "HR_MANAGER"] as const;

type LoanRecord = {
  id: string;
  employeeId: string;
  tenantId: string;
  type: PrismaLoanType;
  status: PrismaLoanStatus;
  amount: Prisma.Decimal | number;
  installments: number;
  installmentAmount: Prisma.Decimal | number;
  remainingAmount: Prisma.Decimal | number;
  paidInstallments: number;
  interestRate: Prisma.Decimal | number;
  startDate: Date | null;
  endDate: Date | null;
  reason: string | null;
  notes: string | null;
  approvedById: string | null;
  approvedAt: Date | null;
  rejectedReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  approvedBy?: { firstName: string; lastName: string } | null;
};

type LoanPaymentRecord = {
  id: string;
  loanId: string;
  amount: Prisma.Decimal | number;
  paymentDate: Date;
  paymentMethod: string | null;
  reference: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export function isLoanAdminRole(role: string) {
  return LOAN_ADMIN_ROLES.includes(role as (typeof LOAN_ADMIN_ROLES)[number]);
}

export function parseLoanType(value: string | null | undefined): PrismaLoanType | null {
  switch ((value || "").trim().toLowerCase()) {
    case "salary_advance":
      return "SALARY_ADVANCE";
    case "personal_loan":
      return "PERSONAL_LOAN";
    case "emergency_loan":
      return "EMERGENCY_LOAN";
    case "housing_loan":
      return "HOUSING_LOAN";
    case "car_loan":
      return "CAR_LOAN";
    case "other":
      return "OTHER";
    default:
      return null;
  }
}

export function parseLoanStatus(value: string | null | undefined): PrismaLoanStatus | null {
  switch ((value || "").trim().toLowerCase()) {
    case "pending":
      return "PENDING";
    case "approved":
      return "APPROVED";
    case "active":
      return "ACTIVE";
    case "completed":
      return "COMPLETED";
    case "rejected":
      return "REJECTED";
    case "cancelled":
      return "CANCELLED";
    default:
      return null;
  }
}

export function mapLoanType(value: PrismaLoanType): Loan["type"] {
  switch (value) {
    case "SALARY_ADVANCE":
      return "salary_advance";
    case "PERSONAL_LOAN":
      return "personal_loan";
    case "EMERGENCY_LOAN":
      return "emergency_loan";
    case "HOUSING_LOAN":
      return "housing_loan";
    case "CAR_LOAN":
      return "car_loan";
    case "OTHER":
    default:
      return "other";
  }
}

export function mapLoanStatus(value: PrismaLoanStatus): Loan["status"] {
  switch (value) {
    case "PENDING":
      return "pending";
    case "APPROVED":
      return "approved";
    case "ACTIVE":
      return "active";
    case "COMPLETED":
      return "completed";
    case "REJECTED":
      return "rejected";
    case "CANCELLED":
    default:
      return "cancelled";
  }
}

export function mapLoan(record: LoanRecord): Loan {
  return {
    id: record.id,
    employeeId: record.employeeId,
    tenantId: record.tenantId,
    type: mapLoanType(record.type),
    amount: Number(record.amount),
    installments: record.installments,
    installmentAmount: Number(record.installmentAmount),
    remainingAmount: Number(record.remainingAmount),
    paidInstallments: record.paidInstallments,
    interestRate: Number(record.interestRate),
    startDate: record.startDate?.toISOString(),
    endDate: record.endDate?.toISOString(),
    status: mapLoanStatus(record.status),
    reason: record.reason ?? undefined,
    notes: record.notes ?? undefined,
    approvedBy: record.approvedBy
      ? `${record.approvedBy.firstName} ${record.approvedBy.lastName}`.trim()
      : record.approvedById ?? undefined,
    approvedAt: record.approvedAt?.toISOString(),
    rejectedReason: record.rejectedReason ?? undefined,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export function mapLoanPayment(record: LoanPaymentRecord, installmentNumber: number): LoanPayment {
  return {
    id: record.id,
    loanId: record.loanId,
    payrollPeriodId: undefined,
    amount: Number(record.amount),
    paymentDate: record.paymentDate.toISOString(),
    installmentNumber,
    notes: record.notes ?? undefined,
    paymentMethod: record.paymentMethod ?? undefined,
    reference: record.reference ?? undefined,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function resolveLoanEmployeeScope(input: {
  tenantId: string;
  userId: string;
  role: string;
  requestedEmployeeId?: string;
}) {
  const { tenantId, userId, role, requestedEmployeeId } = input;

  if (isLoanAdminRole(role)) {
    if (!requestedEmployeeId) {
      return { employeeId: undefined as string | undefined };
    }

    const employee = await prisma.employee.findFirst({
      where: { id: requestedEmployeeId, tenantId },
      select: { id: true },
    });

    if (!employee) {
      return { error: { message: "Employee not found", status: 404 as const } };
    }

    return { employeeId: employee.id };
  }

  const employee = await prisma.employee.findFirst({
    where: { userId, tenantId },
    select: { id: true },
  });

  if (!employee) {
    return { error: { message: "Employee not found", status: 404 as const } };
  }

  if (requestedEmployeeId && requestedEmployeeId !== employee.id) {
    return { error: { message: "Forbidden", status: 403 as const } };
  }

  return { employeeId: employee.id };
}

export async function getScopedLoan(input: {
  tenantId: string;
  loanId: string;
  userId: string;
  role: string;
  includePayments?: boolean;
}) {
  const loan = await prisma.loan.findFirst({
    where: { id: input.loanId, tenantId: input.tenantId },
    include: {
      approvedBy: {
        select: { firstName: true, lastName: true },
      },
      employee: {
        select: {
          userId: true,
        },
      },
      payments: input.includePayments
        ? {
            orderBy: [{ paymentDate: "asc" }, { createdAt: "asc" }],
          }
        : false,
    },
  });

  if (!loan) {
    return { error: { message: "Loan not found", status: 404 as const } };
  }

  if (!isLoanAdminRole(input.role) && loan.employee.userId !== input.userId) {
    return { error: { message: "Access denied", status: 403 as const } };
  }

  return { loan };
}