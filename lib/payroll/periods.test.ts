import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  default: {}
}));

import {
  canTransitionPayrollPeriodStatus,
  getPayrollPeriodStatusTransitionError
} from "@/lib/payroll/periods";

describe("payroll period status transitions", () => {
  it("allows the lifecycle transitions used by the dashboard", () => {
    expect(canTransitionPayrollPeriodStatus("DRAFT", "PENDING_APPROVAL")).toBe(true);
    expect(canTransitionPayrollPeriodStatus("PENDING_APPROVAL", "APPROVED")).toBe(true);
    expect(canTransitionPayrollPeriodStatus("PENDING_APPROVAL", "DRAFT")).toBe(true);
    expect(canTransitionPayrollPeriodStatus("APPROVED", "PAID")).toBe(true);
    expect(canTransitionPayrollPeriodStatus("DRAFT", "CANCELLED")).toBe(true);
  });

  it("rejects invalid terminal or skipped transitions", () => {
    expect(canTransitionPayrollPeriodStatus("DRAFT", "PAID")).toBe(false);
    expect(canTransitionPayrollPeriodStatus("PAID", "APPROVED")).toBe(false);
    expect(canTransitionPayrollPeriodStatus("CANCELLED", "DRAFT")).toBe(false);
  });

  it("returns a readable error message for invalid transitions", () => {
    expect(getPayrollPeriodStatusTransitionError("PAID", "APPROVED")).toBe(
      "Cannot change payroll period status from paid to approved."
    );
  });
});
