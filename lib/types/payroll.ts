/**
 * Payroll Types - نظام الرواتب والمسيرات
 */

// ============ Salary Structure ============

export type SalaryComponent = "basic" | "housing" | "transport" | "food" | "phone" | "other";
export type DeductionType = "gosi" | "tax" | "loan" | "absence" | "penalty" | "other";
export type AllowanceType = "overtime" | "bonus" | "commission" | "incentive" | "travel" | "other";

export interface SalaryStructure {
  id: string;
  name: string;
  nameAr: string;
  description?: string;
  tenantId: string;
  isDefault: boolean;
  isActive: boolean;
  components: SalaryComponentItem[];
  createdAt: string;
  updatedAt: string;
}

export interface SalaryComponentItem {
  id: string;
  type: SalaryComponent;
  name: string;
  nameAr: string;
  isPercentage: boolean;
  value: number; // if percentage, value of basic salary; otherwise fixed amount
  isTaxable: boolean;
  isGOSIApplicable: boolean;
}

// ============ Employee Salary ============

export interface EmployeeSalary {
  id: string;
  employeeId: string;
  structureId?: string;
  basicSalary: number;
  components: EmployeeSalaryComponent[];
  effectiveDate: string;
  endDate?: string;
  bankName?: string;
  bankAccountNumber?: string;
  iban?: string;
  swiftCode?: string;
  paymentMethod: "bank_transfer" | "cash" | "check";
  currency: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeSalaryComponent {
  componentId: string;
  type: SalaryComponent | AllowanceType;
  name: string;
  nameAr: string;
  amount: number;
  isFixed: boolean;
}

// ============ Payroll Period ============

export type PayrollPeriodStatus = "draft" | "processing" | "pending_approval" | "approved" | "paid" | "cancelled";

export interface PayrollPeriod {
  id: string;
  tenantId: string;
  name: string;
  nameAr: string;
  startDate: string;
  endDate: string;
  paymentDate: string;
  status: PayrollPeriodStatus;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  employeeCount: number;
  processedBy?: string;
  processedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  paidBy?: string;
  paidAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ============ Payslip ============

export type PayslipStatus = "draft" | "generated" | "sent" | "viewed";

export interface Payslip {
  id: string;
  payrollPeriodId: string;
  periodName?: string;
  periodNameAr?: string;
  periodStartDate?: string;
  periodEndDate?: string;
  paymentDate?: string;
  employeeId: string;
  employeeName: string;
  employeeNameAr: string;
  employeeNumber: string;
  departmentId?: string;
  department: string;
  departmentAr: string;
  jobTitle: string;
  jobTitleAr: string;
  currency: string;
  
  // Earnings
  basicSalary: number;
  earnings: PayslipEarning[];
  totalEarnings: number;
  
  // Deductions
  deductions: PayslipDeduction[];
  totalDeductions: number;
  
  // Net
  netSalary: number;
  
  // Attendance Info
  workingDays: number;
  actualWorkDays: number;
  absentDays: number;
  lateDays: number;
  overtimeHours: number;
  
  // GOSI
  gosiEmployee: number;
  gosiEmployer: number;
  
  // Status
  status: PayslipStatus;
  sentAt?: string;
  viewedAt?: string;
  
  // Payment
  paymentMethod: string;
  bankName?: string;
  accountNumber?: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface PayslipEarning {
  type: SalaryComponent | AllowanceType;
  name: string;
  nameAr: string;
  amount: number;
  notes?: string;
}

export interface PayslipDeduction {
  type: DeductionType;
  name: string;
  nameAr: string;
  amount: number;
  notes?: string;
}

// ============ Loan ============

export type LoanStatus = "pending" | "approved" | "active" | "completed" | "rejected" | "cancelled";

export interface Loan {
  id: string;
  employeeId: string;
  tenantId: string;
  type: "salary_advance" | "personal_loan" | "emergency_loan" | "housing_loan" | "car_loan" | "other";
  amount: number;
  installments: number;
  installmentAmount: number;
  remainingAmount: number;
  paidInstallments: number;
  interestRate: number;
  startDate?: string;
  endDate?: string;
  status: LoanStatus;
  reason?: string;
  notes?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoanPayment {
  id: string;
  loanId: string;
  payrollPeriodId?: string;
  amount: number;
  paymentDate: string;
  installmentNumber: number;
  notes?: string;
  paymentMethod?: string;
  reference?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ============ GOSI Settings ============

export interface GOSISettings {
  tenantId: string;
  employeePercentage: number; // عادة 9.75%
  employerPercentage: number; // عادة 11.75%
  maxSalary: number; // الحد الأقصى للراتب الخاضع للتأمينات
  isEnabled: boolean;
}

export interface PayrollDepartmentStat {
  id: string;
  name: string;
  employeeCount: number;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  avgSalary: number;
  gosiBase: number;
  gosiEmployee: number;
  gosiEmployer: number;
}

export interface PayrollMonthlyTrendItem {
  month: string;
  totalGross: number;
  totalNet: number;
  employeeCount: number;
}

export interface PayrollReportData {
  departmentStats: PayrollDepartmentStat[];
  monthlyTrend: PayrollMonthlyTrendItem[];
}

// ============ Tax Settings ============

export interface TaxSettings {
  tenantId: string;
  isEnabled: boolean;
  brackets: TaxBracket[];
}

export interface TaxBracket {
  minSalary: number;
  maxSalary: number;
  percentage: number;
}

// ============ Labels ============

export const salaryComponentLabels: Record<SalaryComponent, { en: string; ar: string }> = {
  basic: { en: "Basic Salary", ar: "الراتب الأساسي" },
  housing: { en: "Housing Allowance", ar: "بدل السكن" },
  transport: { en: "Transport Allowance", ar: "بدل المواصلات" },
  food: { en: "Food Allowance", ar: "بدل الطعام" },
  phone: { en: "Phone Allowance", ar: "بدل الهاتف" },
  other: { en: "Other", ar: "أخرى" },
};

export const deductionTypeLabels: Record<DeductionType, { en: string; ar: string }> = {
  gosi: { en: "GOSI", ar: "التأمينات الاجتماعية" },
  tax: { en: "Tax", ar: "الضريبة" },
  loan: { en: "Loan Deduction", ar: "خصم القرض" },
  absence: { en: "Absence Deduction", ar: "خصم الغياب" },
  penalty: { en: "Penalty", ar: "جزاء" },
  other: { en: "Other", ar: "أخرى" },
};

export const allowanceTypeLabels: Record<AllowanceType, { en: string; ar: string }> = {
  overtime: { en: "Overtime", ar: "العمل الإضافي" },
  bonus: { en: "Bonus", ar: "مكافأة" },
  commission: { en: "Commission", ar: "عمولة" },
  incentive: { en: "Incentive", ar: "حافز" },
  travel: { en: "Travel Allowance", ar: "بدل سفر" },
  other: { en: "Other", ar: "أخرى" },
};

export const payrollPeriodStatusLabels: Record<PayrollPeriodStatus, { en: string; ar: string; color: string }> = {
  draft: { en: "Draft", ar: "مسودة", color: "gray" },
  processing: { en: "Processing", ar: "قيد المعالجة", color: "blue" },
  pending_approval: { en: "Pending Approval", ar: "بانتظار الموافقة", color: "yellow" },
  approved: { en: "Approved", ar: "معتمد", color: "green" },
  paid: { en: "Paid", ar: "مدفوع", color: "emerald" },
  cancelled: { en: "Cancelled", ar: "ملغي", color: "red" },
};

export const loanStatusLabels: Record<LoanStatus, { en: string; ar: string; color: string }> = {
  pending: { en: "Pending", ar: "بانتظار الموافقة", color: "yellow" },
  approved: { en: "Approved", ar: "موافق عليه", color: "blue" },
  active: { en: "Active", ar: "نشط", color: "green" },
  completed: { en: "Completed", ar: "مكتمل", color: "gray" },
  rejected: { en: "Rejected", ar: "مرفوض", color: "red" },
  cancelled: { en: "Cancelled", ar: "ملغي", color: "gray" },
};

export const loanTypeLabels: Record<Loan["type"], { en: string; ar: string }> = {
  salary_advance: { en: "Salary Advance", ar: "سلفة راتب" },
  personal_loan: { en: "Personal Loan", ar: "قرض شخصي" },
  emergency_loan: { en: "Emergency Loan", ar: "قرض طارئ" },
  housing_loan: { en: "Housing Loan", ar: "قرض سكني" },
  car_loan: { en: "Car Loan", ar: "قرض سيارة" },
  other: { en: "Other", ar: "أخرى" },
};



// ============ Helpers ============

export function formatCurrency(amount: number, currency: string = "SAR"): string {
  return new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function calculateGOSI(
  basicSalary: number,
  housingAllowance: number,
  settings: GOSISettings
): { employee: number; employer: number } {
  if (!settings.isEnabled) return { employee: 0, employer: 0 };
  
  const gosiBase = Math.min(basicSalary + housingAllowance, settings.maxSalary);
  
  return {
    employee: (gosiBase * settings.employeePercentage) / 100,
    employer: (gosiBase * settings.employerPercentage) / 100,
  };
}

export function calculateTotalSalary(
  basicSalary: number,
  components: SalaryComponentItem[]
): number {
  let total = basicSalary;
  
  for (const component of components) {
    if (component.type === "basic") continue;
    
    if (component.isPercentage) {
      total += (basicSalary * component.value) / 100;
    } else {
      total += component.value;
    }
  }
  
  return total;
}

export function getMonthName(month: number, locale: "ar" | "en" = "ar"): string {
  const date = new Date(2024, month - 1, 1);
  return date.toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", { month: "long" });
}
