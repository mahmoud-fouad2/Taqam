import { apiClient, ApiResponse } from "./client";
import type {
  EvaluationTemplate,
  EvaluationCycle,
  EmployeeEvaluation,
  PerformanceGoal,
  PerformanceRating,
  EvaluationStats,
  GoalStats,
  EvaluationFilters,
  GoalFilters,
  EvaluationReview
} from "../types/performance";

// =====================
// Evaluation Templates API
// =====================

export const evaluationTemplatesApi = {
  async getAll(): Promise<ApiResponse<EvaluationTemplate[]>> {
    const response = await apiClient.get<{ templates?: ApiEvaluationTemplate[] }>(
      "/evaluations/templates"
    );
    if (!response.success) {
      return { success: false, error: response.error };
    }

    return {
      success: true,
      data: Array.isArray(response.data?.templates)
        ? response.data.templates.map(mapEvaluationTemplate)
        : []
    };
  },

  /**
   * الحصول على جميع نماذج التقييم
   */
  async getById(id: string): Promise<ApiResponse<EvaluationTemplate>> {
    const response = await apiClient.get<ApiEvaluationTemplate>(`/evaluations/templates/${id}`);
    if (!response.success || !response.data) {
      return { success: false, error: response.error };
    }

    return {
      success: true,
      data: mapEvaluationTemplate(response.data)
    };
  },

  /**
   * إنشاء نموذج جديد
   */
  async create(
    data: Omit<EvaluationTemplate, "id" | "tenantId" | "createdAt" | "updatedAt">
  ): Promise<ApiResponse<EvaluationTemplate>> {
    const response = await apiClient.post<{ template?: ApiEvaluationTemplate }>(
      "/evaluations/templates",
      buildEvaluationTemplatePayload(data)
    );

    const rawTemplate = response.data?.template;
    if (!response.success || !rawTemplate) {
      return { success: false, error: response.error || "فشل إنشاء نموذج التقييم" };
    }

    return {
      success: true,
      data: mapEvaluationTemplate(rawTemplate),
      message: response.message
    };
  },

  /**
   * تحديث نموذج
   */
  async update(
    id: string,
    data: Partial<EvaluationTemplate>
  ): Promise<ApiResponse<EvaluationTemplate>> {
    const response = await apiClient.patch<{ template?: ApiEvaluationTemplate }>(
      `/evaluations/templates/${id}`,
      buildEvaluationTemplatePayload(data)
    );

    const rawTemplate = response.data?.template;
    if (!response.success || !rawTemplate) {
      return { success: false, error: response.error || "فشل تحديث نموذج التقييم" };
    }

    return {
      success: true,
      data: mapEvaluationTemplate(rawTemplate),
      message: response.message
    };
  },

  /**
   * حذف نموذج
   */
  delete: (id: string) => apiClient.delete<void>(`/evaluations/templates/${id}`),

  /**
   * نسخ نموذج
   */
  async duplicate(id: string, name: string): Promise<ApiResponse<EvaluationTemplate>> {
    const current = await evaluationTemplatesApi.getById(id);
    if (!current.success || !current.data) {
      return { success: false, error: current.error || "القالب غير موجود" };
    }

    return evaluationTemplatesApi.create({
      ...current.data,
      name,
      nameEn: current.data.nameEn ? `${current.data.nameEn} Copy` : name,
      isDefault: false
    });
  },

  /**
   * تعيين كافتراضي
   */
  setDefault: (id: string) => evaluationTemplatesApi.update(id, { isDefault: true })
};

type ApiEvaluationTemplateCriterion = {
  id?: string;
  name?: string;
  nameAr?: string;
  weight?: number;
  description?: string;
  items?: Array<{
    id?: string;
    name?: string;
    nameAr?: string;
    weight?: number;
    description?: string;
  }>;
};

type ApiEvaluationTemplate = {
  id: string;
  tenantId: string;
  name: string;
  nameAr?: string | null;
  description?: string | null;
  isActive: boolean;
  isDefault: boolean;
  criteria?: ApiEvaluationTemplateCriterion[] | null;
  ratingScale?: number | null;
  ratingLabels?: string[] | null;
  createdAt: string;
  updatedAt: string;
};

function mapRatingScale(value: number | null | undefined): EvaluationTemplate["ratingScale"] {
  if (value && value > 5) {
    return "numeric_10";
  }

  return "numeric_5";
}

function mapRatingScaleToApi(value: EvaluationTemplate["ratingScale"] | undefined): number {
  switch (value) {
    case "numeric_10":
      return 10;
    case "percentage":
      return 10;
    case "descriptive":
      return 5;
    case "numeric_5":
    default:
      return 5;
  }
}

function getDefaultRatingLabels(value: EvaluationTemplate["ratingScale"] | undefined): string[] {
  if (value === "numeric_10") {
    return ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
  }

  return ["ضعيف", "مقبول", "جيد", "جيد جداً", "ممتاز"];
}

function mapEvaluationTemplate(raw: ApiEvaluationTemplate): EvaluationTemplate {
  const sections = Array.isArray(raw.criteria)
    ? raw.criteria.map((section, sectionIndex) => ({
        id: section.id || `section-${sectionIndex + 1}`,
        name: section.nameAr || section.name || "قسم بدون عنوان",
        description: section.description || undefined,
        weight: Number(section.weight ?? 0),
        order: sectionIndex + 1,
        criteria: Array.isArray(section.items)
          ? section.items.map((criterion, criterionIndex) => ({
              id: criterion.id || `criterion-${criterionIndex + 1}`,
              name: criterion.nameAr || criterion.name || "معيار بدون عنوان",
              description: criterion.description || undefined,
              weight: Number(criterion.weight ?? 0),
              order: criterionIndex + 1,
              isRequired: true
            }))
          : []
      }))
    : [];

  return {
    id: raw.id,
    tenantId: raw.tenantId,
    name: raw.nameAr || raw.name,
    nameEn: raw.name,
    description: raw.description || undefined,
    ratingScale: mapRatingScale(raw.ratingScale),
    includesSelfReview: true,
    includesManagerReview: true,
    includes360Review: false,
    requiresCalibration: true,
    sections,
    totalWeight: sections.reduce((sum, section) => sum + section.weight, 0),
    isActive: raw.isActive,
    isDefault: raw.isDefault,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt
  };
}

function buildEvaluationTemplatePayload(data: Partial<EvaluationTemplate>) {
  const payload: Record<string, unknown> = {};

  if (data.name !== undefined) {
    payload.name = (data.nameEn || data.name).trim();
    payload.nameAr = data.name.trim() || null;
  }

  if (data.description !== undefined) {
    payload.description = data.description?.trim() || null;
  }

  if (data.isActive !== undefined) {
    payload.isActive = data.isActive;
  }

  if (data.isDefault !== undefined) {
    payload.isDefault = data.isDefault;
  }

  if (data.ratingScale !== undefined) {
    payload.ratingScale = mapRatingScaleToApi(data.ratingScale);
    payload.ratingLabels = getDefaultRatingLabels(data.ratingScale);
  }

  if (data.sections !== undefined) {
    payload.criteria = data.sections.map((section) => ({
      id: section.id,
      name: section.name,
      nameAr: section.name,
      weight: section.weight,
      description: section.description,
      items: section.criteria.map((criterion) => ({
        id: criterion.id,
        name: criterion.name,
        nameAr: criterion.name,
        weight: criterion.weight,
        description: criterion.description
      }))
    }));
  }

  return payload;
}

// =====================
// Evaluation Cycles API
// =====================

export const evaluationCyclesApi = {
  /**
   * الحصول على جميع دورات التقييم
   */
  getAll: (year?: number) =>
    apiClient.get<EvaluationCycle[]>("/evaluation-cycles", {
      params: year ? { year } : undefined
    }),

  /**
   * الحصول على دورة بالمعرف
   */
  getById: (id: string) => apiClient.get<EvaluationCycle>(`/evaluation-cycles/${id}`),

  /**
   * إنشاء دورة جديدة
   */
  create: (
    data: Omit<
      EvaluationCycle,
      "id" | "tenantId" | "totalEmployees" | "completedCount" | "createdAt" | "updatedAt"
    >
  ) => apiClient.post<EvaluationCycle>("/evaluation-cycles", data),

  /**
   * تحديث دورة
   */
  update: (id: string, data: Partial<EvaluationCycle>) =>
    apiClient.put<EvaluationCycle>(`/evaluation-cycles/${id}`, data),

  /**
   * حذف دورة
   */
  delete: (id: string) => apiClient.delete<void>(`/evaluation-cycles/${id}`),

  /**
   * بدء دورة التقييم
   */
  start: (id: string) => apiClient.patch<EvaluationCycle>(`/evaluation-cycles/${id}/start`, {}),

  /**
   * إنهاء دورة التقييم
   */
  complete: (id: string) =>
    apiClient.patch<EvaluationCycle>(`/evaluation-cycles/${id}/complete`, {}),

  /**
   * أرشفة دورة
   */
  archive: (id: string) => apiClient.patch<EvaluationCycle>(`/evaluation-cycles/${id}/archive`, {}),

  /**
   * الحصول على إحصائيات الدورة
   */
  getStats: (id: string) => apiClient.get<EvaluationStats>(`/evaluation-cycles/${id}/stats`)
};

// =====================
// Employee Evaluations API
// =====================

export const employeeEvaluationsApi = {
  /**
   * الحصول على جميع تقييمات الموظفين
   */
  getAll: (filters?: EvaluationFilters) =>
    apiClient.get<EmployeeEvaluation[]>("/employee-evaluations", {
      params: filters as Record<string, string | number> | undefined
    }),

  /**
   * الحصول على تقييم بالمعرف
   */
  getById: (id: string) => apiClient.get<EmployeeEvaluation>(`/employee-evaluations/${id}`),

  /**
   * الحصول على تقييمات موظف
   */
  getByEmployee: (employeeId: string) =>
    apiClient.get<EmployeeEvaluation[]>(`/employee-evaluations/employee/${employeeId}`),

  /**
   * الحصول على تقييمات دورة
   */
  getByCycle: (cycleId: string) =>
    apiClient.get<EmployeeEvaluation[]>(`/employee-evaluations/cycle/${cycleId}`),

  /**
   * الحصول على التقييمات المعلقة للمدير
   */
  getPendingForManager: (managerId: string) =>
    apiClient.get<EmployeeEvaluation[]>(`/employee-evaluations/pending/${managerId}`),

  /**
   * تقديم التقييم الذاتي
   */
  submitSelfReview: (id: string, review: EvaluationReview) =>
    apiClient.patch<EmployeeEvaluation>(`/employee-evaluations/${id}/self-review`, review),

  /**
   * تقديم تقييم المدير
   */
  submitManagerReview: (
    id: string,
    review: EvaluationReview & {
      strengths?: string;
      improvements?: string;
      developmentPlan?: string;
      managerComments?: string;
    }
  ) => apiClient.patch<EmployeeEvaluation>(`/employee-evaluations/${id}/manager-review`, review),

  /**
   * إتمام المعايرة
   */
  submitCalibration: (id: string, data: { finalScore: number; rating: string }) =>
    apiClient.patch<EmployeeEvaluation>(`/employee-evaluations/${id}/calibration`, data),

  /**
   * تأكيد اطلاع الموظف
   */
  acknowledge: (id: string, employeeComments?: string) =>
    apiClient.patch<EmployeeEvaluation>(`/employee-evaluations/${id}/acknowledge`, {
      employeeComments
    }),

  /**
   * تصدير التقييمات
   */
  export: (cycleId: string, format: "csv" | "xlsx" | "pdf") =>
    apiClient.get<Blob>(`/employee-evaluations/export/${cycleId}`, { params: { format } })
};

// =====================
// Performance Goals API
// =====================

export const performanceGoalsApi = {
  /**
   * الحصول على جميع الأهداف
   */
  getAll: (filters?: GoalFilters) =>
    apiClient.get<PerformanceGoal[]>("/performance-goals", {
      params: filters as Record<string, string | number> | undefined
    }),

  /**
   * الحصول على هدف بالمعرف
   */
  getById: (id: string) => apiClient.get<PerformanceGoal>(`/performance-goals/${id}`),

  /**
   * الحصول على أهداف موظف
   */
  getByEmployee: (employeeId: string) =>
    apiClient.get<PerformanceGoal[]>(`/performance-goals/employee/${employeeId}`),

  /**
   * الحصول على أهداف قسم
   */
  getByDepartment: (departmentId: string) =>
    apiClient.get<PerformanceGoal[]>(`/performance-goals/department/${departmentId}`),

  /**
   * إنشاء هدف جديد
   */
  create: (
    data: Omit<PerformanceGoal, "id" | "tenantId" | "progress" | "createdAt" | "updatedAt">
  ) => apiClient.post<PerformanceGoal>("/performance-goals", data),

  /**
   * تحديث هدف
   */
  update: (id: string, data: Partial<PerformanceGoal>) =>
    apiClient.put<PerformanceGoal>(`/performance-goals/${id}`, data),

  /**
   * حذف هدف
   */
  delete: (id: string) => apiClient.delete<void>(`/performance-goals/${id}`),

  /**
   * تحديث التقدم
   */
  updateProgress: (id: string, currentValue: number) =>
    apiClient.patch<PerformanceGoal>(`/performance-goals/${id}/progress`, { currentValue }),

  /**
   * إكمال هدف
   */
  complete: (id: string) =>
    apiClient.patch<PerformanceGoal>(`/performance-goals/${id}/complete`, {}),

  /**
   * إلغاء هدف
   */
  cancel: (id: string, reason?: string) =>
    apiClient.patch<PerformanceGoal>(`/performance-goals/${id}/cancel`, { reason }),

  /**
   * إضافة معلم
   */
  addMilestone: (
    goalId: string,
    milestone: { title: string; dueDate: string; targetValue?: number }
  ) => apiClient.post<PerformanceGoal>(`/performance-goals/${goalId}/milestones`, milestone),

  /**
   * تحديث معلم
   */
  updateMilestone: (
    goalId: string,
    milestoneId: string,
    data: { actualValue?: number; isCompleted?: boolean }
  ) =>
    apiClient.patch<PerformanceGoal>(
      `/performance-goals/${goalId}/milestones/${milestoneId}`,
      data
    ),

  /**
   * الحصول على إحصائيات الأهداف
   */
  getStats: (params?: { employeeId?: string; departmentId?: string; year?: number }) =>
    apiClient.get<GoalStats>("/performance-goals/stats", {
      params: params as Record<string, string | number> | undefined
    })
};

// =====================
// Performance Ratings API
// =====================

export const performanceRatingsApi = {
  /**
   * الحصول على جميع التقديرات
   */
  getAll: () => apiClient.get<PerformanceRating[]>("/performance-ratings"),

  /**
   * تحديث التقديرات
   */
  update: (ratings: PerformanceRating[]) =>
    apiClient.put<PerformanceRating[]>("/performance-ratings", { ratings })
};

// تصدير مجمع
export const performanceApi = {
  templates: evaluationTemplatesApi,
  cycles: evaluationCyclesApi,
  evaluations: employeeEvaluationsApi,
  goals: performanceGoalsApi,
  ratings: performanceRatingsApi
};
