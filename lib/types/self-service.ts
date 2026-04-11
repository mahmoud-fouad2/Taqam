// نظام الخدمة الذاتية للموظفين - Employee Self-Service System

// ==================== الملف الشخصي ====================

export interface EmployeeProfile {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  firstNameEn?: string;
  lastNameEn?: string;
  email: string;
  phone: string;
  avatar?: string;
  departmentId: string;
  departmentName: string;
  jobTitleId: string;
  jobTitle: string;
  managerId?: string;
  managerName?: string;
  hireDate: string;
  birthDate?: string;
  gender: "male" | "female";
  maritalStatus?: "single" | "married" | "divorced" | "widowed";
  nationality?: string;
  nationalId?: string;
  address?: AddressInfo;
  emergencyContact?: EmergencyContact;
  bankInfo?: BankInfo;
  documents?: EmployeeDocument[];
}

export interface AddressInfo {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
}

export interface BankInfo {
  bankName: string;
  accountNumber: string;
  iban?: string;
  swiftCode?: string;
}

export interface EmployeeDocument {
  id: string;
  name: string;
  type: "id" | "passport" | "contract" | "certificate" | "other";
  fileUrl: string;
  expiryDate?: string;
  uploadedAt: string;
}

// ==================== الطلبات ====================

export type SelfServiceRequestType =
  | "leave"
  | "overtime"
  | "expense"
  | "loan"
  | "certificate"
  | "document"
  | "training"
  | "equipment"
  | "profile-update"
  | "remote-work"
  | "ticket";

export const selfServiceRequestTypeLabels: Record<SelfServiceRequestType, string> = {
  leave: "طلب إجازة",
  overtime: "طلب عمل إضافي",
  expense: "طلب تعويض مصاريف",
  loan: "طلب سلفة/قرض",
  certificate: "طلب شهادة",
  document: "طلب مستند",
  training: "طلب تدريب",
  equipment: "طلب معدات",
  "profile-update": "تحديث البيانات",
  "remote-work": "طلب عمل عن بُعد",
  ticket: "تذكرة دعم"
};

export type RequestStatus = "draft" | "pending" | "approved" | "rejected" | "cancelled";

export const requestStatusLabels: Record<RequestStatus, string> = {
  draft: "مسودة",
  pending: "قيد المراجعة",
  approved: "موافق عليه",
  rejected: "مرفوض",
  cancelled: "ملغي"
};

export const requestStatusColors: Record<RequestStatus, string> = {
  draft: "bg-gray-100 text-gray-800",
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-800"
};

export interface SelfServiceRequest {
  id: string;
  type: SelfServiceRequestType;
  employeeId: string;
  employeeName: string;
  title: string;
  description?: string;
  status: RequestStatus;
  priority: "low" | "medium" | "high";
  attachments?: string[];
  approvers: RequestApprover[];
  comments?: RequestComment[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  metadata?: Record<string, unknown>;
}

export interface RequestApprover {
  id: string;
  name: string;
  role: string;
  status: "pending" | "approved" | "rejected";
  comments?: string;
  actionAt?: string;
}

export interface RequestComment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
}

// ==================== الإشعارات ====================

export type NotificationType =
  | "request-status"
  | "approval-needed"
  | "reminder"
  | "announcement"
  | "payslip"
  | "document-expiry"
  | "training"
  | "system";

export const notificationTypeLabels: Record<NotificationType, string> = {
  "request-status": "حالة طلب",
  "approval-needed": "موافقة مطلوبة",
  reminder: "تذكير",
  announcement: "إعلان",
  payslip: "قسيمة راتب",
  "document-expiry": "انتهاء مستند",
  training: "تدريب",
  system: "نظام"
};

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

// ==================== لوحة التحكم الشخصية ====================

export interface EmployeeDashboard {
  profile: {
    name: string;
    jobTitle: string;
    departmentName: string;
    avatar?: string;
  };
  attendance: {
    todayStatus: "present" | "absent" | "late" | "on-leave" | "not-checked-in";
    checkInTime?: string;
    checkOutTime?: string;
    workingHoursToday: number;
    workingHoursThisMonth: number;
  };
  leaves: {
    annualBalance: number;
    usedDays: number;
    pendingRequests: number;
  };
  pendingApprovals: number;
  upcomingEvents: DashboardEvent[];
  recentRequests: SelfServiceRequest[];
  notifications: Notification[];
}

export interface DashboardEvent {
  id: string;
  title: string;
  date: string;
  type: "holiday" | "training" | "meeting" | "birthday" | "anniversary" | "other";
}

// ==================== الشهادات والخطابات ====================

export type CertificateType =
  | "salary-certificate"
  | "experience-certificate"
  | "employment-letter"
  | "no-objection"
  | "bank-letter"
  | "custom";

export const certificateTypeLabels: Record<CertificateType, string> = {
  "salary-certificate": "شهادة راتب",
  "experience-certificate": "شهادة خبرة",
  "employment-letter": "خطاب تعريف بالراتب",
  "no-objection": "عدم ممانعة",
  "bank-letter": "خطاب للبنك",
  custom: "خطاب مخصص"
};

export interface CertificateRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  type: CertificateType;
  purpose?: string;
  addressedTo?: string;
  language: "ar" | "en" | "both";
  status: RequestStatus;
  generatedDocument?: string;
  requestedAt: string;
  processedAt?: string;
}
