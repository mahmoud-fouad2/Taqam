import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { MAX_INTEGRATION_RUN_RETRIES } from "@/lib/integrations/constants";
import { encryptCredentials } from "@/lib/integrations/credentials";
import {
  getIntegrationRetryValidationError,
  resolveIntegrationTestRunResult
} from "@/lib/integrations/run-policy";

const TEST_KEY_BASE64 = Buffer.alloc(32, 0xcd).toString("base64");

describe("resolveIntegrationTestRunResult", () => {
  beforeEach(() => {
    process.env.INTEGRATION_CREDENTIALS_KEY = TEST_KEY_BASE64;
  });

  afterEach(() => {
    delete process.env.INTEGRATION_CREDENTIALS_KEY;
  });

  it("allows manual bridge runs without decrypting credentials", () => {
    const result = resolveIntegrationTestRunResult({
      mode: "MANUAL_BRIDGE",
      credentialsEncrypted: "not-a-real-blob"
    });

    expect(result).toEqual({
      runStatus: "success",
      summary: "الربط اليدوي لا يتطلب اختبار اتصال تلقائي — تم التفعيل"
    });
  });

  it("fails when no encrypted credentials are stored", () => {
    const result = resolveIntegrationTestRunResult({
      mode: "NATIVE_API",
      credentialsEncrypted: null
    });

    expect(result).toEqual({
      runStatus: "failed",
      summary: "لا توجد بيانات اعتماد محفوظة",
      errorMessage: "يرجى حفظ بيانات الاعتماد أولاً"
    });
  });

  it("fails when encrypted credentials cannot be decrypted", () => {
    const result = resolveIntegrationTestRunResult({
      mode: "NATIVE_API",
      credentialsEncrypted: "broken-blob"
    });

    expect(result).toEqual({
      runStatus: "failed",
      summary: "تعذر قراءة بيانات الاعتماد المحفوظة",
      errorMessage: "تحقق من مفتاح التشفير أو أعد حفظ بيانات الاعتماد"
    });
  });

  it("succeeds when encrypted credentials are valid", () => {
    const credentialsEncrypted = encryptCredentials({ apiKey: "secret" });
    const result = resolveIntegrationTestRunResult({
      mode: "EMBEDDED",
      credentialsEncrypted,
      isRetry: true
    });

    expect(result).toEqual({
      runStatus: "success",
      summary: "تم التحقق من بيانات الاعتماد بنجاح (إعادة محاولة)"
    });
  });
});

describe("getIntegrationRetryValidationError", () => {
  it("rejects unsupported operations", () => {
    expect(
      getIntegrationRetryValidationError({
        operation: "push",
        runRecordStatus: "failed",
        retryCount: 0,
        connectionStatus: "CONNECTED"
      })
    ).toEqual({
      status: 422,
      error: "إعادة المحاولة غير مدعومة لعملية: push"
    });
  });

  it("rejects retries for runs that did not fail", () => {
    expect(
      getIntegrationRetryValidationError({
        operation: "test",
        runRecordStatus: "success",
        retryCount: 0,
        connectionStatus: "CONNECTED"
      })
    ).toEqual({
      status: 409,
      error: "لا يمكن إعادة المحاولة إلا للتشغيلات الفاشلة"
    });
  });

  it("rejects retries after the cap is reached", () => {
    expect(
      getIntegrationRetryValidationError({
        operation: "test",
        runRecordStatus: "failed",
        retryCount: MAX_INTEGRATION_RUN_RETRIES,
        connectionStatus: "CONNECTED"
      })
    ).toEqual({
      status: 409,
      error: `تم الوصول إلى الحد الأقصى لإعادات المحاولة (${MAX_INTEGRATION_RUN_RETRIES})`
    });
  });

  it("rejects sync retries for disconnected connections", () => {
    expect(
      getIntegrationRetryValidationError({
        operation: "sync",
        runRecordStatus: "failed",
        retryCount: 1,
        connectionStatus: "DISCONNECTED"
      })
    ).toEqual({
      status: 409,
      error: "لا يمكن إعادة مزامنة تكامل غير مربوط"
    });
  });

  it("allows failed retryable runs within the cap", () => {
    expect(
      getIntegrationRetryValidationError({
        operation: "sync",
        runRecordStatus: "failed",
        retryCount: MAX_INTEGRATION_RUN_RETRIES - 1,
        connectionStatus: "ERROR"
      })
    ).toBeNull();
  });
});