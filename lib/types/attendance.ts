/**
 * Time & Attendance Types
 * أنواع الحضور والانصراف والورديات
 */

// ===== Shift (الوردية) =====
export interface Shift {
  id: string;
  tenantId: string;
  
  name: string;
  nameAr: string;
  code: string;
  
  // Working hours
  startTime: string; // HH:mm format
  endTime: string;
  
  // Break
  breakStartTime?: string;
  breakEndTime?: string;
  breakDurationMinutes?: number;
  
  // Flexibility
  flexibleStartMinutes?: number; // Grace period for late arrival
  flexibleEndMinutes?: number;   // Grace period for early leave
  
  // Work days (0=Sunday, 6=Saturday)
  workDays: number[];
  
  // Overtime settings
  overtimeEnabled: boolean;
  overtimeMultiplier?: number; // e.g., 1.5x
  
  // Color for UI
  color: string;
  
  isDefault: boolean;
  isActive: boolean;
  
  createdAt: string;
  updatedAt: string;
}

// ===== Attendance Record =====
export type AttendanceStatus = 
  | "pending"      // بانتظار/غير مكتمل
  | "present"      // حاضر
  | "absent"       // غائب
  | "late"         // متأخر
  | "early_leave"  // مغادرة مبكرة
  | "on_leave"     // في إجازة
  | "holiday"      // عطلة رسمية
  | "weekend";     // عطلة أسبوعية

export interface AttendanceRecord {
  id: string;
  tenantId: string;
  employeeId: string;
  shiftId: string;
  
  date: string; // YYYY-MM-DD
  
  // Check-in/out times
  checkInTime?: string;    // ISO datetime
  checkOutTime?: string;
  
  // Expected vs actual
  expectedCheckIn: string;
  expectedCheckOut: string;
  
  // Calculated values
  status: AttendanceStatus;
  lateMinutes?: number;
  earlyLeaveMinutes?: number;
  totalWorkMinutes?: number;
  overtimeMinutes?: number;
  
  // Source
  checkInSource?: "manual" | "biometric" | "mobile" | "web";
  checkOutSource?: "manual" | "biometric" | "mobile" | "web";
  
  // Location (for mobile check-in)
  checkInLocation?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  checkOutLocation?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  
  notes?: string;
  
  // If modified by admin
  modifiedById?: string;
  modifiedAt?: string;
  
  createdAt: string;
  updatedAt: string;
}

// ===== Attendance Request =====
export type AttendanceRequestType = 
  | "check_correction"  // تصحيح حضور
  | "overtime"          // عمل إضافي
  | "permission"        // استئذان
  | "work_from_home";   // عمل من المنزل

export type AttendanceRequestStatus = 
  | "pending"   // بانتظار الموافقة
  | "approved"  // معتمد
  | "rejected"  // مرفوض
  | "cancelled"; // ملغي

export interface AttendanceRequest {
  id: string;
  tenantId: string;
  employeeId: string;
  
  type: AttendanceRequestType;
  status: AttendanceRequestStatus;
  
  date: string; // YYYY-MM-DD
  
  // For check correction
  requestedCheckIn?: string;
  requestedCheckOut?: string;
  
  // For overtime
  overtimeHours?: number;
  
  // For permission
  permissionStartTime?: string;
  permissionEndTime?: string;
  
  reason: string;
  attachmentUrl?: string;
  
  // Approval workflow
  approvedById?: string;
  approvedAt?: string;
  rejectionReason?: string;
  
  createdAt: string;
  updatedAt: string;
}

// ===== Holiday =====
export interface Holiday {
  id: string;
  tenantId: string;
  
  name: string;
  nameAr: string;
  
  date: string;         // YYYY-MM-DD
  endDate?: string;     // For multi-day holidays
  
  isRecurring: boolean; // Repeats yearly
  
  createdAt: string;
  updatedAt: string;
}

// ===== Labels =====
export const attendanceStatusLabels: Record<AttendanceStatus, { ar: string; en: string }> = {
  pending: { ar: "قيد المعالجة", en: "Pending" },
  present: { ar: "حاضر", en: "Present" },
  absent: { ar: "غائب", en: "Absent" },
  late: { ar: "متأخر", en: "Late" },
  early_leave: { ar: "مغادرة مبكرة", en: "Early Leave" },
  on_leave: { ar: "في إجازة", en: "On Leave" },
  holiday: { ar: "عطلة رسمية", en: "Holiday" },
  weekend: { ar: "عطلة أسبوعية", en: "Weekend" },
};

export const requestTypeLabels: Record<AttendanceRequestType, { ar: string; en: string }> = {
  check_correction: { ar: "تصحيح حضور", en: "Check Correction" },
  overtime: { ar: "عمل إضافي", en: "Overtime" },
  permission: { ar: "استئذان", en: "Permission" },
  work_from_home: { ar: "عمل من المنزل", en: "Work From Home" },
};

export const requestStatusLabels: Record<AttendanceRequestStatus, { ar: string; en: string }> = {
  pending: { ar: "بانتظار الموافقة", en: "Pending" },
  approved: { ar: "معتمد", en: "Approved" },
  rejected: { ar: "مرفوض", en: "Rejected" },
  cancelled: { ar: "ملغي", en: "Cancelled" },
};

// Day names
export const dayNames = {
  ar: ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"],
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
};

// ===== Helper Functions =====
export function formatTime(time: string): string {
  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours);
  const period = hour >= 12 ? "م" : "ص";
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${minutes} ${period}`;
}

export function formatMinutesToHours(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} دقيقة`;
  if (mins === 0) return `${hours} ساعة`;
  return `${hours} ساعة و ${mins} دقيقة`;
}

export function getStatusColor(status: AttendanceStatus): string {
  switch (status) {
    case "present":
      return "bg-green-500";
    case "absent":
      return "bg-red-500";
    case "late":
      return "bg-yellow-500";
    case "early_leave":
      return "bg-orange-500";
    case "on_leave":
      return "bg-blue-500";
    case "holiday":
      return "bg-purple-500";
    case "weekend":
      return "bg-gray-400";
    default:
      return "bg-gray-500";
  }
}

export function calculateWorkHours(checkIn: string, checkOut: string, breakMinutes: number = 0): number {
  const inTime = new Date(checkIn).getTime();
  const outTime = new Date(checkOut).getTime();
  const diffMinutes = (outTime - inTime) / (1000 * 60);
  return Math.max(0, diffMinutes - breakMinutes);
}
