import { apiClient } from "./client";
import type {
  LeaveType,
  LeaveRequest,
  LeaveBalance,
  LeavePolicy,
  LeaveStats,
  LeaveCalendarEvent,
  EmployeeLeaveSummary,
  LeaveRequestFilters,
  LeaveBalanceFilters,
  LeaveApproval
} from "../types/leave";

function mapLeaveRequestStatusToApi(status?: LeaveRequestFilters["status"]): string | undefined {
  if (!status) return undefined;
  switch (status) {
    case "pending":
      return "PENDING";
    case "approved":
      return "APPROVED";
    case "rejected":
      return "REJECTED";
    case "cancelled":
      return "CANCELLED";
    case "taken":
      return "TAKEN";
    default:
      return undefined;
  }
}

// =====================
// Leave Types API
// =====================

export const leaveTypesApi = {
  /**
   * الحصول على جميع أنواع الإجازات
   */
  getAll: () => apiClient.get<LeaveType[]>("/leave-types"),

  /**
   * الحصول على نوع إجازة بالمعرف
   */
  getById: (id: string) => apiClient.get<LeaveType>(`/leave-types/${id}`),

  /**
   * إنشاء نوع إجازة جديد
   */
  create: (data: Omit<LeaveType, "id" | "tenantId" | "createdAt" | "updatedAt">) =>
    apiClient.post<LeaveType>("/leave-types", data),

  /**
   * إنشاء نوع إجازة (شكل متوافق مع الـ backend الحالي)
   */
  createBackend: (data: {
    name: string;
    nameAr: string;
    code: string;
    description?: string;
    defaultDays: number;
    maxDays: number;
    carryOverDays: number;
    isPaid: boolean;
    requiresApproval: boolean;
    requiresAttachment: boolean;
    minServiceMonths: number;
    applicableGenders: Array<"MALE" | "FEMALE">;
    color?: string;
    isActive: boolean;
  }) => apiClient.post<any>("/leave-types", data),

  /**
   * تحديث نوع إجازة
   */
  update: (id: string, data: Partial<LeaveType>) =>
    apiClient.put<LeaveType>(`/leave-types/${id}`, data),

  /**
   * تحديث نوع إجازة (شكل متوافق مع الـ backend الحالي)
   */
  updateBackend: (
    id: string,
    data: {
      name: string;
      nameAr: string;
      code: string;
      description?: string;
      defaultDays: number;
      maxDays: number;
      carryOverDays: number;
      isPaid: boolean;
      requiresApproval: boolean;
      requiresAttachment: boolean;
      minServiceMonths: number;
      applicableGenders: Array<"MALE" | "FEMALE">;
      color?: string;
      isActive: boolean;
    }
  ) => apiClient.put<any>(`/leave-types/${id}`, data),

  /**
   * حذف نوع إجازة
   */
  delete: (id: string) => apiClient.delete<void>(`/leave-types/${id}`),

  /**
   * تفعيل/تعطيل نوع إجازة
   */
  toggleActive: (id: string, isActive: boolean) =>
    apiClient.patch<LeaveType>(`/leave-types/${id}/toggle`, { isActive }),

  /**
   * الحصول على أنواع الإجازات النشطة فقط
   */
  getActive: () => apiClient.get<LeaveType[]>("/leave-types/active")
};

// =====================
// Leave Requests API
// =====================

export const leaveRequestsApi = {
  /**
   * الحصول على جميع طلبات الإجازات
   */
  getAll: (filters?: LeaveRequestFilters & { page?: number; limit?: number }) =>
    apiClient.get<LeaveRequest[]>("/leaves", {
      params: filters
        ? ({
            ...filters,
            status: mapLeaveRequestStatusToApi(filters.status) as any
          } as Record<string, string | number>)
        : undefined
    }),

  /**
   * الحصول على طلب إجازة بالمعرف
   */
  getById: (id: string) => apiClient.get<LeaveRequest>(`/leaves/${id}`),

  /**
   * الحصول على طلبات إجازات موظف
   */
  getByEmployee: (employeeId: string, year?: number) =>
    apiClient.get<LeaveRequest[]>("/leaves", {
      params: {
        employeeId,
        ...(year ? { year } : {})
      } as any
    }),

  /**
   * الحصول على طلبات الإجازات المعلقة للموافقة
   */
  getPendingApprovals: (approverId?: string) =>
    apiClient.get<LeaveRequest[]>("/leaves", {
      // Backend currently supports status filtering only
      params: { status: "PENDING" } as any
    }),

  /**
   * إنشاء طلب إجازة جديد
   */
  create: (data: {
    employeeId: string;
    leaveTypeId: string;
    startDate: string;
    endDate: string;
    reason: string;
    isHalfDay?: boolean;
    halfDayPeriod?: "morning" | "afternoon";
    delegateEmployeeId?: string;
    emergencyContact?: string;
    emergencyPhone?: string;
  }) =>
    apiClient.post<LeaveRequest>("/leaves", {
      employeeId: data.employeeId,
      leaveTypeId: data.leaveTypeId,
      startDate: data.startDate,
      endDate: data.endDate,
      reason: data.reason,
      isHalfDay: data.isHalfDay,
      delegateToId: data.delegateEmployeeId
    }),

  /**
   * تحديث طلب إجازة (قبل الموافقة فقط)
   */
  update: (id: string, data: Partial<LeaveRequest>) =>
    apiClient.put<LeaveRequest>(`/leaves/${id}`, data),

  /**
   * إلغاء طلب إجازة
   */
  cancel: (id: string, reason?: string) => apiClient.delete<void>(`/leaves/${id}`),

  /**
   * حذف طلب إجازة (مسودة فقط)
   */
  delete: (id: string) => apiClient.delete<void>(`/leaves/${id}`),

  /**
   * الموافقة على طلب إجازة
   */
  approve: (id: string, comment?: string) =>
    apiClient.put<LeaveRequest>(`/leaves/${id}`, { action: "approve", comment }),

  /**
   * رفض طلب إجازة
   */
  reject: (id: string, comment: string) =>
    apiClient.put<LeaveRequest>(`/leaves/${id}`, { action: "reject", rejectionReason: comment }),

  /**
   * رفع مرفق لطلب الإجازة
   */
  uploadAttachment: (id: string, file: File) => {
    const formData = new FormData();
    formData.append("attachment", file);
    return apiClient.upload<{ url: string }>(`/leave-requests/${id}/attachments`, formData);
  },

  /**
   * حذف مرفق من طلب الإجازة
   */
  removeAttachment: (requestId: string, attachmentId: string) =>
    apiClient.delete<void>(`/leave-requests/${requestId}/attachments/${attachmentId}`),

  /**
   * الحصول على سجل الموافقات
   */
  getApprovalHistory: (id: string) =>
    apiClient.get<LeaveApproval[]>(`/leave-requests/${id}/approvals`)
};

// =====================
// Leave Balances API
// =====================

export const leaveBalancesApi = {
  /**
   * الحصول على جميع أرصدة الإجازات
   */
  getAll: (filters?: LeaveBalanceFilters) =>
    apiClient.get<LeaveBalance[]>("/leave-balances", {
      params: filters as Record<string, string | number> | undefined
    }),

  /**
   * الحصول على أرصدة موظف
   */
  getByEmployee: (employeeId: string, year?: number) =>
    apiClient.get<LeaveBalance[]>(`/leave-balances/employee/${employeeId}`, {
      params: year ? { year } : undefined
    }),

  /**
   * الحصول على ملخص إجازات موظف
   */
  getEmployeeSummary: (employeeId: string, year?: number) =>
    apiClient.get<EmployeeLeaveSummary>(`/leave-balances/employee/${employeeId}/summary`, {
      params: year ? { year } : undefined
    }),

  /**
   * تحديث رصيد إجازة يدوياً (HR فقط)
   */
  adjustBalance: (
    id: string,
    adjustment: {
      adjustmentType: "add" | "subtract";
      days: number;
      reason: string;
    }
  ) => apiClient.patch<LeaveBalance>(`/leave-balances/${id}/adjust`, adjustment),

  /**
   * ترحيل الأرصدة للسنة الجديدة
   */
  carryOverBalances: (year: number) =>
    apiClient.post<{ processed: number }>("/leave-balances/carry-over", { year }),

  /**
   * إعادة حساب أرصدة موظف
   */
  recalculate: (employeeId: string, year?: number) =>
    apiClient.post<LeaveBalance[]>(`/leave-balances/employee/${employeeId}/recalculate`, { year }),

  /**
   * الحصول على أرصدة قسم
   */
  getByDepartment: (departmentId: string, year?: number) =>
    apiClient.get<LeaveBalance[]>(`/leave-balances/department/${departmentId}`, {
      params: year ? { year } : undefined
    })
};

// =====================
// Leave Policies API
// =====================

export const leavePoliciesApi = {
  /**
   * الحصول على جميع السياسات
   */
  getAll: () => apiClient.get<LeavePolicy[]>("/leave-policies"),

  /**
   * الحصول على سياسة بالمعرف
   */
  getById: (id: string) => apiClient.get<LeavePolicy>(`/leave-policies/${id}`),

  /**
   * إنشاء سياسة جديدة
   */
  create: (data: Omit<LeavePolicy, "id" | "tenantId" | "createdAt" | "updatedAt">) =>
    apiClient.post<LeavePolicy>("/leave-policies", data),

  /**
   * تحديث سياسة
   */
  update: (id: string, data: Partial<LeavePolicy>) =>
    apiClient.put<LeavePolicy>(`/leave-policies/${id}`, data),

  /**
   * حذف سياسة
   */
  delete: (id: string) => apiClient.delete<void>(`/leave-policies/${id}`),

  /**
   * تعيين سياسة كافتراضية
   */
  setDefault: (id: string) => apiClient.patch<LeavePolicy>(`/leave-policies/${id}/set-default`, {})
};

// =====================
// Leave Calendar API
// =====================

export const leaveCalendarApi = {
  /**
   * الحصول على أحداث التقويم
   */
  getEvents: (startDate: string, endDate: string, departmentId?: string) =>
    apiClient.get<LeaveCalendarEvent[]>("/leave-calendar/events", {
      params: {
        startDate,
        endDate,
        ...(departmentId && { departmentId })
      }
    }),

  /**
   * الحصول على الموظفين في إجازة اليوم
   */
  getOnLeaveToday: (departmentId?: string) =>
    apiClient.get<LeaveCalendarEvent[]>("/leave-calendar/on-leave-today", {
      params: departmentId ? { departmentId } : undefined
    }),

  /**
   * الحصول على الإجازات القادمة
   */
  getUpcoming: (days: number = 7, departmentId?: string) =>
    apiClient.get<LeaveCalendarEvent[]>("/leave-calendar/upcoming", {
      params: { days, ...(departmentId && { departmentId }) }
    }),

  /**
   * تصدير التقويم بتنسيق iCal
   */
  exportIcal: (startDate: string, endDate: string) =>
    apiClient.get<Blob>("/leave-calendar/export/ical", {
      params: { startDate, endDate }
    })
};

// =====================
// Leave Stats API
// =====================

export const leaveStatsApi = {
  /**
   * الحصول على إحصائيات الإجازات
   */
  getStats: (year?: number, departmentId?: string) =>
    apiClient.get<LeaveStats>("/leave-stats", {
      params: {
        ...(year && { year }),
        ...(departmentId && { departmentId })
      }
    }),

  /**
   * الحصول على تقرير الغياب
   */
  getAbsenceReport: (startDate: string, endDate: string, departmentId?: string) =>
    apiClient.get<
      {
        employeeId: string;
        employeeName: string;
        totalDays: number;
        byType: { type: string; days: number }[];
      }[]
    >("/leave-stats/absence-report", {
      params: { startDate, endDate, ...(departmentId && { departmentId }) }
    }),

  /**
   * تصدير تقرير الإجازات
   */
  exportReport: (params: {
    startDate: string;
    endDate: string;
    departmentId?: string;
    format: "csv" | "xlsx" | "pdf";
  }) => apiClient.get<Blob>("/leave-stats/export", { params })
};

// تصدير مجمع
export const leavesApi = {
  types: leaveTypesApi,
  requests: leaveRequestsApi,
  balances: leaveBalancesApi,
  policies: leavePoliciesApi,
  calendar: leaveCalendarApi,
  stats: leaveStatsApi
};
