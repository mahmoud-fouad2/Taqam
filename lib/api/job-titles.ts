/**
 * Job Titles Service - API calls for job title management
 */

import apiClient, { ApiResponse } from "./client";
import type { JobTitle, JobTitleCreateInput } from "@/lib/types/core-hr";

type ApiJobTitle = {
  id: string;
  tenantId: string;
  name: string;
  nameAr?: string | null;
  code?: string | null;
  description?: string | null;
  level?: number | null;
  minSalary?: string | number | null;
  maxSalary?: string | number | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    employees?: number;
  };
};

function parseDecimal(value?: string | number | null): number | undefined {
  if (value === null || value === undefined) return undefined;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function mapJobTitleFromApi(jt: ApiJobTitle): JobTitle {
  return {
    id: jt.id,
    name: jt.name,
    nameAr: jt.nameAr ?? undefined,
    code: jt.code ?? undefined,
    description: jt.description ?? undefined,
    level: jt.level ?? undefined,
    minSalary: parseDecimal(jt.minSalary),
    maxSalary: parseDecimal(jt.maxSalary),
    employeesCount: jt._count?.employees ?? 0,
    tenantId: jt.tenantId,
    createdAt: jt.createdAt,
    updatedAt: jt.updatedAt
  };
}

export const jobTitlesService = {
  async getAll(): Promise<ApiResponse<JobTitle[]>> {
    const res = await apiClient.get<ApiJobTitle[]>("/job-titles");
    if (!res.success) return res as ApiResponse<JobTitle[]>;
    return { ...res, data: (res.data || []).map(mapJobTitleFromApi) };
  },

  async getById(id: string): Promise<ApiResponse<JobTitle>> {
    const res = await apiClient.get<ApiJobTitle>(`/job-titles/${id}`);
    if (!res.success) return res as ApiResponse<JobTitle>;
    if (!res.data) return { success: false, error: "Job title not found" } as ApiResponse<JobTitle>;
    return { ...res, data: mapJobTitleFromApi(res.data) };
  },

  async create(data: JobTitleCreateInput): Promise<ApiResponse<JobTitle>> {
    const res = await apiClient.post<ApiJobTitle>("/job-titles", data);
    if (!res.success) return res as ApiResponse<JobTitle>;
    if (!res.data)
      return { success: false, error: "Failed to create job title" } as ApiResponse<JobTitle>;
    return { ...res, data: mapJobTitleFromApi(res.data) };
  },

  async update(id: string, data: Partial<JobTitleCreateInput>): Promise<ApiResponse<JobTitle>> {
    const res = await apiClient.put<ApiJobTitle>(`/job-titles/${id}`, data);
    if (!res.success) return res as ApiResponse<JobTitle>;
    if (!res.data)
      return { success: false, error: "Failed to update job title" } as ApiResponse<JobTitle>;
    return { ...res, data: mapJobTitleFromApi(res.data) };
  },

  async delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/job-titles/${id}`);
  }
};

export default jobTitlesService;
