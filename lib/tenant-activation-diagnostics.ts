export type ActivationDiagnosticsLocale = "ar" | "en";

export type TenantActivationAuditLog = {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  oldData: Record<string, unknown> | null;
  newData: Record<string, unknown> | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
};

const ACTIVATION_AUDIT_ACTIONS = new Set([
  "SETUP_STEP_VIEWED",
  "SETUP_STEP_SAVED",
  "SETUP_CHECKLIST_VIEWED",
  "SETUP_DONE_VIEWED",
  "SETUP_COMPLETED",
  "TENANT_ACTIVATED",
  "TENANT_ADMIN_EMPLOYEE_LINKED"
]);

function getAuditString(data: Record<string, unknown> | null, key: string) {
  const value = data?.[key];
  return typeof value === "string" && value.trim() ? value : null;
}

function getAuditNumber(data: Record<string, unknown> | null, key: string) {
  const value = data?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function isTenantActivationAuditAction(action: string) {
  return ACTIVATION_AUDIT_ACTIONS.has(action);
}

export function formatTenantActivationAuditTitle(
  entry: Pick<TenantActivationAuditLog, "action" | "newData">,
  locale: ActivationDiagnosticsLocale
) {
  if (entry.action === "SETUP_STEP_VIEWED") {
    const step =
      getAuditNumber(entry.newData, "currentStep") ?? getAuditNumber(entry.newData, "step");
    return locale === "ar"
      ? `عرض خطوة الإعداد${step ? ` ${step}` : ""}`
      : `Viewed setup step${step ? ` ${step}` : ""}`;
  }

  if (entry.action === "SETUP_STEP_SAVED") {
    const step = getAuditNumber(entry.newData, "step");
    return locale === "ar"
      ? `حفظ خطوة الإعداد${step ? ` ${step}` : ""}`
      : `Saved setup step${step ? ` ${step}` : ""}`;
  }

  if (entry.action === "SETUP_CHECKLIST_VIEWED") {
    return locale === "ar" ? "راجع قائمة الجاهزية" : "Viewed readiness checklist";
  }

  if (entry.action === "SETUP_DONE_VIEWED") {
    return locale === "ar" ? "وصل إلى شاشة الانطلاق" : "Viewed launch screen";
  }

  if (entry.action === "SETUP_COMPLETED") {
    return locale === "ar" ? "أكمل رحلة الإعداد" : "Completed setup flow";
  }

  if (entry.action === "TENANT_ADMIN_EMPLOYEE_LINKED") {
    return locale === "ar"
      ? "تم ربط مدير الشركة بمساحة الموظفين"
      : "Linked tenant admin to employee workspace";
  }

  if (entry.action === "TENANT_ACTIVATED") {
    return locale === "ar" ? "تم تفعيل الشركة" : "Tenant activated";
  }

  return entry.action;
}

export function formatTenantActivationAuditSummary(
  entry: Pick<TenantActivationAuditLog, "action" | "newData">,
  locale: ActivationDiagnosticsLocale
) {
  const completionPercent = getAuditNumber(entry.newData, "completionPercent");
  const stepTitleAr = getAuditString(entry.newData, "stepTitleAr");
  const stepTitleEn = getAuditString(entry.newData, "stepTitleEn");
  const previousStatus = getAuditString(entry.newData, "previousStatus");
  const source = getAuditString(entry.newData, "source");
  const linkAction = getAuditString(entry.newData, "action");
  const completedSteps = Array.isArray(entry.newData?.completedSteps)
    ? entry.newData.completedSteps.length
    : null;

  if (entry.action === "SETUP_STEP_VIEWED" || entry.action === "SETUP_STEP_SAVED") {
    const stepTitle = locale === "ar" ? stepTitleAr : stepTitleEn;
    if (stepTitle && completionPercent !== null) {
      return locale === "ar"
        ? `${stepTitle} • تقدم ${completionPercent}%`
        : `${stepTitle} • ${completionPercent}% progress`;
    }
    if (stepTitle) return stepTitle;
  }

  if (entry.action === "SETUP_CHECKLIST_VIEWED" && completionPercent !== null) {
    return locale === "ar"
      ? `تم الوصول للمراجعة النهائية عند ${completionPercent}%`
      : `Reached final checklist at ${completionPercent}%`;
  }

  if (entry.action === "SETUP_DONE_VIEWED" && completionPercent !== null) {
    return locale === "ar"
      ? `ظهرت شاشة الانطلاق عند ${completionPercent}%`
      : `Launch screen reached at ${completionPercent}%`;
  }

  if (entry.action === "SETUP_COMPLETED") {
    return locale === "ar"
      ? `الخطوات المكتملة: ${completedSteps ?? 0} • التقدم 100%`
      : `Completed steps: ${completedSteps ?? 0} • 100% progress`;
  }

  if (entry.action === "TENANT_ACTIVATED") {
    return locale === "ar"
      ? `الحالة السابقة: ${previousStatus ?? "غير معروفة"}${source ? ` • ${source}` : ""}`
      : `Previous status: ${previousStatus ?? "unknown"}${source ? ` • ${source}` : ""}`;
  }

  if (entry.action === "TENANT_ADMIN_EMPLOYEE_LINKED") {
    return locale === "ar"
      ? `نتيجة الربط: ${linkAction ?? "linked"}${source ? ` • ${source}` : ""}`
      : `Link result: ${linkAction ?? "linked"}${source ? ` • ${source}` : ""}`;
  }

  return source;
}

export function buildTenantActivationDiagnostics({
  auditLogs,
  locale,
  setupStep,
  setupCompletedAt
}: {
  auditLogs: TenantActivationAuditLog[];
  locale: ActivationDiagnosticsLocale;
  setupStep: number;
  setupCompletedAt?: string | null;
}) {
  const activationAuditLogs = auditLogs.filter((entry) =>
    isTenantActivationAuditAction(entry.action)
  );
  const latestActivationProgressEntry = activationAuditLogs.find(
    (entry) => getAuditNumber(entry.newData, "completionPercent") !== null
  );

  return {
    activationAuditLogs,
    activationEventCount: activationAuditLogs.length,
    savedSetupStepCount: activationAuditLogs.filter((entry) => entry.action === "SETUP_STEP_SAVED")
      .length,
    latestActivationEvent: activationAuditLogs[0] ?? null,
    latestActivationProgress: setupCompletedAt
      ? 100
      : (getAuditNumber(latestActivationProgressEntry?.newData ?? null, "completionPercent") ??
        Math.round((setupStep / 5) * 100)),
    timeline: activationAuditLogs.slice(0, 8).map((entry) => ({
      ...entry,
      title: formatTenantActivationAuditTitle(entry, locale),
      summary: formatTenantActivationAuditSummary(entry, locale),
      actorLabel:
        entry.user?.name ||
        entry.user?.email ||
        (locale === "ar" ? "بدون مستخدم مرتبط" : "No linked user")
    }))
  };
}
