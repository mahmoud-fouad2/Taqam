/**
 * Documents Service - API calls for document management
 */

import apiClient, { ApiResponse } from "./client";
import type { Document, DocumentCategory, DocumentStatus } from "@/lib/types/documents";

export interface DocumentFilters {
  employeeId?: string;
  category?: DocumentCategory;
  status?: DocumentStatus;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface DocumentUploadData {
  file: File;
  employeeId: string;
  category: DocumentCategory;
  title: string;
  titleAr?: string;
  description?: string;
  expiryDate?: string;
  issuedDate?: string;
}

export const documentsService = {
  /**
   * Get all documents with filters
   */
  async getAll(filters?: DocumentFilters): Promise<ApiResponse<Document[]>> {
    return apiClient.get<Document[]>("/documents", {
      params: filters as Record<string, string | number>
    });
  },

  /**
   * Get document by ID
   */
  async getById(id: string): Promise<ApiResponse<Document>> {
    return apiClient.get<Document>(`/documents/${id}`);
  },

  /**
   * Get documents for employee
   */
  async getByEmployee(employeeId: string): Promise<ApiResponse<Document[]>> {
    return apiClient.get<Document[]>(`/employees/${employeeId}/documents`);
  },

  /**
   * Upload new document
   */
  async upload(data: DocumentUploadData): Promise<ApiResponse<Document>> {
    const formData = new FormData();
    formData.append("file", data.file);
    formData.append("employeeId", data.employeeId);
    formData.append("category", data.category);
    formData.append("title", data.title);
    if (data.titleAr) formData.append("titleAr", data.titleAr);
    if (data.description) formData.append("description", data.description);
    if (data.expiryDate) formData.append("expiryDate", data.expiryDate);
    if (data.issuedDate) formData.append("issuedDate", data.issuedDate);

    return apiClient.upload<Document>("/documents", formData);
  },

  /**
   * Update document metadata
   */
  async update(
    id: string,
    data: Partial<Omit<Document, "id" | "url" | "fileName">>
  ): Promise<ApiResponse<Document>> {
    return apiClient.put<Document>(`/documents/${id}`, data);
  },

  /**
   * Delete document
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/documents/${id}`);
  },

  /**
   * Approve document
   */
  async approve(id: string): Promise<ApiResponse<Document>> {
    return apiClient.post<Document>(`/documents/${id}/approve`);
  },

  /**
   * Reject document
   */
  async reject(id: string, reason: string): Promise<ApiResponse<Document>> {
    return apiClient.post<Document>(`/documents/${id}/reject`, { reason });
  },

  /**
   * Download document
   */
  async download(id: string): Promise<ApiResponse<Blob>> {
    return apiClient.get<Blob>(`/documents/${id}/download`, {
      headers: { Accept: "application/octet-stream" }
    });
  },

  /**
   * Get expiring documents
   */
  async getExpiring(days: number = 30): Promise<ApiResponse<Document[]>> {
    return apiClient.get<Document[]>("/documents/expiring", { params: { days } });
  }
};

export default documentsService;
