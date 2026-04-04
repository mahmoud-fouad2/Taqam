/**
 * Training Service - API calls for training and development management
 * TODO: Connect to actual API endpoints when backend is ready
 */

import { apiClient, ApiResponse } from "./client";
import type {
  TrainingCourse,
  CourseEnrollment,
  DevelopmentPlan,
  CourseCategory,
  CourseStatus,
  EnrollmentStatus,
} from "@/lib/types/training";

// Alias for backward compat
type TrainingEnrollment = CourseEnrollment;
type TrainingCategory = CourseCategory;

// =====================
// Training Courses API
// =====================

export interface CourseFilters {
  category?: TrainingCategory;
  status?: CourseStatus;
  search?: string;
  isMandatory?: boolean;
  page?: number;
  pageSize?: number;
}

export interface CourseListResponse {
  courses: TrainingCourse[];
  total: number;
  page: number;
  pageSize: number;
}

export const trainingCoursesApi = {
  /**
   * Get all training courses
   */
  getAll: (filters?: CourseFilters) =>
    apiClient.get<CourseListResponse>("/training/courses", {
      params: filters as Record<string, string | number | boolean>,
    }),

  /**
   * Get course by ID
   */
  getById: (id: string) => apiClient.get<TrainingCourse>(`/training/courses/${id}`),

  /**
   * Create new course
   */
  create: (data: Omit<TrainingCourse, "id" | "tenantId" | "createdAt" | "updatedAt">) =>
    apiClient.post<TrainingCourse>("/training/courses", data),

  /**
   * Update course
   */
  update: (id: string, data: Partial<TrainingCourse>) =>
    apiClient.put<TrainingCourse>(`/training/courses/${id}`, data),

  /**
   * Delete course
   */
  delete: (id: string) => apiClient.delete<void>(`/training/courses/${id}`),

  /**
   * Publish course
   */
  publish: (id: string) => apiClient.patch<TrainingCourse>(`/training/courses/${id}/publish`, {}),

  /**
   * Archive course
   */
  archive: (id: string) => apiClient.patch<TrainingCourse>(`/training/courses/${id}/archive`, {}),

  /**
   * Get course categories
   */
  getCategories: () => apiClient.get<TrainingCategory[]>("/training/categories"),
};

// =====================
// Training Enrollments API
// =====================

export interface EnrollmentFilters {
  courseId?: string;
  employeeId?: string;
  status?: EnrollmentStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export interface EnrollmentListResponse {
  enrollments: TrainingEnrollment[];
  total: number;
  page: number;
  pageSize: number;
}

export const trainingEnrollmentsApi = {
  /**
   * Get all enrollments
   */
  getAll: (filters?: EnrollmentFilters) =>
    apiClient.get<EnrollmentListResponse>("/training/enrollments", {
      params: filters as Record<string, string | number>,
    }),

  /**
   * Get enrollment by ID
   */
  getById: (id: string) => apiClient.get<TrainingEnrollment>(`/training/enrollments/${id}`),

  /**
   * Get enrollments by employee
   */
  getByEmployee: (employeeId: string) =>
    apiClient.get<TrainingEnrollment[]>(`/training/enrollments/employee/${employeeId}`),

  /**
   * Enroll employee in course
   */
  enroll: (courseId: string, employeeId: string) =>
    apiClient.post<TrainingEnrollment>("/training/enrollments", { courseId, employeeId }),

  /**
   * Bulk enroll employees
   */
  bulkEnroll: (courseId: string, employeeIds: string[]) =>
    apiClient.post<{ enrolled: number; errors: string[] }>("/training/enrollments/bulk", {
      courseId,
      employeeIds,
    }),

  /**
   * Cancel enrollment
   */
  cancel: (id: string, reason?: string) =>
    apiClient.patch<TrainingEnrollment>(`/training/enrollments/${id}/cancel`, { reason }),

  /**
   * Complete enrollment
   */
  complete: (id: string, score?: number, feedback?: string) =>
    apiClient.patch<TrainingEnrollment>(`/training/enrollments/${id}/complete`, {
      score,
      feedback,
    }),

  /**
   * Update progress
   */
  updateProgress: (id: string, progress: number) =>
    apiClient.patch<TrainingEnrollment>(`/training/enrollments/${id}/progress`, { progress }),
};

// =====================
// Development Plans API
// =====================

export interface DevelopmentPlanFilters {
  employeeId?: string;
  status?: "draft" | "pending-approval" | "active" | "completed" | "cancelled";
  type?: DevelopmentPlan["type"];
  year?: number;
  page?: number;
  pageSize?: number;
}

export interface DevelopmentPlanListResponse {
  plans: DevelopmentPlan[];
  total: number;
  page: number;
  pageSize: number;
}

export interface DevelopmentPlanUpsertInput {
  employeeId: string;
  title: string;
  titleAr?: string;
  description?: string;
  startDate: string;
  targetDate: string;
  mentorId?: string;
  type?: DevelopmentPlan["type"];
  priority?: DevelopmentPlan["priority"];
  status?: DevelopmentPlan["status"];
  goals?: DevelopmentPlan["goals"];
  activities?: DevelopmentPlan["activities"];
  notes?: string;
}

type ApiDevelopmentPlanObjective = {
  id?: string;
  title?: string;
  description?: string;
  targetDate?: string | null;
  status?: string | null;
  progress?: number | null;
  metrics?: string | null;
  isCompleted?: boolean;
  completedAt?: string | null;
};

type ApiDevelopmentPlanResource = {
  id?: string;
  type?: string;
  title?: string;
  url?: string;
  description?: string;
  dueDate?: string | null;
  completedDate?: string | null;
  status?: string | null;
  notes?: string | null;
};

type ApiDevelopmentPlan = {
  id: string;
  employeeId: string;
  title: string;
  titleAr?: string | null;
  description?: string | null;
  type?: string | null;
  priority?: string | null;
  status?: string | null;
  startDate: string;
  endDate: string;
  objectives?: ApiDevelopmentPlanObjective[] | null;
  resources?: ApiDevelopmentPlanResource[] | null;
  progress?: number | null;
  mentorId?: string | null;
  mentor?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    firstNameAr?: string | null;
    lastNameAr?: string | null;
    avatar?: string | null;
    email?: string | null;
    jobTitle?: { name?: string | null; nameAr?: string | null } | null;
  } | null;
  employee?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    firstNameAr?: string | null;
    lastNameAr?: string | null;
    avatar?: string | null;
    jobTitle?: { name?: string | null; nameAr?: string | null } | null;
  } | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

function getPersonName(person?: {
  firstName?: string | null;
  lastName?: string | null;
  firstNameAr?: string | null;
  lastNameAr?: string | null;
} | null): string {
  if (!person) return "غير معروف";

  const preferred = `${person.firstNameAr || person.firstName || ""} ${person.lastNameAr || person.lastName || ""}`.trim();
  return preferred || "غير معروف";
}

function mapDevelopmentPlanStatus(value: string | null | undefined): DevelopmentPlan["status"] {
  switch (value) {
    case "PENDING_APPROVAL":
      return "pending-approval";
    case "IN_PROGRESS":
      return "active";
    case "COMPLETED":
      return "completed";
    case "CANCELLED":
      return "cancelled";
    default:
      return "draft";
  }
}

function mapDevelopmentPlanType(value: string | null | undefined): DevelopmentPlan["type"] {
  switch (value) {
    case "TEAM":
      return "team";
    case "ONBOARDING":
      return "onboarding";
    case "PERFORMANCE_IMPROVEMENT":
      return "performance-improvement";
    case "CAREER_GROWTH":
      return "career-growth";
    case "SKILL_DEVELOPMENT":
      return "skill-development";
    default:
      return "individual";
  }
}

function mapDevelopmentPlanTypeToApi(
  value: DevelopmentPlan["type"] | undefined
):
  | "INDIVIDUAL"
  | "TEAM"
  | "ONBOARDING"
  | "PERFORMANCE_IMPROVEMENT"
  | "CAREER_GROWTH"
  | "SKILL_DEVELOPMENT"
  | undefined {
  switch (value) {
    case "team":
      return "TEAM";
    case "onboarding":
      return "ONBOARDING";
    case "performance-improvement":
      return "PERFORMANCE_IMPROVEMENT";
    case "career-growth":
      return "CAREER_GROWTH";
    case "skill-development":
      return "SKILL_DEVELOPMENT";
    case "individual":
      return "INDIVIDUAL";
    default:
      return undefined;
  }
}

function mapDevelopmentPlanPriority(value: string | null | undefined): DevelopmentPlan["priority"] {
  switch (value) {
    case "LOW":
      return "low";
    case "HIGH":
      return "high";
    case "CRITICAL":
      return "critical";
    default:
      return "medium";
  }
}

function mapDevelopmentPlanPriorityToApi(
  value: DevelopmentPlan["priority"] | undefined
): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | undefined {
  switch (value) {
    case "low":
      return "LOW";
    case "high":
      return "HIGH";
    case "critical":
      return "CRITICAL";
    case "medium":
      return "MEDIUM";
    default:
      return undefined;
  }
}

function mapDevelopmentPlanStatusToApi(
  value: DevelopmentPlan["status"] | undefined
): "DRAFT" | "PENDING_APPROVAL" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | undefined {
  switch (value) {
    case "pending-approval":
      return "PENDING_APPROVAL";
    case "active":
      return "IN_PROGRESS";
    case "completed":
      return "COMPLETED";
    case "cancelled":
      return "CANCELLED";
    case "draft":
      return "DRAFT";
    default:
      return undefined;
  }
}

function normalizeDevelopmentActivityType(
  value: string | undefined
): DevelopmentPlan["activities"][number]["type"] {
  switch (value) {
    case "course":
    case "assignment":
    case "mentoring":
    case "reading":
    case "project":
    case "certification":
      return value;
    default:
      return "other";
  }
}

function clampDevelopmentProgress(value: number | null | undefined) {
  if (!Number.isFinite(Number(value))) {
    return undefined;
  }

  return Math.max(0, Math.min(100, Math.round(Number(value))));
}

function normalizeDevelopmentGoalStatus(
  value: string | null | undefined,
  isCompleted?: boolean,
  progress?: number | null
): DevelopmentPlan["goals"][number]["status"] {
  if (isCompleted || value === "completed") {
    return "completed";
  }

  if (value === "in-progress") {
    return "in-progress";
  }

  if ((clampDevelopmentProgress(progress) ?? 0) > 0) {
    return "in-progress";
  }

  return "not-started";
}

function normalizeDevelopmentActivityStatus(
  value: string | null | undefined,
  completedDate?: string | null
): DevelopmentPlan["activities"][number]["status"] {
  switch (value) {
    case "in-progress":
    case "completed":
    case "skipped":
      return value;
    case "pending":
      return "pending";
    default:
      return completedDate ? "completed" : "pending";
  }
}

function mapDevelopmentPlan(raw: ApiDevelopmentPlan): DevelopmentPlan {
  const goals = Array.isArray(raw.objectives)
    ? raw.objectives.map((objective, index) => {
        const status = normalizeDevelopmentGoalStatus(
          objective.status,
          objective.isCompleted,
          objective.progress
        );
        const progress =
          status === "completed"
            ? 100
            : clampDevelopmentProgress(objective.progress) ?? (status === "in-progress" ? 50 : 0);

        return {
          id: objective.id || `goal-${index + 1}`,
          title: objective.title || "هدف بدون عنوان",
          description: objective.description || undefined,
          targetDate: objective.targetDate || raw.endDate,
          completedDate: objective.completedAt || undefined,
          status,
          progress,
          metrics: objective.metrics || undefined,
        };
      })
    : [];

  const activities = Array.isArray(raw.resources)
    ? raw.resources.map((resource, index) => {
        const status = normalizeDevelopmentActivityStatus(resource.status, resource.completedDate);

        return {
          id: resource.id || `activity-${index + 1}`,
          title: resource.title || "نشاط بدون عنوان",
          type: normalizeDevelopmentActivityType(resource.type),
          description: resource.description || undefined,
          courseId: resource.url || undefined,
          dueDate: resource.dueDate || raw.endDate,
          completedDate: resource.completedDate || undefined,
          status,
          notes: resource.notes || undefined,
        };
      })
    : [];

  const fallbackProgress =
    goals.length > 0 ? Math.round(goals.reduce((sum, goal) => sum + goal.progress, 0) / goals.length) : 0;
  const rawProgress = clampDevelopmentProgress(raw.progress);
  const progress = rawProgress === undefined || (rawProgress === 0 && fallbackProgress > 0) ? fallbackProgress : rawProgress;

  return {
    id: raw.id,
    employeeId: raw.employeeId,
    employeeName: getPersonName(raw.employee),
    employeeAvatar: raw.employee?.avatar || undefined,
    title: raw.titleAr || raw.title,
    description: raw.description || undefined,
    notes: raw.notes || undefined,
    type: mapDevelopmentPlanType(raw.type),
    priority: mapDevelopmentPlanPriority(raw.priority),
    status: mapDevelopmentPlanStatus(raw.status),
    startDate: new Date(raw.startDate).toISOString().slice(0, 10),
    targetDate: new Date(raw.endDate).toISOString().slice(0, 10),
    goals,
    activities,
    mentor: raw.mentor
      ? {
          id: raw.mentor.id,
          name: getPersonName(raw.mentor),
          role: raw.mentor.jobTitle?.nameAr || raw.mentor.jobTitle?.name || "مرشد",
          avatar: raw.mentor.avatar || undefined,
          email: raw.mentor.email || "",
        }
      : undefined,
    progress,
    createdBy: raw.employeeId,
    createdAt: new Date(raw.createdAt).toISOString(),
    updatedAt: new Date(raw.updatedAt).toISOString(),
  };
}

function buildDevelopmentPlanPayload(data: Partial<DevelopmentPlanUpsertInput>) {
  const payload: Record<string, unknown> = {};

  if (data.employeeId !== undefined) {
    payload.employeeId = data.employeeId;
  }

  if (data.title !== undefined) {
    payload.title = (data.titleAr || data.title).trim();
    payload.titleAr = data.title.trim() || null;
  }

  if (data.description !== undefined) {
    payload.description = data.description?.trim() || null;
  }

  if (data.type !== undefined) {
    payload.type = mapDevelopmentPlanTypeToApi(data.type);
  }

  if (data.priority !== undefined) {
    payload.priority = mapDevelopmentPlanPriorityToApi(data.priority);
  }

  if (data.startDate !== undefined) {
    payload.startDate = data.startDate;
  }

  if (data.targetDate !== undefined) {
    payload.endDate = data.targetDate;
  }

  if (data.status !== undefined) {
    payload.status = mapDevelopmentPlanStatusToApi(data.status);
  }

  if (data.mentorId !== undefined) {
    payload.mentorId = data.mentorId || null;
  }

  if (data.notes !== undefined) {
    payload.notes = data.notes?.trim() || null;
  }

  if (data.goals !== undefined) {
    payload.objectives = data.goals.map((goal, index) => ({
      id: goal.id || `goal-${index + 1}`,
      title: goal.title,
      description: goal.description,
      targetDate: goal.targetDate,
      status: goal.status,
      progress: goal.progress,
      metrics: goal.metrics,
      isCompleted: goal.status === "completed",
      completedAt: goal.status === "completed" ? goal.completedDate || new Date().toISOString() : null,
    }));
  }

  if (data.activities !== undefined) {
    payload.resources = data.activities.map((activity, index) => ({
      id: activity.id || `resource-${index + 1}`,
      type: activity.type,
      title: activity.title,
      url: activity.courseId,
      dueDate: activity.dueDate,
      completedDate: activity.status === "completed" ? activity.completedDate || new Date().toISOString() : null,
      status: activity.status,
      notes: activity.notes,
      description: activity.description || activity.notes,
    }));
    payload.relatedTrainings = data.activities
      .map((activity) => activity.courseId)
      .filter((value): value is string => Boolean(value));
  }

  return payload;
}

export const developmentPlansApi = {
  /**
   * Get all development plans
   */
  async getAll(filters?: DevelopmentPlanFilters): Promise<ApiResponse<DevelopmentPlanListResponse>> {
    const response = await apiClient.get<{
      plans?: ApiDevelopmentPlan[];
      total?: number;
      page?: number;
      limit?: number;
    }>("/development-plans", {
      params: {
        employeeId: filters?.employeeId,
        status: mapDevelopmentPlanStatusToApi(filters?.status),
        type: mapDevelopmentPlanTypeToApi(filters?.type),
        page: filters?.page,
        limit: filters?.pageSize,
      },
    });

    if (!response.success) {
      return { success: false, error: response.error };
    }

    return {
      success: true,
      data: {
        plans: Array.isArray(response.data?.plans)
          ? response.data.plans.map(mapDevelopmentPlan)
          : [],
        total: Number(response.data?.total ?? 0),
        page: Number(response.data?.page ?? filters?.page ?? 1),
        pageSize: Number(response.data?.limit ?? filters?.pageSize ?? 20),
      },
    };
  },

  /**
   * Get plan by ID
   */
  async getById(id: string): Promise<ApiResponse<DevelopmentPlan>> {
    const response = await apiClient.get<ApiDevelopmentPlan>(`/development-plans/${id}`);
    if (!response.success || !response.data) {
      return { success: false, error: response.error };
    }

    return {
      success: true,
      data: mapDevelopmentPlan(response.data),
    };
  },

  /**
   * Get plan by employee
   */
  async getByEmployee(employeeId: string): Promise<ApiResponse<DevelopmentPlan[]>> {
    const response = await this.getAll({ employeeId });
    if (!response.success || !response.data) {
      return { success: false, error: response.error };
    }

    return {
      success: true,
      data: response.data.plans,
    };
  },

  /**
   * Create plan
   */
  async create(data: DevelopmentPlanUpsertInput): Promise<ApiResponse<DevelopmentPlan>> {
    const response = await apiClient.post<{ plan?: ApiDevelopmentPlan }>(
      "/development-plans",
      buildDevelopmentPlanPayload(data)
    );

    const rawPlan = response.data?.plan;
    if (!response.success || !rawPlan) {
      return { success: false, error: response.error || "فشل إنشاء خطة التطوير" };
    }

    return {
      success: true,
      data: mapDevelopmentPlan(rawPlan),
      message: response.message,
    };
  },

  /**
   * Update plan
   */
  async update(id: string, data: Partial<DevelopmentPlanUpsertInput>): Promise<ApiResponse<DevelopmentPlan>> {
    const response = await apiClient.patch<{ plan?: ApiDevelopmentPlan }>(
      `/development-plans/${id}`,
      buildDevelopmentPlanPayload(data)
    );

    const rawPlan = response.data?.plan;
    if (!response.success || !rawPlan) {
      return { success: false, error: response.error || "فشل تحديث خطة التطوير" };
    }

    return {
      success: true,
      data: mapDevelopmentPlan(rawPlan),
      message: response.message,
    };
  },

  /**
   * Delete plan
   */
  delete: (id: string) => apiClient.delete<void>(`/development-plans/${id}`),

  /**
   * Activate plan
   */
  activate: (id: string) => developmentPlansApi.update(id, { status: "active" }),

  /**
   * Complete plan
   */
  complete: (id: string, notes?: string) =>
    developmentPlansApi.update(id, { status: "completed", notes }),
};

// Unified Training API export
export const trainingApi = {
  courses: trainingCoursesApi,
  enrollments: trainingEnrollmentsApi,
  developmentPlans: developmentPlansApi,
};

export default trainingApi;
