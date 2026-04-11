// نظام التقارير والتحليلات - Reports & Analytics System

// ==================== أنواع التقارير ====================

export type ReportCategory =
  | "hr"
  | "payroll"
  | "attendance"
  | "leaves"
  | "performance"
  | "recruitment"
  | "training"
  | "custom";

export const reportCategoryLabels: Record<ReportCategory, string> = {
  hr: "الموارد البشرية",
  payroll: "الرواتب",
  attendance: "الحضور والانصراف",
  leaves: "الإجازات",
  performance: "الأداء",
  recruitment: "التوظيف",
  training: "التدريب",
  custom: "تقارير مخصصة"
};

export type ReportFormat = "table" | "chart" | "pivot" | "summary";

export interface ReportDefinition {
  id: string;
  name: string;
  nameEn?: string;
  description?: string;
  category: ReportCategory;
  format: ReportFormat;
  icon?: string;
  parameters?: ReportParameter[];
  columns?: ReportColumn[];
  isFavorite?: boolean;
  isScheduled?: boolean;
  lastRun?: string;
  createdBy?: string;
  createdAt: string;
}

export interface ReportParameter {
  id: string;
  name: string;
  type: "date" | "daterange" | "select" | "multiselect" | "text" | "number";
  required: boolean;
  defaultValue?: unknown;
  options?: { value: string; label: string }[];
}

export interface ReportColumn {
  id: string;
  name: string;
  type: "string" | "number" | "date" | "currency" | "percentage" | "boolean";
  sortable?: boolean;
  filterable?: boolean;
  aggregatable?: boolean;
}

// ==================== التقارير المجدولة ====================

export type ScheduleFrequency = "daily" | "weekly" | "monthly" | "quarterly" | "yearly";

export const scheduleFrequencyLabels: Record<ScheduleFrequency, string> = {
  daily: "يومياً",
  weekly: "أسبوعياً",
  monthly: "شهرياً",
  quarterly: "ربع سنوياً",
  yearly: "سنوياً"
};

export interface ScheduledReport {
  id: string;
  reportId: string;
  reportName: string;
  frequency: ScheduleFrequency;
  dayOfWeek?: number; // 0-6 للأسبوعي
  dayOfMonth?: number; // 1-31 للشهري
  time: string; // HH:mm
  recipients: string[];
  format: "pdf" | "excel" | "csv";
  isActive: boolean;
  lastRun?: string;
  nextRun: string;
  createdAt: string;
}

// ==================== لوحات التحليلات ====================

export interface AnalyticsDashboard {
  id: string;
  name: string;
  description?: string;
  widgets: DashboardWidget[];
  isDefault?: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type WidgetType =
  | "kpi"
  | "chart-bar"
  | "chart-line"
  | "chart-pie"
  | "chart-donut"
  | "table"
  | "trend"
  | "comparison";

export interface DashboardWidget {
  id: string;
  title: string;
  type: WidgetType;
  size: "small" | "medium" | "large" | "full";
  dataSource: string;
  config?: Record<string, unknown>;
  position: { x: number; y: number };
}

// ==================== مؤشرات الأداء الرئيسية ====================

export interface KPIMetric {
  id: string;
  name: string;
  value: number;
  previousValue?: number;
  target?: number;
  unit?: string;
  trend: "up" | "down" | "stable";
  trendPercentage?: number;
  category: string;
  description?: string;
  lastUpdated: string;
}

// ==================== إحصائيات الموارد البشرية ====================

export interface HRAnalytics {
  totalEmployees: number;
  activeEmployees: number;
  newHires: number;
  terminations: number;
  turnoverRate: number;
  averageTenure: number;
  headcountByDepartment: { department: string; count: number }[];
  headcountByNationality: { nationality: string; count: number }[];
  ageDistribution: { range: string; count: number }[];
  genderDistribution: { gender: string; count: number }[];
  employmentTypeDistribution: { type: string; count: number }[];
}

export interface AttendanceAnalytics {
  averageAttendanceRate: number;
  lateArrivals: number;
  earlyDepartures: number;
  absences: number;
  averageWorkingHours: number;
  overtimeHours: number;
  attendanceByDepartment: { department: string; rate: number }[];
  attendanceTrend: { date: string; rate: number }[];
}

export interface PayrollAnalytics {
  totalPayroll: number;
  averageSalary: number;
  salaryByDepartment: { department: string; total: number; average: number }[];
  salaryDistribution: { range: string; count: number }[];
  payrollTrend: { month: string; total: number }[];
  allowancesBreakdown: { type: string; amount: number }[];
  deductionsBreakdown: { type: string; amount: number }[];
}
