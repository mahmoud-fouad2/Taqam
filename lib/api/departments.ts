/**
 * Departments Service - API calls for department management
 */

import apiClient, { ApiResponse } from "./client";
import type { Department, DepartmentCreateInput } from "@/lib/types/core-hr";

type ApiDepartment = {
  id: string;
  tenantId: string;
  name: string;
  nameAr?: string | null;
  code?: string | null;
  description?: string | null;
  parentId?: string | null;
  managerId?: string | null;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    employees?: number;
  };
};

function mapDepartmentFromApi(dept: ApiDepartment): Department {
  return {
    id: dept.id,
    name: dept.name,
    nameAr: dept.nameAr ?? undefined,
    code: dept.code ?? undefined,
    description: dept.description ?? undefined,
    parentId: dept.parentId ?? undefined,
    managerId: dept.managerId ?? undefined,
    employeesCount: dept._count?.employees ?? 0,
    tenantId: dept.tenantId,
    createdAt: dept.createdAt,
    updatedAt: dept.updatedAt
  };
}

export interface DepartmentFilters {
  search?: string;
  page?: number;
  pageSize?: number;
}

export const departmentsService = {
  /**
   * Get all departments
   */
  async getAll(filters?: DepartmentFilters): Promise<ApiResponse<Department[]>> {
    const res = await apiClient.get<ApiDepartment[]>("/departments", {
      params: filters as Record<string, string | number>
    });
    if (!res.success) return res as ApiResponse<Department[]>;
    return { ...res, data: (res.data || []).map(mapDepartmentFromApi) };
  },

  /**
   * Get department by ID
   */
  async getById(id: string): Promise<ApiResponse<Department>> {
    const res = await apiClient.get<ApiDepartment>(`/departments/${id}`);
    if (!res.success) return res as ApiResponse<Department>;
    if (!res.data)
      return { success: false, error: "Department not found" } as ApiResponse<Department>;
    return { ...res, data: mapDepartmentFromApi(res.data) };
  },

  /**
   * Create new department
   */
  async create(data: DepartmentCreateInput): Promise<ApiResponse<Department>> {
    const res = await apiClient.post<ApiDepartment>("/departments", data);
    if (!res.success) return res as ApiResponse<Department>;
    if (!res.data)
      return { success: false, error: "Failed to create department" } as ApiResponse<Department>;
    return { ...res, data: mapDepartmentFromApi(res.data) };
  },

  /**
   * Update department
   */
  async update(id: string, data: Partial<DepartmentCreateInput>): Promise<ApiResponse<Department>> {
    const res = await apiClient.put<ApiDepartment>(`/departments/${id}`, data);
    if (!res.success) return res as ApiResponse<Department>;
    if (!res.data)
      return { success: false, error: "Failed to update department" } as ApiResponse<Department>;
    return { ...res, data: mapDepartmentFromApi(res.data) };
  },

  /**
   * Delete department
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/departments/${id}`);
  },

  /**
   * Get department tree/hierarchy
   */
  async getTree(): Promise<ApiResponse<Department[]>> {
    return apiClient.get<Department[]>("/departments/tree");
  },

  /**
   * Get department stats
   */
  async getStats(id: string): Promise<
    ApiResponse<{
      employeeCount: number;
      avgSalary: number;
      attendanceRate: number;
    }>
  > {
    return apiClient.get(`/departments/${id}/stats`);
  }
};

export default departmentsService;
