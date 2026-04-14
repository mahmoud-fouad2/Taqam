import { describe, expect, it } from "vitest";

import {
  buildBankFileExport,
  buildGosiReportExport,
  getBankFileMissingAccountNumbers,
  resolveBankFileFormat
} from "@/lib/payroll/compliance-exports";
import type { Payslip } from "@/lib/types/payroll";

const payslips: Payslip[] = [
  {
    id: "pay_1",
    payrollPeriodId: "period_1",
    periodName: "April 2026",
    paymentDate: "2026-04-30",
    employeeId: "emp_1",
    employeeName: "Ahmed Ali",
    employeeNameAr: "أحمد علي",
    employeeNumber: "E-100",
    department: "Finance",
    departmentAr: "المالية",
    jobTitle: "Accountant",
    jobTitleAr: "محاسب",
    currency: "SAR",
    basicSalary: 8000,
    earnings: [],
    totalEarnings: 10000,
    deductions: [],
    totalDeductions: 1500,
    netSalary: 8500,
    workingDays: 22,
    actualWorkDays: 22,
    absentDays: 0,
    lateDays: 0,
    overtimeHours: 0,
    gosiEmployee: 780,
    gosiEmployer: 940,
    status: "generated",
    paymentMethod: "bank_transfer",
    bankName: "SNB",
    accountNumber: "1234567890",
    createdAt: "2026-04-01T00:00:00.000Z",
    updatedAt: "2026-04-01T00:00:00.000Z"
  }
];

describe("payroll compliance exports", () => {
  it("builds the GOSI report export", () => {
    const result = buildGosiReportExport({
      period: { id: "period_1", name: "April 2026" },
      payslips
    });

    expect(result.fileName).toBe("gosi-report-april-2026.csv");
    expect(result.rowCount).toBe(1);
    expect(result.csv).toContain("Ahmed Ali");
    expect(result.csv).toContain("1720");
  });

  it("builds the WPS bank file export", () => {
    const result = buildBankFileExport({
      period: {
        id: "period_1",
        name: "April 2026",
        paymentDate: new Date("2026-04-30T00:00:00.000Z")
      },
      payslips,
      format: "wps"
    });

    expect(result.fileName).toBe("bank-file-april-2026-wps.csv");
    expect(result.csv).toContain("1234567890");
    expect(result.csv).toContain("2026-04-30");
  });

  it("reports missing account numbers for bank-transfer payslips", () => {
    expect(
      getBankFileMissingAccountNumbers([
        ...payslips,
        {
          ...payslips[0],
          id: "pay_2",
          employeeId: "emp_2",
          employeeNumber: "E-101",
          accountNumber: ""
        }
      ])
    ).toEqual(["E-101"]);
  });

  it("falls back to csv for unsupported bank file formats", () => {
    expect(resolveBankFileFormat("unexpected")).toBe("csv");
  });
});