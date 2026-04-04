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

export type GosiInput = {
  basicSalary: number;
  housingAllowance?: number;
  isSaudi: boolean;
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
  employerUi: 0.0075, // 0.75%
} as const;

export function calculateGosi(input: GosiInput): GosiResult {
  const base = input.basicSalary + (input.housingAllowance ?? 0);

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
        employerUi: 0,
      },
    };
  }

  // Saudi national
  const employeePension = round(base * GOSI_RATES.employeePension);
  const employeeUi = round(base * GOSI_RATES.employeeUi);
  const employerPension = round(base * GOSI_RATES.employerPension);
  const employerHazard = round(base * GOSI_RATES.employerHazard);
  const employerUi = round(base * GOSI_RATES.employerUi);

  const employeeContribution = employeePension + employeeUi;
  const employerContribution = employerPension + employerHazard + employerUi;

  return {
    employeeContribution: round(employeeContribution),
    employerContribution: round(employerContribution),
    total: round(employeeContribution + employerContribution),
    breakdown: {
      employeePension,
      employeeUi,
      employerPension,
      employerHazard,
      employerUi,
    },
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
    params.basicSalary +
    (params.housingAllowance ?? 0) +
    (params.otherAllowances ?? 0);

  const gosi = calculateGosi({
    basicSalary: params.basicSalary,
    housingAllowance: params.housingAllowance,
    isSaudi: params.isSaudi,
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
    gosiEmployer: gosi.employerContribution,
  };
}
