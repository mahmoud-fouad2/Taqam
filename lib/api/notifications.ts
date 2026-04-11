/**
 * Notifications Service - API calls for notification management
 */

import { apiClient, ApiResponse } from "./client";
import type { Notification, NotificationType } from "@/lib/types/self-service";

export interface NotificationFilters {
  isRead?: boolean;
  type?: NotificationType;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export interface NotificationListResponse {
  notifications: Notification[];
  total: number;
  unreadCount: number;
  page: number;
  pageSize: number;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  byType: Record<NotificationType, { email: boolean; push: boolean; sms: boolean }>;
}

export const notificationsService = {
  /**
   * Get all notifications with optional filters
   */
  async getAll(filters?: NotificationFilters): Promise<ApiResponse<NotificationListResponse>> {
    return apiClient.get<NotificationListResponse>("/notifications", {
      params: filters as Record<string, string | number | boolean>
    });
  },

  /**
   * Get single notification by ID
   */
  async getById(id: string): Promise<ApiResponse<Notification>> {
    return apiClient.get<Notification>(`/notifications/${id}`);
  },

  /**
   * Get unread count
   */
  async getUnreadCount(): Promise<ApiResponse<{ count: number }>> {
    return apiClient.get<{ count: number }>("/notifications/unread-count");
  },

  /**
   * Mark notification as read
   */
  async markAsRead(id: string): Promise<ApiResponse<void>> {
    return apiClient.patch(`/notifications/${id}/read`, {});
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<ApiResponse<void>> {
    return apiClient.patch("/notifications/read-all", {});
  },

  /**
   * Delete notification
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/notifications/${id}`);
  },

  /**
   * Delete all read notifications
   */
  async deleteAllRead(): Promise<ApiResponse<void>> {
    return apiClient.delete("/notifications/read");
  },

  /**
   * Get notification preferences
   */
  async getPreferences(): Promise<ApiResponse<NotificationPreferences>> {
    return apiClient.get<NotificationPreferences>("/notifications/preferences");
  },

  /**
   * Update notification preferences
   */
  async updatePreferences(
    preferences: Partial<NotificationPreferences>
  ): Promise<ApiResponse<NotificationPreferences>> {
    return apiClient.put<NotificationPreferences>("/notifications/preferences", preferences);
  }
};

export default notificationsService;
