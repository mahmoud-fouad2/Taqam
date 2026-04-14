import { z } from "zod";

import { getIntegrationProvider } from "@/lib/integrations/catalog";

const manualBridgeSyncSchema = z
  .object({
    confirmed: z.literal(true),
    completedSteps: z.array(z.string().trim().min(1).max(80)).default([]),
    referenceId: z.string().trim().max(120).optional().or(z.literal("")),
    note: z.string().trim().max(1000).optional().or(z.literal(""))
  })
  .transform((value) => ({
    confirmed: value.confirmed,
    completedSteps: Array.from(new Set(value.completedSteps)),
    referenceId: value.referenceId?.trim() || undefined,
    note: value.note?.trim() || undefined
  }));

export type ManualBridgeSyncSubmission = z.infer<typeof manualBridgeSyncSchema>;

export function getManualBridgeWorkflow(providerKey: string) {
  return getIntegrationProvider(providerKey)?.manualBridgeWorkflow;
}

export function validateManualBridgeSyncSubmission({
  providerKey,
  input
}: {
  providerKey: string;
  input: unknown;
}):
  | {
      ok: true;
      data: ManualBridgeSyncSubmission;
    }
  | {
      ok: false;
      status: number;
      error: string;
    } {
  const parsed = manualBridgeSyncSchema.safeParse(input ?? {});
  if (!parsed.success) {
    return {
      ok: false,
      status: 400,
      error: "بيانات المزامنة اليدوية غير صالحة"
    };
  }

  const workflow = getManualBridgeWorkflow(providerKey);
  const requiredStepIds = workflow?.steps.map((step) => step.id) ?? [];

  if (!parsed.data.referenceId && !parsed.data.note) {
    return {
      ok: false,
      status: 400,
      error: "أدخل مرجعًا أو ملاحظة واحدة على الأقل لتوثيق المزامنة اليدوية"
    };
  }

  const completedStepIds = new Set(parsed.data.completedSteps);
  const missingSteps = requiredStepIds.filter((stepId) => !completedStepIds.has(stepId));
  if (missingSteps.length > 0) {
    return {
      ok: false,
      status: 400,
      error: "أكمل جميع خطوات الربط اليدوي قبل تسجيل المزامنة"
    };
  }

  return {
    ok: true,
    data: parsed.data
  };
}

export function buildManualBridgeSyncSummary({
  providerKey,
  referenceId
}: {
  providerKey: string;
  referenceId?: string;
}) {
  const provider = getIntegrationProvider(providerKey);
  const providerName = provider?.nameAr ?? providerKey;

  return referenceId
    ? `تم تسجيل المزامنة اليدوية لـ ${providerName} بنجاح (مرجع: ${referenceId})`
    : `تم تسجيل المزامنة اليدوية لـ ${providerName} بنجاح`;
}