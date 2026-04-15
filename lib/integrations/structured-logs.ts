import type { IntegrationMode } from "@prisma/client";

export type IntegrationRunLogLevel = "info" | "warn" | "error";
export type IntegrationRunLogCategory = "operation" | "credentials" | "connection" | "retry";

export type IntegrationRunLogEntry = {
  timestamp: string;
  level: IntegrationRunLogLevel;
  category: IntegrationRunLogCategory;
  message: string;
  context?: Record<string, string>;
};

const LOG_LEVELS = new Set<IntegrationRunLogLevel>(["info", "warn", "error"]);
const LOG_CATEGORIES = new Set<IntegrationRunLogCategory>([
  "operation",
  "credentials",
  "connection",
  "retry"
]);
const SENSITIVE_CONTEXT_KEY_PATTERN =
  /(secret|password|token|authorization|credential|api[-_]?key|access[-_]?key|private[-_]?key)/i;

function truncateLogValue(value: string) {
  return value.length > 160 ? `${value.slice(0, 157)}...` : value;
}

function sanitizeLogContextValue(key: string, value: unknown): string | null {
  if (value === undefined) {
    return null;
  }

  if (SENSITIVE_CONTEXT_KEY_PATTERN.test(key)) {
    return "[redacted]";
  }

  if (value === null) {
    return "null";
  }

  if (typeof value === "string") {
    return truncateLogValue(value.trim());
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  try {
    return truncateLogValue(
      JSON.stringify(value, (nestedKey, nestedValue) =>
        nestedKey && SENSITIVE_CONTEXT_KEY_PATTERN.test(nestedKey) ? "[redacted]" : nestedValue
      )
    );
  } catch {
    return "[unserializable]";
  }
}

function sanitizeLogContext(context?: Record<string, unknown>): Record<string, string> | undefined {
  if (!context) {
    return undefined;
  }

  const normalizedEntries = Object.entries(context)
    .map(([key, value]) => [key, sanitizeLogContextValue(key, value)] as const)
    .filter((entry): entry is readonly [string, string] => Boolean(entry[1]));

  if (normalizedEntries.length === 0) {
    return undefined;
  }

  return Object.fromEntries(normalizedEntries);
}

export function createIntegrationRunLogEntry({
  level,
  category,
  message,
  context,
  timestamp = new Date()
}: {
  level: IntegrationRunLogLevel;
  category: IntegrationRunLogCategory;
  message: string;
  context?: Record<string, unknown>;
  timestamp?: Date;
}): IntegrationRunLogEntry {
  const sanitizedContext = sanitizeLogContext(context);

  return {
    timestamp: timestamp.toISOString(),
    level,
    category,
    message,
    ...(sanitizedContext ? { context: sanitizedContext } : {})
  };
}

export function parseIntegrationRunLogs(value: unknown): IntegrationRunLogEntry[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      return [];
    }

    const log = entry as Record<string, unknown>;
    const level = log.level;
    const category = log.category;
    const message = typeof log.message === "string" ? log.message : null;
    const timestamp = typeof log.timestamp === "string" ? log.timestamp : null;

    if (
      !message ||
      !timestamp ||
      !LOG_LEVELS.has(level as IntegrationRunLogLevel) ||
      !LOG_CATEGORIES.has(category as IntegrationRunLogCategory)
    ) {
      return [];
    }

    return [
      {
        timestamp,
        level: level as IntegrationRunLogLevel,
        category: category as IntegrationRunLogCategory,
        message,
        ...(log.context && typeof log.context === "object" && !Array.isArray(log.context)
          ? {
              context: Object.fromEntries(
                Object.entries(log.context as Record<string, unknown>).flatMap(([key, value]) => {
                  if (typeof value !== "string") {
                    return [];
                  }

                  return [[key, value]];
                })
              )
            }
          : {})
      }
    ];
  });
}

export function buildIntegrationTestRunLogs({
  mode,
  runStatus,
  errorMessage,
  retryContext
}: {
  mode: IntegrationMode;
  runStatus: "success" | "failed";
  errorMessage?: string;
  retryContext?: {
    originalRunId: string;
    previousRetryCount: number;
    connectionStatus: string;
  };
}) {
  const logs: IntegrationRunLogEntry[] = [
    createIntegrationRunLogEntry({
      level: "info",
      category: retryContext ? "retry" : "operation",
      message: retryContext ? "بدأت إعادة اختبار الاتصال" : "بدأ اختبار الاتصال",
      context: {
        mode,
        ...(retryContext ?? {})
      }
    })
  ];

  if (mode === "MANUAL_BRIDGE") {
    logs.push(
      createIntegrationRunLogEntry({
        level: "info",
        category: "operation",
        message: retryContext
          ? "تم تجاوز الاتصال الخارجي لأن التكامل يعمل كربط يدوي أثناء الإعادة"
          : "تم تجاوز الاتصال الخارجي لأن التكامل يعمل كربط يدوي"
      })
    );
  } else if (runStatus === "success") {
    logs.push(
      createIntegrationRunLogEntry({
        level: "info",
        category: "credentials",
        message: retryContext
          ? "تم التحقق من بيانات الاعتماد المحفوظة أثناء إعادة المحاولة"
          : "تم التحقق من بيانات الاعتماد المحفوظة"
      })
    );
  } else {
    logs.push(
      createIntegrationRunLogEntry({
        level: "error",
        category: "credentials",
        message: errorMessage ?? "تعذر التحقق من بيانات الاعتماد المحفوظة"
      })
    );
  }

  logs.push(
    createIntegrationRunLogEntry({
      level: runStatus === "success" ? "info" : "error",
      category: "connection",
      message: runStatus === "success" ? "تم اعتماد الاتصال كمتصل" : "تم وسم الاتصال بحالة خطأ",
      context: {
        nextStatus: runStatus === "success" ? "CONNECTED" : "ERROR"
      }
    })
  );

  return logs;
}

export function buildIntegrationSyncRunLogs({
  mode,
  trigger = "manual",
  runStatus = "success",
  errorMessage,
  retryContext,
  awaitingManualAction,
  manualBridgeContext,
  adapterContext
}: {
  mode: IntegrationMode;
  trigger?: "manual" | "retry" | "scheduled";
  runStatus?: "success" | "partial" | "failed";
  errorMessage?: string;
  retryContext?: {
    originalRunId: string;
    previousRetryCount: number;
    connectionStatus: string;
  };
  awaitingManualAction?: boolean;
  manualBridgeContext?: {
    referenceId?: string;
    note?: string;
    completedSteps?: string[];
  };
  adapterContext?: {
    providerKey: string;
    exportType: string;
    periodId: string;
    periodName: string;
    rowCount: number;
    fileName: string;
    downloadPath: string;
  };
}) {
  const logs: IntegrationRunLogEntry[] = [
    createIntegrationRunLogEntry({
      level: retryContext ? "info" : trigger === "scheduled" ? "info" : "info",
      category: retryContext ? "retry" : "operation",
      message: retryContext
        ? "بدأت إعادة المزامنة"
        : trigger === "scheduled"
          ? "بدأت المزامنة المجدولة"
          : "بدأت المزامنة",
      context: {
        mode,
        trigger,
        ...(retryContext ?? {})
      }
    })
  ];

  if (mode === "MANUAL_BRIDGE") {
    if (manualBridgeContext) {
      logs.push(
        createIntegrationRunLogEntry({
          level: "info",
          category: "operation",
          message: retryContext
            ? "تم تسجيل إعادة المزامنة اليدوية دون استدعاء خارجي"
            : "تم تسجيل مزامنة يدوية دون استدعاء خارجي"
        })
      );
    } else if (awaitingManualAction) {
      logs.push(
        createIntegrationRunLogEntry({
          level: "warn",
          category: "operation",
          message: "تم تجهيز ملف التكامل لكن ما زال يتطلب إجراءً يدوياً لاعتماد المزامنة"
        })
      );
    }

    if (manualBridgeContext) {
      logs.push(
        createIntegrationRunLogEntry({
          level: "info",
          category: "operation",
          message: "تم توثيق تنفيذ خطوات الربط اليدوي",
          context: {
            referenceId: manualBridgeContext.referenceId,
            note: manualBridgeContext.note,
            completedSteps: manualBridgeContext.completedSteps?.join(", ")
          }
        })
      );
    }
  } else if (adapterContext) {
    logs.push(
      createIntegrationRunLogEntry({
        level: "info",
        category: "operation",
        message: "تم تنفيذ المزامنة عبر موصل فعلي"
      })
    );
  } else {
    logs.push(
      createIntegrationRunLogEntry({
        level: "warn",
        category: "operation",
        message: retryContext
          ? "تم تنفيذ إعادة المزامنة في وضع المحاكاة حتى تفعيل الـ adapter الحقيقي"
          : "تم تنفيذ المزامنة في وضع المحاكاة حتى تفعيل الـ adapter الحقيقي"
      })
    );
  }

  if (adapterContext) {
    logs.push(
      createIntegrationRunLogEntry({
        level: "info",
        category: "operation",
        message: "تم تجهيز ملف التكامل من بيانات الرواتب الحالية",
        context: {
          providerKey: adapterContext.providerKey,
          exportType: adapterContext.exportType,
          periodId: adapterContext.periodId,
          periodName: adapterContext.periodName,
          rowCount: adapterContext.rowCount,
          fileName: adapterContext.fileName,
          downloadPath: adapterContext.downloadPath
        }
      })
    );
  }

  logs.push(
    createIntegrationRunLogEntry({
      level: runStatus === "failed" ? "error" : runStatus === "partial" ? "warn" : "info",
      category: "connection",
      message:
        runStatus === "failed"
          ? (errorMessage ?? "انتهت المزامنة بفشل")
          : runStatus === "partial"
            ? awaitingManualAction
              ? "اكتملت المهمة جزئياً وتنتظر إتمام الربط اليدوي"
              : "اكتملت المزامنة جزئياً"
            : "تم تحديث آخر وقت مزامنة بنجاح"
    })
  );

  return logs;
}
