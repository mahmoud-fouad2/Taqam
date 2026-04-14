import type { IntegrationMode, IntegrationStatus } from "@prisma/client";

import { MAX_INTEGRATION_RUN_RETRIES } from "@/lib/integrations/constants";
import { decryptCredentials } from "@/lib/integrations/credentials";

type IntegrationExecutionResult = {
  runStatus: "success" | "failed";
  summary: string;
  errorMessage?: string;
};

export function resolveIntegrationTestRunResult({
  mode,
  credentialsEncrypted,
  isRetry = false
}: {
  mode: IntegrationMode;
  credentialsEncrypted: string | null;
  isRetry?: boolean;
}): IntegrationExecutionResult {
  if (mode === "MANUAL_BRIDGE") {
    return {
      runStatus: "success",
      summary: "الربط اليدوي لا يتطلب اختبار اتصال تلقائي — تم التفعيل"
    };
  }

  if (!credentialsEncrypted) {
    return {
      runStatus: "failed",
      summary: "لا توجد بيانات اعتماد محفوظة",
      errorMessage: "يرجى حفظ بيانات الاعتماد أولاً"
    };
  }

  const credentials = decryptCredentials(credentialsEncrypted);
  if (!credentials) {
    return {
      runStatus: "failed",
      summary: "تعذر قراءة بيانات الاعتماد المحفوظة",
      errorMessage: "تحقق من مفتاح التشفير أو أعد حفظ بيانات الاعتماد"
    };
  }

  return {
    runStatus: "success",
    summary: isRetry
      ? "تم التحقق من بيانات الاعتماد بنجاح (إعادة محاولة)"
      : "تم التحقق من بيانات الاعتماد بنجاح (اختبار أساسي)"
  };
}

export function isRetryableIntegrationOperation(operation: string) {
  return operation === "test" || operation === "sync";
}

export function getIntegrationRetryValidationError({
  operation,
  runRecordStatus,
  retryCount,
  connectionStatus
}: {
  operation: string;
  runRecordStatus: string;
  retryCount: number;
  connectionStatus: IntegrationStatus;
}): { status: number; error: string } | null {
  if (!isRetryableIntegrationOperation(operation)) {
    return {
      status: 422,
      error: `إعادة المحاولة غير مدعومة لعملية: ${operation}`
    };
  }

  if (runRecordStatus !== "failed") {
    return {
      status: 409,
      error: "لا يمكن إعادة المحاولة إلا للتشغيلات الفاشلة"
    };
  }

  if (retryCount >= MAX_INTEGRATION_RUN_RETRIES) {
    return {
      status: 409,
      error: `تم الوصول إلى الحد الأقصى لإعادات المحاولة (${MAX_INTEGRATION_RUN_RETRIES})`
    };
  }

  if (operation === "sync" && connectionStatus === "DISCONNECTED") {
    return {
      status: 409,
      error: "لا يمكن إعادة مزامنة تكامل غير مربوط"
    };
  }

  return null;
}