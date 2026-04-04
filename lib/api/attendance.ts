/**
 * Attendance Service - API calls for attendance management
 */

import apiClient, { ApiResponse } from "./client";
import type { AttendanceRecord, AttendanceRequest, Shift, Holiday } from "@/lib/types/attendance";

type ApiAttendanceRequest = {
  id: string;
  tenantId: string;
  employeeId: string;
  type: string;
  status: string;
  date: string;
  requestedCheckIn?: string | null;
  requestedCheckOut?: string | null;
  overtimeHours?: number | string | null;
  permissionStartTime?: string | null;
  permissionEndTime?: string | null;
  reason: string;
  attachmentUrl?: string | null;
  approvedById?: string | null;
  approvedAt?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
};

function normalizeRequestType(value: string | null | undefined): AttendanceRequest["type"] {
  switch ((value || "").trim().toLowerCase()) {
    case "overtime":
      return "overtime";
    case "permission":
      return "permission";
    case "work_from_home":
    case "work-from-home":
      return "work_from_home";
    case "check_correction":
    case "check-correction":
    default:
      return "check_correction";
  }
}

function normalizeRequestStatus(value: string | null | undefined): AttendanceRequest["status"] {
  switch ((value || "").trim().toLowerCase()) {
    case "approved":
      return "approved";
    case "rejected":
      return "rejected";
    case "cancelled":
      return "cancelled";
    case "pending":
    default:
      return "pending";
  }
}

function mapAttendanceRequestFromApi(item: ApiAttendanceRequest): AttendanceRequest {
  return {
    id: item.id,
    tenantId: item.tenantId,
    employeeId: item.employeeId,
    type: normalizeRequestType(item.type),
    status: normalizeRequestStatus(item.status),
    date: item.date,
    requestedCheckIn: item.requestedCheckIn ?? undefined,
    requestedCheckOut: item.requestedCheckOut ?? undefined,
    overtimeHours:
      item.overtimeHours == null || item.overtimeHours === ""
        ? undefined
        : Number(item.overtimeHours),
    permissionStartTime: item.permissionStartTime ?? undefined,
    permissionEndTime: item.permissionEndTime ?? undefined,
    reason: item.reason,
    attachmentUrl: item.attachmentUrl ?? undefined,
    approvedById: item.approvedById ?? undefined,
    approvedAt: item.approvedAt ?? undefined,
    rejectionReason: item.rejectionReason ?? undefined,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

function toAttendanceRequestPayload(
  data: Pick<
    AttendanceRequest,
    | "employeeId"
    | "type"
    | "date"
    | "reason"
    | "attachmentUrl"
    | "requestedCheckIn"
    | "requestedCheckOut"
    | "overtimeHours"
    | "permissionStartTime"
    | "permissionEndTime"
  >
) {
  return {
    employeeId: data.employeeId,
    type: data.type.toUpperCase(),
    date: data.date,
    reason: data.reason,
    attachmentUrl: data.attachmentUrl,
    requestedCheckIn: data.requestedCheckIn,
    requestedCheckOut: data.requestedCheckOut,
    overtimeHours: data.overtimeHours,
    permissionStartTime: data.permissionStartTime,
    permissionEndTime: data.permissionEndTime,
  };
}

export interface AttendanceFilters {
  employeeId?: string;
  departmentId?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface AttendanceStats {
  present: number;
  absent: number;
  late: number;
  onLeave: number;
  totalWorkHours: number;
  avgWorkHours: number;
  punctualityRate: number;
}

export const attendanceService = {
  // ============ Attendance Records ============
  
  /**
   * Get attendance records with filters
   */
  async getRecords(filters?: AttendanceFilters): Promise<ApiResponse<AttendanceRecord[]>> {
    return apiClient.get<AttendanceRecord[]>("/attendance", { params: filters as Record<string, string | number> });
  },

  /**
   * Get single attendance record
   */
  async getRecord(id: string): Promise<ApiResponse<AttendanceRecord>> {
    return apiClient.get<AttendanceRecord>(`/attendance/${id}`);
  },

  /**
   * Check in employee
   */
  async checkIn(data: {
    employeeId: string;
    location?: { lat: number; lng: number };
    notes?: string;
  }): Promise<ApiResponse<AttendanceRecord>> {
    return apiClient.post<AttendanceRecord>("/attendance/check-in", data);
  },

  /**
   * Check out employee
   */
  async checkOut(data: {
    employeeId: string;
    location?: { lat: number; lng: number };
    notes?: string;
  }): Promise<ApiResponse<AttendanceRecord>> {
    return apiClient.post<AttendanceRecord>("/attendance/check-out", data);
  },

  /**
   * Get attendance statistics
   */
  async getStats(filters?: {
    employeeId?: string;
    departmentId?: string;
    month?: string;
  }): Promise<ApiResponse<AttendanceStats>> {
    return apiClient.get<AttendanceStats>("/attendance/stats", { params: filters });
  },

  /**
   * Get monthly attendance calendar
   */
  async getMonthlyCalendar(employeeId: string, year: number, month: number): Promise<ApiResponse<AttendanceRecord[]>> {
    return apiClient.get<AttendanceRecord[]>(`/attendance/calendar/${employeeId}`, {
      params: { year, month },
    });
  },

  // ============ Shifts ============

  /**
   * Get all shifts
   */
  async getShifts(): Promise<ApiResponse<Shift[]>> {
    return apiClient.get<Shift[]>("/shifts");
  },

  /**
   * Create shift
   */
  async createShift(data: Omit<Shift, "id">): Promise<ApiResponse<Shift>> {
    return apiClient.post<Shift>("/shifts", data);
  },

  /**
   * Update shift
   */
  async updateShift(id: string, data: Partial<Shift>): Promise<ApiResponse<Shift>> {
    return apiClient.put<Shift>(`/shifts/${id}`, data);
  },

  /**
   * Delete shift
   */
  async deleteShift(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/shifts/${id}`);
  },

  /**
   * Assign shift to employees
   */
  async assignShift(shiftId: string, employeeIds: string[]): Promise<ApiResponse<void>> {
    return apiClient.post(`/shifts/${shiftId}/assign`, { employeeIds });
  },

  // ============ Attendance Requests ============

  /**
   * Get attendance requests
   */
  async getRequests(filters?: {
    employeeId?: string;
    status?: string;
    type?: string;
  }): Promise<ApiResponse<AttendanceRequest[]>> {
    const res = await apiClient.get<{ items: ApiAttendanceRequest[] }>("/attendance-requests", {
      params: filters,
    });

    if (!res.success) {
      return { success: false, error: res.error };
    }

    const items = Array.isArray(res.data?.items) ? res.data.items : [];
    return {
      success: true,
      data: items.map(mapAttendanceRequestFromApi),
      message: res.message,
      meta: res.meta,
    };
  },

  /**
   * Create attendance request
   */
  async createRequest(
    data: Pick<
      AttendanceRequest,
      | "employeeId"
      | "type"
      | "date"
      | "reason"
      | "attachmentUrl"
      | "requestedCheckIn"
      | "requestedCheckOut"
      | "overtimeHours"
      | "permissionStartTime"
      | "permissionEndTime"
    >
  ): Promise<ApiResponse<AttendanceRequest>> {
    const res = await apiClient.post<ApiAttendanceRequest>(
      "/attendance-requests",
      toAttendanceRequestPayload(data)
    );

    if (!res.success || !res.data) {
      return { success: false, error: res.error || "فشل تقديم الطلب" };
    }

    return {
      success: true,
      data: mapAttendanceRequestFromApi(res.data),
      message: res.message,
      meta: res.meta,
    };
  },

  /**
   * Approve attendance request
   */
  async approveRequest(id: string, comment?: string): Promise<ApiResponse<AttendanceRequest>> {
    const res = await apiClient.patch<ApiAttendanceRequest>(`/attendance-requests/${id}`, {
      status: "approved",
      rejectionReason: comment,
    });

    if (!res.success || !res.data) {
      return { success: false, error: res.error || "فشل اعتماد الطلب" };
    }

    return {
      success: true,
      data: mapAttendanceRequestFromApi(res.data),
      message: res.message,
      meta: res.meta,
    };
  },

  /**
   * Reject attendance request
   */
  async rejectRequest(id: string, reason: string): Promise<ApiResponse<AttendanceRequest>> {
    const res = await apiClient.patch<ApiAttendanceRequest>(`/attendance-requests/${id}`, {
      status: "rejected",
      rejectionReason: reason,
    });

    if (!res.success || !res.data) {
      return { success: false, error: res.error || "فشل رفض الطلب" };
    }

    return {
      success: true,
      data: mapAttendanceRequestFromApi(res.data),
      message: res.message,
      meta: res.meta,
    };
  },

  // ============ Holidays ============

  /**
   * Get holidays
   */
  async getHolidays(year?: number): Promise<ApiResponse<Holiday[]>> {
    return apiClient.get<Holiday[]>("/holidays", { params: year ? { year } : undefined });
  },

  /**
   * Create holiday
   */
  async createHoliday(data: Omit<Holiday, "id">): Promise<ApiResponse<Holiday>> {
    return apiClient.post<Holiday>("/holidays", data);
  },

  /**
   * Delete holiday
   */
  async deleteHoliday(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/holidays/${id}`);
  },

  // ============ Reports ============

  /**
   * Generate attendance report
   */
  async generateReport(filters: {
    startDate: string;
    endDate: string;
    departmentId?: string;
    format?: "json" | "csv" | "pdf";
  }): Promise<ApiResponse<Blob | AttendanceRecord[]>> {
    return apiClient.get("/attendance/reports", { params: filters });
  },
};

export default attendanceService;
