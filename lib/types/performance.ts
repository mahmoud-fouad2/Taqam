// =====================
// Performance & Evaluation Types
// =====================

// حالة دورة التقييم
export type EvaluationCycleStatus =
  | "draft" // مسودة
  | "active" // نشط
  | "in-progress" // قيد التنفيذ
  | "completed" // مكتمل
  | "cancelled" // ملغي
  | "archived"; // مؤرشف

export const evaluationCycleStatusLabels: Record<EvaluationCycleStatus, string> = {
  draft: "مسودة",
  active: "نشط",
  "in-progress": "قيد التنفيذ",
  completed: "مكتمل",
  cancelled: "ملغي",
  archived: "مؤرشف"
};

// حالة تقييم الموظف
export type EmployeeEvaluationStatus =
  | "pending_self_review" // بانتظار التقييم الذاتي
  | "pending_manager_review" // بانتظار تقييم المدير
  | "pending_calibration" // بانتظار المعايرة
  | "pending_acknowledgment" // بانتظار التأكيد
  | "cancelled" // ملغي
  | "completed"; // مكتمل

export const employeeEvaluationStatusLabels: Record<EmployeeEvaluationStatus, string> = {
  pending_self_review: "بانتظار التقييم الذاتي",
  pending_manager_review: "بانتظار تقييم المدير",
  pending_calibration: "بانتظار المعايرة",
  pending_acknowledgment: "بانتظار التأكيد",
  cancelled: "ملغي",
  completed: "مكتمل"
};

// نوع الهدف
export type GoalType =
  | "individual" // فردي
  | "team" // فريق
  | "department" // قسم
  | "company"; // شركة

export const goalTypeLabels: Record<GoalType, string> = {
  individual: "فردي",
  team: "فريق",
  department: "قسم",
  company: "شركة"
};

// حالة الهدف
export type GoalStatus =
  | "not_started" // لم يبدأ
  | "in_progress" // قيد التنفيذ
  | "at_risk" // معرض للخطر
  | "overdue" // متأخر
  | "completed" // مكتمل
  | "cancelled"; // ملغي

export const goalStatusLabels: Record<GoalStatus, string> = {
  not_started: "لم يبدأ",
  in_progress: "قيد التنفيذ",
  at_risk: "معرض للخطر",
  overdue: "متأخر",
  completed: "مكتمل",
  cancelled: "ملغي"
};

export const goalStatusColors: Record<GoalStatus, string> = {
  not_started: "bg-gray-100 text-gray-800",
  in_progress: "bg-blue-100 text-blue-800",
  at_risk: "bg-orange-100 text-orange-800",
  overdue: "bg-red-100 text-red-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-500"
};

// أولوية الهدف
export type GoalPriority = "low" | "medium" | "high" | "critical";

export const goalPriorityLabels: Record<GoalPriority, string> = {
  low: "منخفضة",
  medium: "متوسطة",
  high: "عالية",
  critical: "حرجة"
};

export const goalPriorityColors: Record<GoalPriority, string> = {
  low: "bg-gray-100 text-gray-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800"
};

export const employeeEvaluationStatusColors: Record<EmployeeEvaluationStatus, string> = {
  pending_self_review: "bg-blue-100 text-blue-800",
  pending_manager_review: "bg-purple-100 text-purple-800",
  pending_calibration: "bg-orange-100 text-orange-800",
  pending_acknowledgment: "bg-teal-100 text-teal-800",
  cancelled: "bg-gray-100 text-gray-600",
  completed: "bg-green-100 text-green-800"
};

// نوع مقياس التقييم
export type RatingScale =
  | "numeric_5" // 1-5
  | "numeric_10" // 1-10
  | "percentage" // 0-100%
  | "descriptive"; // وصفي

export const ratingScaleLabels: Record<RatingScale, string> = {
  numeric_5: "رقمي (1-5)",
  numeric_10: "رقمي (1-10)",
  percentage: "نسبة مئوية",
  descriptive: "وصفي"
};

// =====================
// Main Interfaces
// =====================

// نموذج التقييم
export interface EvaluationTemplate {
  id: string;
  tenantId: string;
  name: string;
  nameEn: string;
  description?: string;

  // الإعدادات
  ratingScale: RatingScale;
  includesSelfReview: boolean;
  includesManagerReview: boolean;
  includes360Review: boolean;
  requiresCalibration: boolean;

  // الأقسام
  sections: EvaluationSection[];

  // الوزن الإجمالي
  totalWeight: number;

  // البيانات الوصفية
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// قسم التقييم
export interface EvaluationSection {
  id: string;
  name: string;
  description?: string;
  weight: number;
  order: number;
  criteria: EvaluationCriterion[];
}

// معيار التقييم
export interface EvaluationCriterion {
  id: string;
  name: string;
  description?: string;
  weight: number;
  order: number;
  isRequired: boolean;
}

// دورة التقييم
export interface EvaluationCycle {
  id: string;
  tenantId: string;
  name: string;
  description?: string;

  // الفترة
  startDate: string;
  endDate: string;
  year: number;
  quarter?: number;

  // النموذج المستخدم
  templateId: string;
  templateName: string;

  // المراحل
  selfReviewStart?: string;
  selfReviewEnd?: string;
  managerReviewStart?: string;
  managerReviewEnd?: string;
  calibrationStart?: string;
  calibrationEnd?: string;

  // الإحصائيات
  totalEmployees: number;
  completedCount: number;

  // الحالة
  status: EvaluationCycleStatus;

  // البيانات الوصفية
  createdAt: string;
  updatedAt: string;
}

// تقييم الموظف
export interface EmployeeEvaluation {
  id: string;
  tenantId: string;
  cycleId: string;
  cycleName: string;

  // الموظف
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  employeeAvatar?: string;
  departmentId: string;
  departmentName: string;
  jobTitleId: string;
  jobTitle: string;

  // المدير
  managerId: string;
  managerName: string;

  // النموذج
  templateId: string;
  templateName?: string;
  template?: EvaluationTemplate;

  // فترة التقييم
  periodStart?: string;
  periodEnd?: string;

  // التقييمات
  selfReview?: EvaluationReview;
  managerReview?: EvaluationReview;
  finalReview?: EvaluationReview;

  // النتائج
  selfScore?: number;
  managerScore?: number;
  finalScore?: number;
  rating?: string;

  // الملاحظات
  strengths?: string;
  improvements?: string;
  developmentPlan?: string;
  managerComments?: string;
  employeeComments?: string;

  // الحالة
  status: EmployeeEvaluationStatus;

  // التواريخ
  selfReviewDate?: string;
  managerReviewDate?: string;
  acknowledgedDate?: string;
  completedDate?: string;

  createdAt: string;
  updatedAt: string;
}

// مراجعة التقييم
export interface EvaluationReview {
  id?: string;
  evaluationId?: string;
  reviewerId?: string;
  reviewerName?: string;
  reviewType?: "self" | "manager" | "360";
  sections?: {
    sectionId: string;
    sectionName: string;
    criteria: {
      criterionId: string;
      criterionName: string;
      rating: number;
      comment?: string;
    }[];
    sectionScore: number;
  }[];
  score: number;
  overallScore?: number;
  comments?: string;
  strengths?: string[];
  improvements?: string[];
  recommendations?: string;
  submittedAt?: string;
}

// هدف الأداء (KPI)
export interface PerformanceGoal {
  id: string;
  tenantId: string;

  // الموظف/الفريق
  employeeId?: string;
  employeeName?: string;
  departmentId?: string;
  departmentName?: string;

  // تفاصيل الهدف
  title: string;
  description?: string;
  type: GoalType;
  priority: GoalPriority;

  // القياس
  metric: string;
  targetValue: number;
  currentValue: number;
  unit: string;

  // الفترة
  startDate: string;
  dueDate: string;
  completedDate?: string;

  // الوزن والتقدم
  weight: number;
  progress: number;

  // الحالة
  status: GoalStatus;

  // المعالم
  milestones: GoalMilestone[];

  // المهام المرتبطة
  linkedTasksCount: number;

  // البيانات الوصفية
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// معلم الهدف
export interface GoalMilestone {
  id: string;
  goalId?: string;
  title: string;
  dueDate: string;
  targetDate?: string;
  targetValue?: number;
  actualValue?: number;
  order?: number;
  isCompleted: boolean;
  completedDate?: string;
}

// تصنيف الأداء
export interface PerformanceRating {
  id: string;
  tenantId?: string;
  name: string;
  nameEn?: string;
  label?: string;
  minScore: number;
  maxScore: number;
  color: string;
  description?: string;
  order?: number;
}

// =====================
// Stats & Reports
// =====================

// إحصائيات التقييم
export interface EvaluationStats {
  totalEmployees: number;
  evaluated: number;
  pending: number;
  inProgress: number;

  averageScore: number;

  byRating: {
    rating: string;
    count: number;
    percentage: number;
  }[];

  byDepartment: {
    departmentId: string;
    departmentName: string;
    avgScore: number;
    count: number;
  }[];

  completionRate: number;
}

// إحصائيات الأهداف
export interface GoalStats {
  totalGoals: number;
  completed: number;
  inProgress: number;
  atRisk: number;
  notStarted: number;

  averageProgress: number;
  onTrackPercentage: number;

  byType: {
    type: GoalType;
    count: number;
  }[];

  byPriority: {
    priority: GoalPriority;
    count: number;
  }[];
}

// =====================
// Filters
// =====================

export interface EvaluationFilters {
  cycleId?: string;
  employeeId?: string;
  departmentId?: string;
  managerId?: string;
  status?: EmployeeEvaluationStatus;
  year?: number;
}

export interface GoalFilters {
  employeeId?: string;
  departmentId?: string;
  type?: GoalType;
  status?: GoalStatus;
  priority?: GoalPriority;
  startDate?: string;
  endDate?: string;
}

// =====================
// Mock Data
// =====================

export const defaultPerformanceRatings: PerformanceRating[] = [
  {
    id: "r1",
    name: "استثنائي",
    nameEn: "Exceptional",
    label: "استثنائي",
    minScore: 4.5,
    maxScore: 5,
    color: "#10B981",
    description: "أداء يتجاوز التوقعات بشكل كبير"
  },
  {
    id: "r2",
    name: "يتجاوز التوقعات",
    nameEn: "Exceeds Expectations",
    label: "يتجاوز التوقعات",
    minScore: 3.5,
    maxScore: 4.49,
    color: "#3B82F6",
    description: "أداء يتجاوز المتطلبات"
  },
  {
    id: "r3",
    name: "يلبي التوقعات",
    nameEn: "Meets Expectations",
    label: "يلبي التوقعات",
    minScore: 2.5,
    maxScore: 3.49,
    color: "#F59E0B",
    description: "أداء يلبي المتطلبات"
  },
  {
    id: "r4",
    name: "يحتاج تحسين",
    nameEn: "Needs Improvement",
    label: "يحتاج تحسين",
    minScore: 1.5,
    maxScore: 2.49,
    color: "#F97316",
    description: "أداء أقل من المتوقع"
  },
  {
    id: "r5",
    name: "غير مرضي",
    nameEn: "Unsatisfactory",
    label: "غير مرضي",
    minScore: 0,
    maxScore: 1.49,
    color: "#EF4444",
    description: "أداء غير مقبول"
  }
];

// =====================
// Helper Functions
// =====================

/**
 * حساب التقدير بناءً على الدرجة
 */
export function getRatingByScore(
  score: number,
  ratings: PerformanceRating[]
): PerformanceRating | undefined {
  return ratings.find((r) => score >= r.minScore && score <= r.maxScore);
}

/**
 * حساب نسبة الإنجاز
 */
export function calculateProgress(current: number, target: number): number {
  if (target === 0) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}

/**
 * تحديد حالة الهدف تلقائياً
 */
export function determineGoalStatus(goal: PerformanceGoal): GoalStatus {
  const today = new Date();
  const dueDate = new Date(goal.dueDate);
  const startDate = new Date(goal.startDate);

  if (goal.progress >= 100) return "completed";
  if (today < startDate) return "not_started";

  // حساب التقدم المتوقع
  const totalDays = (dueDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
  const elapsedDays = (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
  const expectedProgress = (elapsedDays / totalDays) * 100;

  if (goal.progress < expectedProgress - 20) return "at_risk";
  return "in_progress";
}

/**
 * تنسيق الدرجة
 */
export function formatScore(score: number, scale: RatingScale = "numeric_5"): string {
  switch (scale) {
    case "numeric_5":
      return `${score.toFixed(1)} / 5`;
    case "numeric_10":
      return `${score.toFixed(1)} / 10`;
    case "percentage":
      return `${score.toFixed(0)}%`;
    default:
      return score.toFixed(1);
  }
}
