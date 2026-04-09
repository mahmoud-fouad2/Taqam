/**
 * Leaves Data Hook - Centralized leave management
 */

"use client";

import { useState, useCallback, useMemo } from "react";
import type { LeaveRequest, LeaveBalance, LeaveType } from "@/lib/types/leave";
import { leavesApi } from "@/lib/api";

interface UseLeavesOptions {
  employeeId?: string;
  departmentId?: string;
  status?: "pending" | "approved" | "rejected" | "cancelled";
  leaveTypeId?: string;
  startDate?: string;
  endDate?: string;
}

interface UseLeavesReturn {
  requests: LeaveRequest[];
  balances: LeaveBalance[];
  leaveTypes: LeaveType[];
  isLoading: boolean;
  error: string | null;
  submitRequest: (data: Partial<LeaveRequest>) => Promise<void>;
  approveRequest: (id: string, comments?: string) => Promise<void>;
  rejectRequest: (id: string, reason: string) => Promise<void>;
  cancelRequest: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useLeaves(options: UseLeavesOptions = {}): UseLeavesReturn {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [requestsRes, balancesRes, typesRes] = await Promise.all([
        leavesApi.requests.getAll(options),
        options.employeeId 
          ? leavesApi.balances.getByEmployee(options.employeeId) 
          : Promise.resolve({ success: true, data: [] as LeaveBalance[] }),
        leavesApi.types.getAll(),
      ]);

      if (requestsRes.success && requestsRes.data) {
        setRequests(requestsRes.data);
      }
      if (balancesRes.success && balancesRes.data) {
        setBalances(balancesRes.data);
      }
      if (typesRes.success && typesRes.data) {
        setLeaveTypes(typesRes.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل تحميل بيانات الإجازات");
    } finally {
      setIsLoading(false);
    }
  }, [options]);

  const submitRequest = useCallback(async (data: Partial<LeaveRequest>) => {
    try {
      const response = await leavesApi.requests.create(data as Parameters<typeof leavesApi.requests.create>[0]);
      if (response.success) {
        await fetchData();
      } else {
        setError(response.error || "فشل تقديم الطلب");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل تقديم الطلب");
    }
  }, [fetchData]);

  const approveRequest = useCallback(async (id: string, comments?: string) => {
    try {
      const response = await leavesApi.requests.approve(id, comments);
      if (response.success) {
        await fetchData();
      } else {
        setError(response.error || "فشل الموافقة على الطلب");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل الموافقة على الطلب");
    }
  }, [fetchData]);

  const rejectRequest = useCallback(async (id: string, reason: string) => {
    try {
      const response = await leavesApi.requests.reject(id, reason);
      if (response.success) {
        await fetchData();
      } else {
        setError(response.error || "فشل رفض الطلب");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل رفض الطلب");
    }
  }, [fetchData]);

  const cancelRequest = useCallback(async (id: string) => {
    try {
      const response = await leavesApi.requests.cancel(id);
      if (response.success) {
        await fetchData();
      } else {
        setError(response.error || "فشل إلغاء الطلب");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل إلغاء الطلب");
    }
  }, [fetchData]);

  const filteredRequests = useMemo(() => {
    let result = requests;

    if (options.status) {
      result = result.filter((r) => r.status === options.status);
    }
    if (options.leaveTypeId) {
      result = result.filter((r) => r.leaveTypeId === options.leaveTypeId);
    }

    return result;
  }, [requests, options.status, options.leaveTypeId]);

  return {
    requests: filteredRequests,
    balances,
    leaveTypes,
    isLoading,
    error,
    submitRequest,
    approveRequest,
    rejectRequest,
    cancelRequest,
    refetch: fetchData,
  };
}

export default useLeaves;
