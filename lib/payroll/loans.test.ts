import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  default: {},
}));

import { mapLoan, mapLoanPayment, parseLoanStatus, parseLoanType } from "@/lib/payroll/loans";

describe("payroll loan helpers", () => {
  it("parses loan types and statuses from lowercase service values", () => {
    expect(parseLoanType("salary_advance")).toBe("SALARY_ADVANCE");
    expect(parseLoanType("emergency_loan")).toBe("EMERGENCY_LOAN");
    expect(parseLoanType("invalid")).toBeNull();

    expect(parseLoanStatus("pending")).toBe("PENDING");
    expect(parseLoanStatus("completed")).toBe("COMPLETED");
    expect(parseLoanStatus("unknown")).toBeNull();
  });

  it("maps prisma loan records to payroll service shape", () => {
    const mapped = mapLoan({
      id: "loan_1",
      employeeId: "emp_1",
      tenantId: "tenant_1",
      type: "EMERGENCY_LOAN",
      status: "APPROVED",
      amount: 5000,
      installments: 5,
      installmentAmount: 1000,
      remainingAmount: 4000,
      paidInstallments: 1,
      interestRate: 0,
      startDate: new Date("2026-01-01T00:00:00.000Z"),
      endDate: null,
      reason: "Medical emergency",
      notes: "Urgent approval",
      approvedById: "user_1",
      approvedAt: new Date("2026-01-02T00:00:00.000Z"),
      rejectedReason: null,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-03T00:00:00.000Z"),
      approvedBy: { firstName: "Alya", lastName: "Hassan" },
    });

    expect(mapped.type).toBe("emergency_loan");
    expect(mapped.status).toBe("approved");
    expect(mapped.amount).toBe(5000);
    expect(mapped.notes).toBe("Urgent approval");
    expect(mapped.approvedBy).toBe("Alya Hassan");
    expect(mapped.startDate).toBe("2026-01-01T00:00:00.000Z");
  });

  it("maps loan payments with computed installment number", () => {
    const mapped = mapLoanPayment(
      {
        id: "payment_1",
        loanId: "loan_1",
        amount: 750,
        paymentDate: new Date("2026-02-15T00:00:00.000Z"),
        paymentMethod: "bank_transfer",
        reference: "TX-100",
        notes: "Partial deduction",
        createdAt: new Date("2026-02-15T00:00:00.000Z"),
        updatedAt: new Date("2026-02-15T00:00:00.000Z"),
      },
      2
    );

    expect(mapped.installmentNumber).toBe(2);
    expect(mapped.paymentMethod).toBe("bank_transfer");
    expect(mapped.reference).toBe("TX-100");
    expect(mapped.amount).toBe(750);
  });
});