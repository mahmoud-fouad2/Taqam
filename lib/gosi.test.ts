import { describe, expect, it } from "vitest";

import { calculateGosi, calculatePayrollDeductions } from "@/lib/gosi";

describe("calculateGosi", () => {
  it("calculates Saudi employee and employer contributions", () => {
    const result = calculateGosi({
      basicSalary: 8000,
      housingAllowance: 2000,
      isSaudi: true,
    });

    expect(result.employeeContribution).toBe(975);
    expect(result.employerContribution).toBe(1175);
    expect(result.total).toBe(2150);
    expect(result.breakdown.employeePension).toBe(900);
    expect(result.breakdown.employeeUi).toBe(75);
  });

  it("calculates non-Saudi employer hazard coverage only", () => {
    const result = calculateGosi({
      basicSalary: 8000,
      housingAllowance: 2000,
      isSaudi: false,
    });

    expect(result.employeeContribution).toBe(0);
    expect(result.employerContribution).toBe(200);
    expect(result.breakdown.employerHazard).toBe(200);
  });
});

describe("calculatePayrollDeductions", () => {
  it("calculates gross, deductions, and net salary with attendance penalties", () => {
    const result = calculatePayrollDeductions({
      basicSalary: 6000,
      housingAllowance: 1500,
      otherAllowances: 600,
      isSaudi: true,
      absenceDays: 1,
      lateDays: 2,
      workingDays: 30,
    });

    expect(result.grossSalary).toBe(8100);
    expect(result.gosiEmployee).toBe(731.25);
    expect(result.gosiEmployer).toBe(881.25);
    expect(result.absenceDeduction).toBe(200);
    expect(result.lateDeduction).toBe(50);
    expect(result.totalDeductions).toBe(981.25);
    expect(result.netSalary).toBe(7118.75);
  });
});