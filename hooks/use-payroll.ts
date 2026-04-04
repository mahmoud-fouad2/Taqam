/**
 * Payroll Data Hook - Centralized payroll management
 */

"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import type { Payslip, PayslipStatus, PayrollPeriodStatus, SalaryStructure } from "@/lib/types/payroll";
import { payrollService } from "@/lib/api";

interface PayrollRun {
  id: string;
  month: string;
  year: number;
  status: PayrollPeriodStatus;
  totalAmount: number;
  employeeCount: number;
  createdAt: string;
  startDate: string;
  endDate: string;
  paymentDate: string;
}

interface UsePayrollOptions {
  employeeId?: string;
  departmentId?: string;
  month?: string;
  year?: number;
  status?: PayslipStatus;
  periodStatus?: PayrollPeriodStatus;
}

interface PayrollSummary {
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  employeeCount: number;
}

interface UsePayrollReturn {
  payslips: Payslip[];
  salaryStructures: SalaryStructure[];
  payrollRuns: PayrollRun[];
  summary: PayrollSummary;
  isLoading: boolean;
  error: string | null;
  runPayroll: (month: string, year: number) => Promise<void>;
  generatePayslip: (employeeId: string, month: string, year: number) => Promise<void>;
  refetch: () => Promise<void>;
}

export function usePayroll(options: UsePayrollOptions = {}): UsePayrollReturn {
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [salaryStructures, setSalaryStructures] = useState<SalaryStructure[]>([]);
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [structuresRes, periodsRes] = await Promise.all([
        payrollService.getStructures(),
        payrollService.getPeriods({
          month: options.month ? Number(options.month) : undefined,
          year: options.year,
          status: options.periodStatus,
        }),
      ]);

      if (structuresRes.success && structuresRes.data) {
        setSalaryStructures(structuresRes.data);
      }

      if (periodsRes.success && periodsRes.data) {
        const runs = periodsRes.data.map((p): PayrollRun => ({
          id: p.id,
          month: p.nameAr || p.name,
          year: Number(p.startDate.split("-")[0] || options.year || new Date().getFullYear()),
          status: p.status,
          totalAmount: p.totalNet,
          employeeCount: p.employeeCount,
          createdAt: p.createdAt,
          startDate: p.startDate,
          endDate: p.endDate,
          paymentDate: p.paymentDate,
        }));
        setPayrollRuns(runs);

        if (options.employeeId) {
          const payslipsRes = await payrollService.getEmployeePayslips(options.employeeId, {
            year: options.year,
            status: options.status,
          });

          if (payslipsRes.success && payslipsRes.data) {
            setPayslips(payslipsRes.data);
          }
        } else {
          const payslipResponses = await Promise.all(
            periodsRes.data.map((period) => payrollService.getPayslips(period.id))
          );

          const allPayslips = payslipResponses.flatMap((response) =>
            response.success && response.data ? response.data : []
          );

          setPayslips(allPayslips);
        }
      } else {
        setPayrollRuns([]);
        setPayslips([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل تحميل بيانات الرواتب");
    } finally {
      setIsLoading(false);
    }
  }, [options.employeeId, options.month, options.periodStatus, options.status, options.year]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const runPayroll = useCallback(async (month: string, year: number) => {
    try {
      const monthNumber = Number(month);
      const paddedMonth = String(monthNumber).padStart(2, "0");
      const lastDay = new Date(year, monthNumber, 0).getDate();
      const createResponse = await payrollService.createPeriod({
        name: `${paddedMonth}-${year}`,
        nameAr: `${paddedMonth}-${year}`,
        startDate: `${year}-${paddedMonth}-01`,
        endDate: `${year}-${paddedMonth}-${String(lastDay).padStart(2, "0")}`,
        paymentDate: `${year}-${paddedMonth}-${String(lastDay).padStart(2, "0")}`,
      });
      if (createResponse.success && createResponse.data) {
        await payrollService.processPeriod(createResponse.data.id);
        await fetchData();
      } else {
        setError(createResponse.error || "فشل تشغيل مسير الرواتب");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل تشغيل مسير الرواتب");
    }
  }, [fetchData]);

  const generatePayslip = useCallback(async (employeeId: string, month: string, year: number) => {
    try {
      const monthNumber = Number(month);
      const periodsResponse = await payrollService.getPeriods({ year, month: monthNumber });
      let targetPeriod = periodsResponse.success && periodsResponse.data ? periodsResponse.data[0] : undefined;

      if (!targetPeriod) {
        await runPayroll(month, year);
        const refreshedPeriods = await payrollService.getPeriods({ year, month: monthNumber });
        targetPeriod = refreshedPeriods.success && refreshedPeriods.data ? refreshedPeriods.data[0] : undefined;
      } else if (targetPeriod.status === "draft") {
        await payrollService.processPeriod(targetPeriod.id);
      }

      if (!targetPeriod) {
        throw new Error("تعذر إنشاء فترة الرواتب المطلوبة");
      }

      const payslipsResponse = await payrollService.getEmployeePayslips(employeeId, { year });
      if (!payslipsResponse.success) {
        throw new Error(payslipsResponse.error || "فشل إنشاء كشف الراتب");
      }

      const matchingPayslip = payslipsResponse.data?.find((payslip) => payslip.payrollPeriodId === targetPeriod.id);
      if (!matchingPayslip) {
        throw new Error("لم يتم العثور على كشف راتب للموظف في هذه الفترة");
      }

      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل إنشاء كشف الراتب");
    }
  }, [fetchData, runPayroll]);

  const filteredPayslips = useMemo(() => {
    let result = payslips;

    if (options.employeeId) {
      result = result.filter((p) => p.employeeId === options.employeeId);
    }
    if (options.departmentId) {
      result = result.filter((p) => p.departmentId === options.departmentId);
    }
    if (options.month) {
      const monthPrefix = String(options.month).padStart(2, "0");
      result = result.filter((p) => p.periodStartDate?.split("-")[1] === monthPrefix);
    }
    if (options.year) {
      result = result.filter((p) => p.periodStartDate?.startsWith(String(options.year)) ?? true);
    }
    if (options.status) {
      result = result.filter((p) => p.status === options.status);
    }

    return result;
  }, [payslips, options.departmentId, options.employeeId, options.month, options.status, options.year]);

  const summary = useMemo((): PayrollSummary => {
    const totalGross = filteredPayslips.reduce((sum, p) => sum + (p.totalEarnings || 0), 0);
    const totalDeductions = filteredPayslips.reduce((sum, p) => sum + (p.totalDeductions || 0), 0);
    const totalNet = filteredPayslips.reduce((sum, p) => sum + (p.netSalary || 0), 0);
    const employeeCount = filteredPayslips.length;

    return { totalGross, totalDeductions, totalNet, employeeCount };
  }, [filteredPayslips]);

  return {
    payslips: filteredPayslips,
    salaryStructures,
    payrollRuns,
    summary,
    isLoading,
    error,
    runPayroll,
    generatePayslip,
    refetch: fetchData,
  };
}

export default usePayroll;
