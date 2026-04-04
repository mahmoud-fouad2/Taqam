/**
 * Payroll Service - API calls for payroll management
 */

import apiClient, { ApiResponse } from "./client";
import type { 
  SalaryStructure, 
  EmployeeSalary, 
  PayrollPeriod, 
  Payslip,
  Loan,
  LoanPayment,
  GOSISettings,
  PayrollReportData,
} from "@/lib/types/payroll";

export interface PayrollFilters {
  year?: number;
  month?: number | "all";
  status?: string;
  departmentId?: string;
}

export const payrollService = {
  // ============ Salary Structures ============

  /**
   * Get all salary structures
   */
  async getStructures(): Promise<ApiResponse<SalaryStructure[]>> {
    return apiClient.get<SalaryStructure[]>("/payroll/structures");
  },

  /**
   * Get salary structure by ID
   */
  async getStructure(id: string): Promise<ApiResponse<SalaryStructure>> {
    return apiClient.get<SalaryStructure>(`/payroll/structures/${id}`);
  },

  /**
   * Create salary structure
   */
  async createStructure(data: Omit<SalaryStructure, "id" | "createdAt" | "updatedAt">): Promise<ApiResponse<SalaryStructure>> {
    return apiClient.post<SalaryStructure>("/payroll/structures", data);
  },

  /**
   * Update salary structure
   */
  async updateStructure(id: string, data: Partial<SalaryStructure>): Promise<ApiResponse<SalaryStructure>> {
    return apiClient.put<SalaryStructure>(`/payroll/structures/${id}`, data);
  },

  /**
   * Delete salary structure
   */
  async deleteStructure(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/payroll/structures/${id}`);
  },

  // ============ Employee Salaries ============

  /**
   * Get employee salary info
   */
  async getEmployeeSalary(employeeId: string): Promise<ApiResponse<EmployeeSalary>> {
    return apiClient.get<EmployeeSalary>(`/employees/${employeeId}/salary`);
  },

  /**
   * Set/Update employee salary
   */
  async setEmployeeSalary(employeeId: string, data: Omit<EmployeeSalary, "id" | "employeeId" | "createdAt" | "updatedAt">): Promise<ApiResponse<EmployeeSalary>> {
    return apiClient.post<EmployeeSalary>(`/employees/${employeeId}/salary`, data);
  },

  /**
   * Get salary history for employee
   */
  async getEmployeeSalaryHistory(employeeId: string): Promise<ApiResponse<EmployeeSalary[]>> {
    return apiClient.get<EmployeeSalary[]>(`/employees/${employeeId}/salary/history`);
  },

  // ============ Payroll Periods ============

  /**
   * Get payroll periods
   */
  async getPeriods(filters?: PayrollFilters): Promise<ApiResponse<PayrollPeriod[]>> {
    return apiClient.get<PayrollPeriod[]>("/payroll/periods", { params: filters as Record<string, string | number> });
  },

  /**
   * Get payroll period by ID
   */
  async getPeriod(id: string): Promise<ApiResponse<PayrollPeriod>> {
    return apiClient.get<PayrollPeriod>(`/payroll/periods/${id}`);
  },

  /**
   * Create payroll period
   */
  async createPeriod(data: {
    name: string;
    nameAr: string;
    startDate: string;
    endDate: string;
    paymentDate: string;
  }): Promise<ApiResponse<PayrollPeriod>> {
    return apiClient.post<PayrollPeriod>("/payroll/periods", data);
  },

  /**
   * Process payroll period (calculate all salaries)
   */
  async processPeriod(id: string): Promise<ApiResponse<PayrollPeriod>> {
    return apiClient.post<PayrollPeriod>(`/payroll/periods/${id}/process`);
  },

  /**
   * Submit payroll for approval
   */
  async submitForApproval(id: string): Promise<ApiResponse<PayrollPeriod>> {
    return apiClient.post<PayrollPeriod>(`/payroll/periods/${id}/submit`);
  },

  /**
   * Approve payroll period
   */
  async approvePeriod(id: string): Promise<ApiResponse<PayrollPeriod>> {
    return apiClient.post<PayrollPeriod>(`/payroll/periods/${id}/approve`);
  },

  /**
   * Reject payroll period
   */
  async rejectPeriod(id: string, reason: string): Promise<ApiResponse<PayrollPeriod>> {
    return apiClient.post<PayrollPeriod>(`/payroll/periods/${id}/reject`, { reason });
  },

  /**
   * Mark payroll as paid
   */
  async markAsPaid(id: string, paymentDetails?: {
    paymentMethod?: string;
    reference?: string;
    notes?: string;
  }): Promise<ApiResponse<PayrollPeriod>> {
    return apiClient.post<PayrollPeriod>(`/payroll/periods/${id}/pay`, paymentDetails);
  },

  /**
   * Cancel payroll period
   */
  async cancelPeriod(id: string, reason: string): Promise<ApiResponse<PayrollPeriod>> {
    return apiClient.post<PayrollPeriod>(`/payroll/periods/${id}/cancel`, { reason });
  },

  // ============ Payslips ============

  /**
   * Get payslips for a period
   */
  async getPayslips(periodId: string): Promise<ApiResponse<Payslip[]>> {
    return apiClient.get<Payslip[]>(`/payroll/periods/${periodId}/payslips`);
  },

  /**
   * Get single payslip
   */
  async getPayslip(id: string): Promise<ApiResponse<Payslip>> {
    return apiClient.get<Payslip>(`/payroll/payslips/${id}`);
  },

  /**
   * Get employee payslips
   */
  async getEmployeePayslips(employeeId: string, filters?: PayrollFilters): Promise<ApiResponse<Payslip[]>> {
    return apiClient.get<Payslip[]>(`/employees/${employeeId}/payslips`, { params: filters as Record<string, string | number> });
  },

  /**
   * Update payslip (manual adjustments)
   */
  async updatePayslip(id: string, data: {
    earnings?: Payslip["earnings"];
    deductions?: Payslip["deductions"];
    notes?: string;
  }): Promise<ApiResponse<Payslip>> {
    return apiClient.put<Payslip>(`/payroll/payslips/${id}`, data);
  },

  /**
   * Send payslip to employee
   */
  async sendPayslip(id: string): Promise<ApiResponse<Payslip>> {
    return apiClient.post<Payslip>(`/payroll/payslips/${id}/send`);
  },

  /**
   * Send all payslips for a period
   */
  async sendAllPayslips(periodId: string): Promise<ApiResponse<{ sent: number; failed: number }>> {
    return apiClient.post(`/payroll/periods/${periodId}/send-payslips`);
  },

  /**
   * Download payslip file
   */
  async downloadPayslip(id: string): Promise<ApiResponse<Blob>> {
    return apiClient.get<Blob>(`/payroll/payslips/${id}/download`, {
      headers: { Accept: "text/html, application/octet-stream" },
    });
  },

  // ============ Loans ============

  /**
   * Get all loans
   */
  async getLoans(filters?: { employeeId?: string; status?: string }): Promise<ApiResponse<Loan[]>> {
    return apiClient.get<Loan[]>("/payroll/loans", { params: filters as Record<string, string | number> });
  },

  /**
   * Get loan by ID
   */
  async getLoan(id: string): Promise<ApiResponse<Loan>> {
    return apiClient.get<Loan>(`/payroll/loans/${id}`);
  },

  /**
   * Create loan request
   */
  async createLoan(data: Omit<Loan, "id" | "status" | "remainingAmount" | "paidInstallments" | "createdAt" | "updatedAt">): Promise<ApiResponse<Loan>> {
    return apiClient.post<Loan>("/payroll/loans", data);
  },

  /**
   * Approve loan
   */
  async approveLoan(id: string): Promise<ApiResponse<Loan>> {
    return apiClient.post<Loan>(`/payroll/loans/${id}/approve`);
  },

  /**
   * Reject loan
   */
  async rejectLoan(id: string, reason: string): Promise<ApiResponse<Loan>> {
    return apiClient.post<Loan>(`/payroll/loans/${id}/reject`, { reason });
  },

  /**
   * Get loan payments
   */
  async getLoanPayments(loanId: string): Promise<ApiResponse<LoanPayment[]>> {
    return apiClient.get<LoanPayment[]>(`/payroll/loans/${loanId}/payments`);
  },

  /**
   * Record manual loan payment
   */
  async recordLoanPayment(loanId: string, data: Omit<LoanPayment, "id" | "loanId">): Promise<ApiResponse<LoanPayment>> {
    return apiClient.post<LoanPayment>(`/payroll/loans/${loanId}/payments`, data);
  },

  // ============ GOSI Settings ============

  /**
   * Get GOSI settings
   */
  async getGOSISettings(): Promise<ApiResponse<GOSISettings>> {
    return apiClient.get<GOSISettings>("/payroll/settings/gosi");
  },

  /**
   * Update GOSI settings
   */
  async updateGOSISettings(data: Partial<GOSISettings>): Promise<ApiResponse<GOSISettings>> {
    return apiClient.put<GOSISettings>("/payroll/settings/gosi", data);
  },

  // ============ Reports ============

  /**
   * Generate payroll report
   */
  async generateReport(filters: PayrollFilters & { format?: "json" | "csv" }): Promise<ApiResponse<PayrollReportData | Blob>> {
    return apiClient.get<PayrollReportData | Blob>("/payroll/reports", {
      params: filters as Record<string, string | number>,
      headers: filters.format === "csv" ? { Accept: "text/csv" } : undefined,
    });
  },

  /**
   * Get bank file for salary transfer
   */
  async getBankFile(periodId: string, format: "wps" | "sarie" | "csv"): Promise<ApiResponse<Blob>> {
    return apiClient.get<Blob>(`/payroll/periods/${periodId}/bank-file`, {
      params: { format },
      headers: { Accept: "application/octet-stream" },
    });
  },

  /**
   * Get GOSI report
   */
  async getGOSIReport(periodId: string): Promise<ApiResponse<Blob>> {
    return apiClient.get<Blob>(`/payroll/periods/${periodId}/gosi-report`, {
      headers: { Accept: "text/csv, application/octet-stream" },
    });
  },
};

export default payrollService;
