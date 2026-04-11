// =====================
// Leave Types & Interfaces
// =====================

// أنواع الإجازات
export type LeaveCategory =
  | "annual" // إجازة سنوية
  | "sick" // إجازة مرضية
  | "unpaid" // إجازة بدون راتب
  | "maternity" // إجازة أمومة
  | "paternity" // إجازة أبوة
  | "marriage" // إجازة زواج
  | "bereavement" // إجازة وفاة
  | "hajj" // إجازة حج
  | "study" // إجازة دراسية
  | "emergency" // إجازة طارئة
  | "compensatory" // إجازة تعويضية
  | "other"; // أخرى

export const leaveCategoryLabels: Record<LeaveCategory, string> = {
  annual: "إجازة سنوية",
  sick: "إجازة مرضية",
  unpaid: "إجازة بدون راتب",
  maternity: "إجازة أمومة",
  paternity: "إجازة أبوة",
  marriage: "إجازة زواج",
  bereavement: "إجازة وفاة",
  hajj: "إجازة حج",
  study: "إجازة دراسية",
  emergency: "إجازة طارئة",
  compensatory: "إجازة تعويضية",
  other: "أخرى"
};

// حالة طلب الإجازة
export type LeaveRequestStatus =
  | "pending" // قيد الانتظار
  | "approved" // موافق عليه
  | "rejected" // مرفوض
  | "cancelled" // ملغي
  | "taken"; // تم أخذها

export const leaveRequestStatusLabels: Record<LeaveRequestStatus, string> = {
  pending: "قيد الانتظار",
  approved: "موافق عليه",
  rejected: "مرفوض",
  cancelled: "ملغي",
  taken: "تم أخذها"
};

// ألوان حالات الطلبات
export const leaveRequestStatusColors: Record<LeaveRequestStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-800",
  taken: "bg-blue-100 text-blue-800"
};

// نوع استحقاق الإجازة
export type AccrualType =
  | "yearly" // سنوي
  | "monthly" // شهري
  | "none"; // بدون استحقاق

export const accrualTypeLabels: Record<AccrualType, string> = {
  yearly: "سنوي",
  monthly: "شهري",
  none: "بدون استحقاق"
};

// =====================
// Main Interfaces
// =====================

// نوع الإجازة
export interface LeaveType {
  id: string;
  tenantId: string;
  name: string;
  nameEn: string;
  category: LeaveCategory;
  description?: string;
  color: string;

  // الإعدادات
  maxDaysPerYear: number;
  minDaysPerRequest: number;
  maxDaysPerRequest: number;
  requiresAttachment: boolean;
  allowHalfDay: boolean;
  isPaid: boolean;
  affectsSalary: boolean;
  salaryPercentage: number; // نسبة الراتب (100 = كامل)

  // الاستحقاق
  accrualType: AccrualType;
  accrualRate: number; // معدل الاستحقاق الشهري/السنوي
  carryOverAllowed: boolean;
  maxCarryOverDays: number;

  // الشروط
  minServiceMonths: number; // الحد الأدنى لأشهر الخدمة
  genderRestriction?: "male" | "female" | "all";

  // البيانات الوصفية
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// طلب الإجازة
export interface LeaveRequest {
  id: string;
  tenantId: string;
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  departmentId: string;
  departmentName: string;

  leaveTypeId: string;
  leaveTypeName: string;
  leaveCategory: LeaveCategory;

  // التواريخ
  startDate: string;
  endDate: string;
  totalDays: number;
  isHalfDay: boolean;
  halfDayPeriod?: "morning" | "afternoon";

  // التفاصيل
  reason: string;
  attachments: LeaveAttachment[];

  // الموافقات
  status: LeaveRequestStatus;
  approvalFlow: LeaveApproval[];
  currentApprover?: string;

  // البديل
  delegateEmployeeId?: string;
  delegateEmployeeName?: string;

  // معلومات إضافية
  emergencyContact?: string;
  emergencyPhone?: string;

  // البيانات الوصفية
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
}

// مرفق الإجازة
export interface LeaveAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: string;
}

// موافقة الإجازة
export interface LeaveApproval {
  id: string;
  approverId: string;
  approverName: string;
  approverRole: string;
  order: number;
  status: "pending" | "approved" | "rejected";
  comment?: string;
  actionDate?: string;
}

// رصيد الإجازات
export interface LeaveBalance {
  id: string;
  tenantId: string;
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  departmentId: string;
  departmentName: string;

  leaveTypeId: string;
  leaveTypeName: string;
  leaveCategory: LeaveCategory;

  year: number;

  // الأرصدة
  entitled: number; // المستحق
  carriedOver: number; // المرحل
  taken: number; // المأخوذ
  pending: number; // قيد الانتظار
  remaining: number; // المتبقي

  // التواريخ
  accrualStartDate: string;
  expiryDate?: string;

  // البيانات الوصفية
  createdAt: string;
  updatedAt: string;
}

// إعدادات سياسة الإجازات
export interface LeavePolicy {
  id: string;
  tenantId: string;
  name: string;
  description?: string;

  // الإعدادات العامة
  workingDaysPerWeek: number;
  weekendDays: number[]; // 0 = Sunday, 6 = Saturday
  includeHolidaysInLeave: boolean;
  allowNegativeBalance: boolean;
  maxNegativeDays: number;

  // فترة الاستحقاق
  accrualStartDate: "hire_date" | "year_start";
  yearStartMonth: number; // 1-12

  // الموافقات
  requireManagerApproval: boolean;
  requireHRApproval: boolean;
  autoApproveAfterDays: number; // 0 = لا موافقة تلقائية

  // الإشعارات
  notifyManager: boolean;
  notifyHR: boolean;
  notifyEmployee: boolean;
  reminderDaysBefore: number;

  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// حدث تقويم الإجازات
export interface LeaveCalendarEvent {
  id: string;
  title: string;
  employeeId: string;
  employeeName: string;
  leaveTypeId: string;
  leaveTypeName: string;
  category: LeaveCategory;
  color: string;
  startDate: string;
  endDate: string;
  status: LeaveRequestStatus;
  isHalfDay: boolean;
}

// ملخص الإجازات للموظف
export interface EmployeeLeaveSummary {
  employeeId: string;
  employeeName: string;
  year: number;
  balances: {
    leaveTypeId: string;
    leaveTypeName: string;
    category: LeaveCategory;
    entitled: number;
    taken: number;
    pending: number;
    remaining: number;
  }[];
  totalEntitled: number;
  totalTaken: number;
  totalPending: number;
  totalRemaining: number;
}

// إحصائيات الإجازات
export interface LeaveStats {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  employeesOnLeave: number;
  upcomingLeaves: number;

  byCategory: {
    category: LeaveCategory;
    count: number;
    totalDays: number;
  }[];

  byDepartment: {
    departmentId: string;
    departmentName: string;
    totalRequests: number;
    totalDays: number;
  }[];

  monthlyTrend: {
    month: string;
    requests: number;
    days: number;
  }[];
}

// =====================
// Filter Types
// =====================

export interface LeaveRequestFilters {
  employeeId?: string;
  departmentId?: string;
  leaveTypeId?: string;
  status?: LeaveRequestStatus;
  startDate?: string;
  endDate?: string;
  year?: number;
}

export interface LeaveBalanceFilters {
  employeeId?: string;
  departmentId?: string;
  leaveTypeId?: string;
  year?: number;
}

// =====================
// Mock Data
// =====================

export const leaveTypeColors: Record<LeaveCategory, string> = {
  annual: "#3B82F6", // blue
  sick: "#EF4444", // red
  unpaid: "#6B7280", // gray
  maternity: "#EC4899", // pink
  paternity: "#8B5CF6", // purple
  marriage: "#F59E0B", // amber
  bereavement: "#1F2937", // dark gray
  hajj: "#10B981", // emerald
  study: "#06B6D4", // cyan
  emergency: "#F97316", // orange
  compensatory: "#84CC16", // lime
  other: "#6366F1" // indigo
};

// =====================
// Helper Functions
// =====================

/**
 * حساب عدد أيام العمل بين تاريخين
 */
export function calculateWorkingDays(
  startDate: Date,
  endDate: Date,
  weekendDays: number[] = [5, 6] // الجمعة والسبت
): number {
  let count = 0;
  const current = new Date(startDate);

  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    if (!weekendDays.includes(dayOfWeek)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
}

/**
 * تنسيق نطاق التواريخ
 */
export function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short"
  };

  if (start.getFullYear() !== end.getFullYear()) {
    options.year = "numeric";
  }

  const startStr = start.toLocaleDateString("ar-SA", options);
  const endStr = end.toLocaleDateString("ar-SA", { ...options, year: "numeric" });

  return `${startStr} - ${endStr}`;
}

/**
 * الحصول على لون حالة طلب الإجازة
 */
export function getLeaveStatusColor(status: LeaveRequestStatus): string {
  return leaveRequestStatusColors[status];
}

/**
 * الحصول على نسبة الرصيد المستخدم
 */
export function getBalancePercentage(balance: LeaveBalance): number {
  const total = balance.entitled + balance.carriedOver;
  if (total === 0) return 0;
  return Math.round((balance.taken / total) * 100);
}

/**
 * التحقق من إمكانية طلب إجازة
 */
export function canRequestLeave(
  balance: LeaveBalance,
  requestedDays: number,
  allowNegative: boolean = false,
  maxNegative: number = 0
): { allowed: boolean; reason?: string } {
  const available = balance.remaining - balance.pending;

  if (requestedDays <= available) {
    return { allowed: true };
  }

  if (allowNegative && requestedDays <= available + maxNegative) {
    return {
      allowed: true,
      reason: "سيكون الرصيد سالباً بعد هذه الإجازة"
    };
  }

  return {
    allowed: false,
    reason: `الرصيد المتاح (${available} يوم) غير كافٍ`
  };
}
