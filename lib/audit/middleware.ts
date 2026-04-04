/**
 * Prisma Audit — re-exports from extension.ts for backward compatibility.
 * The actual implementation has moved to extension.ts (uses $extends, not $use).
 *
 * @deprecated import directly from "./extension" in new code.
 */

import {
  setAuditContext,
  clearAuditContext,
  getAuditContext,
  createAuditExtension,
  type AuditContext,
} from "./extension";

export {
  setAuditContext,
  clearAuditContext,
  getAuditContext,
  createAuditExtension,
  type AuditContext,
};

// ─── legacy stubs kept only to prevent import errors in untouched files ───────

import type { PrismaClient } from "@prisma/client";
import { createAuditLog, type AuditAction } from "./logger";

// Map Prisma operations to audit actions
const OPERATION_MAP: Record<string, AuditAction> = {
  create: "EMPLOYEE_CREATE", // Default, will be overridden per model
  update: "EMPLOYEE_UPDATE",
  delete: "EMPLOYEE_DELETE",
  deleteMany: "BULK_DELETE",
  updateMany: "BULK_UPDATE", // Treat as sensitive
};

// Models to audit (exclude sensitive models like Session, Token)
const AUDITED_MODELS = new Set([
  "User",
  "Employee",
  "Department",
  "JobTitle",
  "Branch",
  "LeaveRequest",
  "AttendanceRecord",
  "PayrollPeriod",
  "PayrollPayslip",
  "Document",
  "Announcement",
]);

// Get specific action based on model and operation
function getAuditAction(model: string, operation: string): AuditAction {
  const modelUpper = model.toUpperCase();
  const opBase = operation.replace("Many", "").toUpperCase();

  // Handle specific models
  if (model === "User") {
    if (operation === "create") return "USER_CREATE";
    if (operation === "update") return "USER_UPDATE";
    if (operation === "delete") return "USER_DELETE";
  }

  if (model === "Employee") {
    if (operation === "create") return "EMPLOYEE_CREATE";
    if (operation === "update") return "EMPLOYEE_UPDATE";
    if (operation === "delete") return "EMPLOYEE_DELETE";
  }

  if (model === "LeaveRequest") {
    if (operation === "create") return "LEAVE_REQUEST_CREATE";
    if (operation === "update") return "LEAVE_REQUEST_UPDATE";
    if (operation === "delete") return "LEAVE_REQUEST_CANCEL";
  }

  if (model === "AttendanceRecord") {
    if (operation === "create") return "ATTENDANCE_CHECK_IN";
    if (operation === "update") return "ATTENDANCE_UPDATE";
    if (operation === "delete") return "ATTENDANCE_DELETE";
  }

  if (model === "Department") {
    if (operation === "create") return "DEPARTMENT_CREATE";
    if (operation === "update") return "DEPARTMENT_UPDATE";
    if (operation === "delete") return "DEPARTMENT_DELETE";
  }

  if (model === "Branch") {
    if (operation === "create") return "BRANCH_CREATE";
    if (operation === "update") return "BRANCH_UPDATE";
    if (operation === "delete") return "BRANCH_DELETE";
  }

  if (model === "PayrollPeriod") {
    if (operation === "create") return "PAYROLL_PERIOD_CREATE";
    if (operation === "update") return "PAYROLL_PROCESS";
    if (operation === "delete") return "BULK_DELETE";
  }

  // Default fallback
  return (OPERATION_MAP[operation] || "SYSTEM_CONFIG_CHANGE") as AuditAction;
}

function getModelDelegate(prismaClient: PrismaClient, model: string): any {
  // PrismaClient uses lowerCamelCase model delegates (e.g., Employee -> employee)
  const key = model ? model.charAt(0).toLowerCase() + model.slice(1) : model;
  return (prismaClient as any)[key];
}

/**
 * Prisma middleware for automatic audit logging
 */
export function createAuditMiddleware(prismaClient: PrismaClient) {
  return async (
    params: { model?: string; action: string; args?: any },
    next: (params: { model?: string; action: string; args?: any }) => Promise<any>
  ) => {
    const { model, action } = params;

    // Skip if no model or not in audited list
    if (!model || !AUDITED_MODELS.has(model)) {
      return next(params);
    }

    // Only audit write operations
    const isWrite = ["create", "update", "delete", "deleteMany", "updateMany"].includes(action);
    if (!isWrite) {
      return next(params);
    }

    // For updates/deletes, get old data first
    let oldData: any = null;
    if (["update", "delete"].includes(action) && params.args?.where) {
      try {
        const delegate = getModelDelegate(prismaClient, model);
        if (delegate?.findUnique) {
          oldData = await delegate.findUnique({ where: params.args.where });
        }
      } catch {
        // If lookup fails (non-unique where, etc.), skip old data
      }
    }

    // Execute the actual operation
    const result = await next(params);

    // Log after successful operation
    const ctx = getAuditContext();
    const isBulk = action === "deleteMany" || action === "updateMany";

    const entityId =
      (!isBulk && (result as any)?.id) ||
      (!isBulk && params.args?.where?.id) ||
      (!isBulk && params.args?.data?.id) ||
      undefined;

    const auditAction = getAuditAction(model, action);

    // Prefer persisted state for newData (result) to capture defaults
    const newData =
      action === "delete"
        ? undefined
        : isBulk
          ? ({
              where: params.args?.where,
              data: action === "updateMany" ? params.args?.data : undefined,
              count: (result as any)?.count,
            } as any)
          : (result as any);

    // Don't await audit log to avoid slowing down operations
    createAuditLog({
      tenantId: ctx.tenantId || (result as any)?.tenantId || oldData?.tenantId,
      userId: ctx.userId,
      action: auditAction,
      entity: model,
      entityId,
      oldData: oldData || undefined,
      newData,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    }).catch((err) => {
      console.error("Audit middleware error:", err);
    });

    return result;
  };
}

export default createAuditMiddleware;
