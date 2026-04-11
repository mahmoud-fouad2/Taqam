/**
 * Tenants Service - API calls for multi-tenant management
 */

import apiClient, { ApiResponse } from "./client";
import type { Tenant, SubscriptionRequest } from "@/lib/types/tenant";

// Define inline types not in tenant.ts
export interface TenantSettings {
  allowedModules: string[];
  maxEmployees: number;
  maxUsers: number;
  features: Record<string, boolean>;
}

export interface TenantStats {
  employeesCount: number;
  usersCount: number;
  departmentsCount: number;
  lastLoginAt?: string;
}

export interface TenantFilters {
  search?: string;
  status?: string;
  subscriptionPlan?: string;
  page?: number;
  pageSize?: number;
}

export type TenantRequestApprovalInput = {
  slug?: string;
  name?: string;
  nameAr?: string;
  defaultLocale?: "ar" | "en";
  defaultTheme?: "shadcn" | "mantine";
  plan?: "trial" | "starter" | "business" | "enterprise";
  planExpiresAt?: string | null;
  maxEmployees?: number;
};

export const tenantsService = {
  // ============ Tenants CRUD ============

  /**
   * Get all tenants (Super Admin only)
   */
  async getAll(filters?: TenantFilters): Promise<ApiResponse<Tenant[]>> {
    return apiClient.get<Tenant[]>("/admin/tenants", {
      params: filters as Record<string, string | number>
    });
  },

  /**
   * Get tenant by ID
   */
  async getById(id: string): Promise<ApiResponse<Tenant>> {
    return apiClient.get<Tenant>(`/admin/tenants/${id}`);
  },

  /**
   * Create new tenant
   */
  async create(data: Omit<Tenant, "id" | "createdAt" | "stats">): Promise<ApiResponse<Tenant>> {
    return apiClient.post<Tenant>("/admin/tenants", data);
  },

  /**
   * Update tenant
   */
  async update(id: string, data: Partial<Tenant>): Promise<ApiResponse<Tenant>> {
    return apiClient.put<Tenant>(`/admin/tenants/${id}`, data);
  },

  /**
   * Delete tenant
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/admin/tenants/${id}`);
  },

  /**
   * Activate tenant
   */
  async activate(id: string): Promise<ApiResponse<Tenant>> {
    return apiClient.post<Tenant>(`/admin/tenants/${id}/activate`);
  },

  /**
   * Suspend tenant
   */
  async suspend(id: string, reason: string): Promise<ApiResponse<Tenant>> {
    return apiClient.post<Tenant>(`/admin/tenants/${id}/suspend`, { reason });
  },

  /**
   * Get tenant statistics
   */
  async getStats(id: string): Promise<ApiResponse<TenantStats>> {
    return apiClient.get<TenantStats>(`/admin/tenants/${id}/stats`);
  },

  // ============ Tenant Settings ============

  /**
   * Get tenant settings
   */
  async getSettings(id: string): Promise<ApiResponse<TenantSettings>> {
    return apiClient.get<TenantSettings>(`/admin/tenants/${id}/settings`);
  },

  /**
   * Update tenant settings
   */
  async updateSettings(
    id: string,
    settings: Partial<TenantSettings>
  ): Promise<ApiResponse<TenantSettings>> {
    return apiClient.put<TenantSettings>(`/admin/tenants/${id}/settings`, settings);
  },

  // ============ Tenant Requests ============

  /**
   * Get all tenant requests (demo requests)
   */
  async getRequests(filters?: { status?: string }): Promise<ApiResponse<SubscriptionRequest[]>> {
    return apiClient.get<SubscriptionRequest[]>("/admin/tenant-requests", { params: filters });
  },

  /**
   * Get request by ID
   */
  async getRequest(id: string): Promise<ApiResponse<SubscriptionRequest>> {
    return apiClient.get<SubscriptionRequest>(`/admin/tenant-requests/${id}`);
  },

  /**
   * Approve tenant request and create tenant
   */
  async approveRequest(
    id: string,
    tenantData: TenantRequestApprovalInput
  ): Promise<ApiResponse<Tenant>> {
    return apiClient.post<Tenant>(`/admin/tenant-requests/${id}/approve`, tenantData);
  },

  /**
   * Reject tenant request
   */
  async rejectRequest(id: string, reason: string): Promise<ApiResponse<SubscriptionRequest>> {
    return apiClient.post<SubscriptionRequest>(`/admin/tenant-requests/${id}/reject`, { reason });
  },

  // ============ Current Tenant ============

  /**
   * Get current tenant info
   */
  async getCurrent(): Promise<ApiResponse<Tenant>> {
    return apiClient.get<Tenant>("/tenant");
  },

  /**
   * Update current tenant profile
   */
  async updateProfile(data: Partial<Tenant>): Promise<ApiResponse<Tenant>> {
    return apiClient.put<Tenant>("/tenant/profile", data);
  },

  /**
   * Upload tenant logo
   */
  async uploadLogo(file: File): Promise<ApiResponse<{ url: string }>> {
    const formData = new FormData();
    formData.append("logo", file);
    return apiClient.upload<{ url: string }>("/tenant/logo", formData);
  }
};

export default tenantsService;
