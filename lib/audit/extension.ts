/**
 * Prisma Audit Extension (Prisma 7+)
 *
 * يستبدل $use (deprecated في Prisma 5+) بنظام $extends
 * يسجل تلقائياً كل CREATE / UPDATE / DELETE على الموديلات الحساسة
 */

import { Prisma } from "@prisma/client";
import { AsyncLocalStorage } from "node:async_hooks";
import { createAuditLog, type AuditAction } from "./logger";

// =============================================
// Async context — يُمرَّر من كل API route
// =============================================

export interface AuditContext {
  tenantId?: string | null;
  userId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

const auditContextStore = new AsyncLocalStorage<AuditContext>();

export function getAuditContext(): AuditContext {
  return auditContextStore.getStore() ?? {};
}

/** اضبط السياق من API route (يُستدعى بالداخل مرة واحدة لكل طلب) */
export function setAuditContext(context: AuditContext) {
  auditContextStore.enterWith({ ...context });
}

/** امسح السياق (اختياري — يُعاد التهيئة تلقائياً مع كل طلب) */
export function clearAuditContext() {
  auditContextStore.enterWith({});
}

// =============================================
// الموديلات المُراقَبة
// =============================================

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
  "DevelopmentPlan",
  "PerformanceGoal",
  "Loan",
  "TrainingEnrollment",
]);

const WRITE_OPS = new Set(["create", "update", "delete", "deleteMany", "updateMany", "createMany"]);

type AuditQueryArgs = Record<string, unknown> & {
  where?: Record<string, unknown> & { id?: string };
};

// =============================================
// تحديد نوع الحدث بناءً على الموديل والعملية
// =============================================

function getAuditAction(model: string, operation: string): AuditAction {
  const op = operation.replace("Many", "").toUpperCase() as "CREATE" | "UPDATE" | "DELETE";

  switch (model) {
    case "User":
      if (op === "CREATE") return "USER_CREATE";
      if (op === "UPDATE") return "USER_UPDATE";
      return "USER_DELETE";

    case "Employee":
      if (op === "CREATE") return "EMPLOYEE_CREATE";
      if (op === "UPDATE") return "EMPLOYEE_UPDATE";
      return "EMPLOYEE_DELETE";

    case "LeaveRequest":
      if (op === "CREATE") return "LEAVE_REQUEST_CREATE";
      if (op === "UPDATE") return "LEAVE_REQUEST_UPDATE";
      return "LEAVE_REQUEST_CANCEL";

    case "AttendanceRecord":
      if (op === "CREATE") return "ATTENDANCE_CHECK_IN";
      if (op === "UPDATE") return "ATTENDANCE_UPDATE";
      return "ATTENDANCE_DELETE";

    case "Department":
      if (op === "CREATE") return "DEPARTMENT_CREATE";
      if (op === "UPDATE") return "DEPARTMENT_UPDATE";
      return "DEPARTMENT_DELETE";

    case "Branch":
      if (op === "CREATE") return "BRANCH_CREATE";
      if (op === "UPDATE") return "BRANCH_UPDATE";
      return "BRANCH_DELETE";

    case "PayrollPeriod":
      if (op === "CREATE") return "PAYROLL_PERIOD_CREATE";
      if (op === "UPDATE") return "PAYROLL_PROCESS";
      return "BULK_DELETE";

    default:
      if (op === "CREATE") return "SYSTEM_CONFIG_CHANGE";
      if (op === "UPDATE") return "BULK_UPDATE";
      return "BULK_DELETE";
  }
}

// =============================================
// تعريف الـ Extension
// =============================================

export function createAuditExtension() {
  return Prisma.defineExtension({
    name: "taqam-audit",
    query: {
      $allModels: {
        async $allOperations(params) {
          const { model, operation } = params;
          const args = (params.args ?? {}) as AuditQueryArgs;

          if (process.env.ENABLE_AUDIT_LOGGING === "false") {
            return params.query(params.args);
          }

          // تجاهل الموديلات غير المُراقَبة أو العمليات القرائية
          if (!model || !AUDITED_MODELS.has(model) || !WRITE_OPS.has(operation)) {
            return params.query(params.args);
          }

          // لـ update/delete — احفظ القيمة القديمة قبل التنفيذ
          let oldData: Record<string, unknown> | null = null;
          if (["update", "delete"].includes(operation) && args.where?.id) {
            try {
              // نستخدم prisma.$transaction للوصول لـ delegate الموديل الحالي
              // لكن داخل extension لا نستطيع الوصول للـ client مباشرة
              // نتجاوز هذا بتسجيل الـ where clause كـ "context"
              oldData = { _where: args.where };
            } catch {
              // تجاهل — not critical
            }
          }

          // نفّذ العملية الأصلية
          const result = await params.query(params.args);

          // سجّل بعد النجاح فقط
          const ctx = getAuditContext();
          const isBulk = ["deleteMany", "updateMany", "createMany"].includes(operation);
          const entityId: string | undefined = isBulk
            ? undefined
            : ((result as Record<string, unknown>)?.id as string) ??
              args.where?.id ??
              undefined;

          // لا تُعطّل العملية بسبب فشل تسجيل الـ audit
          createAuditLog({
            tenantId:
              ctx.tenantId ??
              ((result as Record<string, unknown>)?.tenantId as string) ??
              null,
            userId: ctx.userId ?? null,
            action: getAuditAction(model, operation),
            entity: model,
            entityId: entityId ?? null,
            oldData: null,
            newData:
              operation === "delete" || operation === "deleteMany"
                ? null
                : isBulk
                  ? { count: (result as { count?: number })?.count }
                  : (result as Record<string, unknown>),
            ipAddress: ctx.ipAddress ?? null,
            userAgent: ctx.userAgent ?? null,
          }).catch((err) => {
            console.error("[Audit Extension] Failed to log:", err);
          });

          return result;
        },
      },
    },
  });
}
