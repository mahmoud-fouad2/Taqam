/**
 * Comprehensive Audit Logging System
 * Tracks all critical operations in the system with detailed metadata
 */

import prisma from "@/lib/db";
import type { Prisma } from "@prisma/client";

export type AuditAction =
  // Authentication
  | "LOGIN"
  | "LOGOUT"
  | "LOGIN_FAILED"
  | "PASSWORD_CHANGED"
  | "PASSWORD_RESET"
  | "TOKEN_REFRESH"
  // User Management
  | "USER_CREATE"
  | "USER_UPDATE"
  | "USER_DELETE"
  | "USER_SUSPEND"
  | "USER_ACTIVATE"
  // Employee Management
  | "EMPLOYEE_CREATE"
  | "EMPLOYEE_UPDATE"
  | "EMPLOYEE_DELETE"
  | "EMPLOYEE_BULK_IMPORT"
  | "EMPLOYEE_STATUS_CHANGE"
  // Payroll
  | "PAYROLL_PERIOD_CREATE"
  | "PAYROLL_PROCESS"
  | "PAYROLL_APPROVE"
  | "PAYROLL_REJECT"
  | "PAYROLL_PAID"
  | "PAYSLIP_GENERATE"
  | "PAYSLIP_SEND"
  | "PAYSLIP_VIEW"
  // Leave Management
  | "LEAVE_REQUEST_CREATE"
  | "LEAVE_REQUEST_UPDATE"
  | "LEAVE_REQUEST_APPROVE"
  | "LEAVE_REQUEST_REJECT"
  | "LEAVE_REQUEST_CANCEL"
  | "LEAVE_BALANCE_ADJUST"
  // Attendance
  | "ATTENDANCE_CHECK_IN"
  | "ATTENDANCE_CHECK_OUT"
  | "ATTENDANCE_UPDATE"
  | "ATTENDANCE_DELETE"
  // Organization
  | "DEPARTMENT_CREATE"
  | "DEPARTMENT_UPDATE"
  | "DEPARTMENT_DELETE"
  | "BRANCH_CREATE"
  | "BRANCH_UPDATE"
  | "BRANCH_DELETE"
  // Settings
  | "SETTINGS_UPDATE"
  | "PERMISSION_CHANGE"
  | "ROLE_ASSIGN"
  | "ROLE_REVOKE"
  // Sensitive Operations
  | "DATA_EXPORT"
  | "DATA_IMPORT"
  | "BULK_UPDATE"
  | "BULK_DELETE"
  | "SYSTEM_CONFIG_CHANGE"
  | "MOBILE_APP_ERROR"
  | "MOBILE_APP_CRASH";

export interface AuditLogData {
  tenantId?: string | null;
  userId?: string | null;
  action: AuditAction;
  entity: string;
  entityId?: string | null;
  oldData?: Record<string, any> | null;
  newData?: Record<string, any> | null;
  metadata?: Record<string, any>;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Sanitize sensitive data before logging
 */
function sanitizeData(data: Record<string, any> | null | undefined): Record<string, any> | null {
  if (!data) return null;

  const sanitized = { ...data };
  const sensitiveFields = [
    "password",
    "passwordHash",
    "token",
    "accessToken",
    "refreshToken",
    "secret",
    "apiKey",
    "privateKey",
    "creditCard",
    "ssn",
    "nationalId"
  ];

  for (const key of Object.keys(sanitized)) {
    if (sensitiveFields.some((field) => key.toLowerCase().includes(field.toLowerCase()))) {
      sanitized[key] = "[REDACTED]";
    }
  }

  return sanitized;
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(data: AuditLogData): Promise<void> {
  try {
    const sanitizedOldData = sanitizeData(data.oldData);
    const sanitizedNewData = sanitizeData(data.newData);

    await prisma.auditLog.create({
      data: {
        tenantId: data.tenantId,
        userId: data.userId,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        oldData: sanitizedOldData
          ? (sanitizedOldData as unknown as Prisma.InputJsonValue)
          : undefined,
        newData: sanitizedNewData
          ? (sanitizedNewData as unknown as Prisma.InputJsonValue)
          : undefined,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent
      }
    });
  } catch (error) {
    // Don't let audit logging failure break the main operation
    console.error("Failed to create audit log:", error);
  }
}

/**
 * Helper to extract request metadata
 */
export function getRequestMetadata(request: Request | { headers: Headers }): {
  ipAddress: string | null;
  userAgent: string | null;
} {
  const headers = request.headers;

  // Try to get real IP from various headers (considering proxies)
  const ipAddress =
    headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    headers.get("x-real-ip") ||
    headers.get("cf-connecting-ip") || // Cloudflare
    headers.get("x-client-ip") ||
    null;

  const userAgent = headers.get("user-agent") || null;

  return { ipAddress, userAgent };
}

/**
 * Get audit logs with filters
 */
export interface AuditLogFilters {
  tenantId?: string;
  userId?: string;
  action?: AuditAction | AuditAction[];
  entity?: string;
  entityId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  pageSize?: number;
}

export async function getAuditLogs(filters: AuditLogFilters = {}) {
  const {
    tenantId,
    userId,
    action,
    entity,
    entityId,
    startDate,
    endDate,
    page = 1,
    pageSize = 50
  } = filters;

  const where: Prisma.AuditLogWhereInput = {};

  if (tenantId) where.tenantId = tenantId;
  if (userId) where.userId = userId;
  if (action) {
    where.action = Array.isArray(action) ? { in: action } : action;
  }
  if (entity) where.entity = entity;
  if (entityId) where.entityId = entityId;

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.auditLog.count({ where })
  ]);

  return {
    logs: logs.map((log) => ({
      ...log,
      user: log.user
        ? {
            ...log.user,
            name: `${log.user.firstName ?? ""} ${log.user.lastName ?? ""}`.trim() || null
          }
        : null,
      oldData: log.oldData as Record<string, any> | null,
      newData: log.newData as Record<string, any> | null
    })),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  };
}

/**
 * Get audit log statistics
 */
export async function getAuditLogStats(tenantId?: string) {
  const where: Prisma.AuditLogWhereInput = tenantId ? { tenantId } : {};

  const [total, byAction, byUser, recentActivity] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.groupBy({
      by: ["action"],
      where,
      _count: true,
      orderBy: { _count: { action: "desc" } },
      take: 10
    }),
    prisma.auditLog.groupBy({
      by: ["userId"],
      where: { ...where, userId: { not: null } },
      _count: true,
      orderBy: { _count: { userId: "desc" } },
      take: 10
    }),
    prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 20
    })
  ]);

  return {
    total,
    byAction: byAction.map((item) => ({
      action: item.action,
      count: item._count
    })),
    byUser: await Promise.all(
      byUser.map(async (item) => {
        const user = item.userId
          ? await prisma.user.findUnique({
              where: { id: item.userId },
              select: { id: true, firstName: true, lastName: true, email: true }
            })
          : null;
        return {
          userId: item.userId,
          user: user
            ? {
                ...user,
                name: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || null
              }
            : null,
          count: item._count
        };
      })
    ),
    recentActivity: recentActivity.map((log) => ({
      ...log,
      user: log.user
        ? {
            ...log.user,
            name: `${log.user.firstName ?? ""} ${log.user.lastName ?? ""}`.trim() || null
          }
        : null,
      oldData: log.oldData as Record<string, any> | null,
      newData: log.newData as Record<string, any> | null
    }))
  };
}

/**
 * Utility to compare objects and generate diff
 */
export function generateDiff(
  oldData: Record<string, any> | null,
  newData: Record<string, any> | null
): Record<string, { old: any; new: any }> {
  if (!oldData || !newData) return {};

  const diff: Record<string, { old: any; new: any }> = {};

  // Check for changed/added fields
  for (const key of Object.keys(newData)) {
    if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
      diff[key] = {
        old: oldData[key],
        new: newData[key]
      };
    }
  }

  // Check for removed fields
  for (const key of Object.keys(oldData)) {
    if (!(key in newData)) {
      diff[key] = {
        old: oldData[key],
        new: undefined
      };
    }
  }

  return diff;
}

// No default export (keeps tree-shaking and satisfies lint rules)
