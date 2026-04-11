/**
 * GOSI (General Organization for Social Insurance) Calculator
 * حاسبة الجهات التأمينية - نظام التأمينات الاجتماعية السعودي
 *
 * Rates as of 2024 (Saudi nationals):
 *   Employee contribution: 9.75% of basic salary + housing allowance
 *   Employer contribution: 11.75% of basic salary + housing allowance
 *     - 9% Pension (تقاعد)
 *     - 2% Hazard Coverage (أخطار مهنية)
 *     - 0.75% Labor Unemployment Insurance (التأمين ضد التعطل عن العمل)
 *
 * Non-Saudi employees:
 *   No pension; only 2% Hazard Coverage from employer
 */

import type { GOSISettings } from "@/lib/types/payroll";

export type GosiInput = {
  basicSalary: number;
  housingAllowance?: number;
  isSaudi: boolean;
  settings?: Pick<
    GOSISettings,
    "employeePercentage" | "employerPercentage" | "maxSalary" | "isEnabled"
  >;
};

export type GosiResult = {
  employeeContribution: number;
  employerContribution: number;
  total: number;
  breakdown: {
    employeePension: number;
    employeeUi: number;
    employerPension: number;
    employerHazard: number;
    employerUi: number;
  };
};

// Official GOSI rates
const GOSI_RATES = {
  // Saudi employees
  employeePension: 0.09, // 9%
  employeeUi: 0.0075, // 0.75%
  // Employer
  employerPension: 0.09, // 9%
  employerHazard: 0.02, // 2%
  employerUi: 0.0075 // 0.75%
} as const;

const DEFAULT_EMPLOYEE_TOTAL_RATE = GOSI_RATES.employeePension + GOSI_RATES.employeeUi; // 9.75%
const DEFAULT_EMPLOYER_TOTAL_RATE =
  GOSI_RATES.employerPension + GOSI_RATES.employerHazard + GOSI_RATES.employerUi; // 11.75%

function clampGosiBase(base: number, settings?: GosiInput["settings"]) {
  if (!settings) return base;
  if (settings.isEnabled === false) return 0;
  if (!Number.isFinite(settings.maxSalary) || settings.maxSalary <= 0) return base;
  return Math.min(base, settings.maxSalary);
}

export function calculateGosi(input: GosiInput): GosiResult {
  const baseRaw = input.basicSalary + (input.housingAllowance ?? 0);
  const settings = input.settings;

  if (settings?.isEnabled === false) {
    return {
      employeeContribution: 0,
      employerContribution: 0,
      total: 0,
      breakdown: {
        employeePension: 0,
        employeeUi: 0,
        employerPension: 0,
        employerHazard: 0,
        employerUi: 0
      }
    };
  }

  const base = clampGosiBase(baseRaw, settings);

  if (!input.isSaudi) {
    // Non-Saudi: only employer pays hazard coverage
    const employerHazard = round(base * GOSI_RATES.employerHazard);
    return {
      employeeContribution: 0,
      employerContribution: employerHazard,
      total: employerHazard,
      breakdown: {
        employeePension: 0,
        employeeUi: 0,
        employerPension: 0,
        employerHazard,
        employerUi: 0
      }
    };
  }

  // Saudi national
  const employeeTotalRate = settings
    ? settings.employeePercentage / 100
    : DEFAULT_EMPLOYEE_TOTAL_RATE;
  const employerTotalRate = settings
    ? settings.employerPercentage / 100
    : DEFAULT_EMPLOYER_TOTAL_RATE;

  const employeeContribution = round(base * employeeTotalRate);
  const employerContribution = round(base * employerTotalRate);

  // Provide a breakdown that always sums up to totals.
  const employeePension = round(
    employeeContribution * (GOSI_RATES.employeePension / DEFAULT_EMPLOYEE_TOTAL_RATE)
  );
  const employeeUi = round(employeeContribution - employeePension);

  const employerHazard = round(
    employerContribution * (GOSI_RATES.employerHazard / DEFAULT_EMPLOYER_TOTAL_RATE)
  );
  const employerUi = round(
    employerContribution * (GOSI_RATES.employerUi / DEFAULT_EMPLOYER_TOTAL_RATE)
  );
  const employerPension = round(employerContribution - employerHazard - employerUi);

  return {
    employeeContribution: round(employeeContribution),
    employerContribution: round(employerContribution),
    total: round(employeeContribution + employerContribution),
    breakdown: {
      employeePension,
      employeeUi,
      employerPension,
      employerHazard,
      employerUi
    }
  };
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Calculate payroll deductions including GOSI for a payslip
 */
export function calculatePayrollDeductions(params: {
  basicSalary: number;
  housingAllowance?: number;
  otherAllowances?: number;
  isSaudi: boolean;
  absenceDays?: number;
  lateDays?: number;
  workingDays?: number;
  loanDeduction?: number;
  gosiSettings?: GosiInput["settings"];
}): {
  grossSalary: number;
  gosiEmployee: number;
  absenceDeduction: number;
  lateDeduction: number;
  loanDeduction: number;
  totalDeductions: number;
  netSalary: number;
  gosiEmployer: number;
} {
  const workingDays = params.workingDays ?? 30;
  const dailySalary = params.basicSalary / workingDays;

  const grossSalary =
    params.basicSalary + (params.housingAllowance ?? 0) + (params.otherAllowances ?? 0);

  const gosi = calculateGosi({
    basicSalary: params.basicSalary,
    housingAllowance: params.housingAllowance,
    isSaudi: params.isSaudi,
    settings: params.gosiSettings
  });

  const absenceDeduction = round(dailySalary * (params.absenceDays ?? 0));
  // Late deduction: typically 1 hour per late day (varies by policy)
  const lateDeduction = round((dailySalary / 8) * (params.lateDays ?? 0));
  const loanDeduction = params.loanDeduction ?? 0;

  const totalDeductions = round(
    gosi.employeeContribution + absenceDeduction + lateDeduction + loanDeduction
  );

  const netSalary = round(grossSalary - totalDeductions);

  return {
    grossSalary: round(grossSalary),
    gosiEmployee: gosi.employeeContribution,
    absenceDeduction,
    lateDeduction,
    loanDeduction,
    totalDeductions,
    netSalary,
    gosiEmployer: gosi.employerContribution
  };
}
