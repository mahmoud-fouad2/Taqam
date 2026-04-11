/**
 * Attendance Data Hook - Centralized attendance management
 */

"use client";

import { useState, useCallback, useMemo } from "react";
import type { AttendanceRecord, AttendanceStatus } from "@/lib/types/attendance";
import { attendanceService } from "@/lib/api";

interface UseAttendanceOptions {
  employeeId?: string;
  departmentId?: string;
  startDate?: string;
  endDate?: string;
  status?: AttendanceStatus;
}

interface AttendanceSummary {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  earlyLeaveDays: number;
  attendanceRate: number;
}

interface UseAttendanceReturn {
  records: AttendanceRecord[];
  summary: AttendanceSummary;
  isLoading: boolean;
  error: string | null;
  checkIn: (employeeId: string, notes?: string) => Promise<void>;
  checkOut: (employeeId: string, notes?: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useAttendance(options: UseAttendanceOptions = {}): UseAttendanceReturn {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAttendance = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await attendanceService.getRecords({
        employeeId: options.employeeId,
        startDate: options.startDate,
        endDate: options.endDate
      });

      if (response.success && response.data) {
        setRecords(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل تحميل سجلات الحضور");
    } finally {
      setIsLoading(false);
    }
  }, [options.employeeId, options.startDate, options.endDate]);

  const checkIn = useCallback(
    async (employeeId: string, notes?: string) => {
      try {
        const response = await attendanceService.checkIn({ employeeId, notes });
        if (response.success) {
          await fetchAttendance();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "فشل تسجيل الحضور");
      }
    },
    [fetchAttendance]
  );

  const checkOut = useCallback(
    async (employeeId: string, notes?: string) => {
      try {
        const response = await attendanceService.checkOut({ employeeId, notes });
        if (response.success) {
          await fetchAttendance();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "فشل تسجيل الانصراف");
      }
    },
    [fetchAttendance]
  );

  const filteredRecords = useMemo(() => {
    let result = records;

    if (options.employeeId) {
      result = result.filter((r) => r.employeeId === options.employeeId);
    }
    if (options.departmentId) {
      // Would need employee data to filter by department
    }
    if (options.status) {
      result = result.filter((r) => r.status === options.status);
    }

    return result;
  }, [records, options.employeeId, options.departmentId, options.status]);

  const summary = useMemo((): AttendanceSummary => {
    const totalDays = filteredRecords.length;
    const presentDays = filteredRecords.filter((r) => r.status === "present").length;
    const absentDays = filteredRecords.filter((r) => r.status === "absent").length;
    const lateDays = filteredRecords.filter((r) => r.status === "late").length;
    const earlyLeaveDays = filteredRecords.filter((r) => r.status === "early_leave").length;
    const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

    return {
      totalDays,
      presentDays,
      absentDays,
      lateDays,
      earlyLeaveDays,
      attendanceRate
    };
  }, [filteredRecords]);

  return {
    records: filteredRecords,
    summary,
    isLoading,
    error,
    checkIn,
    checkOut,
    refetch: fetchAttendance
  };
}

export default useAttendance;
