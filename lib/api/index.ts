/**
 * API Services Index - Export all services
 */

export { apiClient } from "./client";
export type { ApiResponse, ApiError, RequestOptions } from "./client";

export { employeesService } from "./employees";
export { departmentsService } from "./departments";
export { jobTitlesService } from "./job-titles";
export { attendanceService } from "./attendance";
export { documentsService } from "./documents";
export { tenantsService } from "./tenants";
export { leavesApi } from "./leaves";
export { performanceApi } from "./performance";
export { notificationsService } from "./notifications";
export { trainingApi } from "./training";

// Re-export recruitment functions
export * from "./recruitment";
