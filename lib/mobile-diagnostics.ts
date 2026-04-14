import { z } from "zod";

import type { MobileDeviceHeaders } from "@/lib/mobile/device";

export type MobileDiagnosticsLocale = "ar" | "en";
export type MobileDiagnosticsAction = "MOBILE_APP_ERROR" | "MOBILE_APP_CRASH";
export type MobileDiagnosticsSeverity = "error" | "fatal";
export type MobileDiagnosticsSource = "global" | "error-boundary" | "startup" | "api";

const mobileDiagnosticsPrimitiveSchema = z.union([
  z.string().max(200),
  z.number(),
  z.boolean(),
  z.null()
]);

const mobileDiagnosticsReportSchema = z
  .object({
    name: z.string().trim().max(160).optional().or(z.literal("")),
    message: z.string().trim().min(1).max(1500),
    source: z.enum(["global", "error-boundary", "startup", "api"]).default("global"),
    severity: z.enum(["error", "fatal"]).default("error"),
    route: z.string().trim().max(200).optional().or(z.literal("")),
    stack: z.string().trim().max(8000).optional().or(z.literal("")),
    componentStack: z.string().trim().max(4000).optional().or(z.literal("")),
    tags: z.record(z.string().trim().max(60), mobileDiagnosticsPrimitiveSchema).optional()
  })
  .transform((value) => ({
    ...value,
    name: value.name?.trim() || undefined,
    route: value.route?.trim() || undefined,
    stack: value.stack?.trim() || undefined,
    componentStack: value.componentStack?.trim() || undefined,
    tags: sanitizeMobileDiagnosticsTags(value.tags)
  }));

export type ParsedMobileDiagnosticsReport = z.infer<typeof mobileDiagnosticsReportSchema>;

export type MobileDiagnosticsAuditLog = {
  id: string;
  action: string;
  tenantId: string | null;
  createdAt: string | Date;
  newData: Record<string, unknown> | null;
  user?: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
};

const MOBILE_DIAGNOSTICS_ACTION_SET = new Set<MobileDiagnosticsAction>([
  "MOBILE_APP_ERROR",
  "MOBILE_APP_CRASH"
]);

const MOBILE_DIAGNOSTICS_SENSITIVE_TAG_PATTERN =
  /(secret|password|token|authorization|credential|api[-_]?key|access[-_]?key|private[-_]?key)/i;

function sanitizeMobileDiagnosticsTags(
  tags?: Record<string, string | number | boolean | null>
): Record<string, string | number | boolean | null> | undefined {
  if (!tags) {
    return undefined;
  }

  const sanitizedEntries = Object.entries(tags).map(([key, value]) => [
    key,
    MOBILE_DIAGNOSTICS_SENSITIVE_TAG_PATTERN.test(key) ? "[redacted]" : value
  ]);

  return sanitizedEntries.length > 0
    ? Object.fromEntries(sanitizedEntries)
    : undefined;
}

function getAuditString(data: Record<string, unknown> | null, key: string) {
  const value = data?.[key];
  return typeof value === "string" && value.trim() ? value : null;
}

function getSeverityLabel(action: string, locale: MobileDiagnosticsLocale) {
  if (action === "MOBILE_APP_CRASH") {
    return locale === "ar" ? "انهيار" : "Crash";
  }

  return locale === "ar" ? "خطأ" : "Error";
}

function getSourceLabel(source: string | null, locale: MobileDiagnosticsLocale) {
  if (source === "error-boundary") {
    return locale === "ar" ? "حدود الخطأ" : "Error boundary";
  }

  if (source === "startup") {
    return locale === "ar" ? "الإقلاع" : "Startup";
  }

  if (source === "api") {
    return locale === "ar" ? "واجهة API" : "API";
  }

  return locale === "ar" ? "معالج عام" : "Global handler";
}

export function parseMobileDiagnosticsReport(input: unknown):
  | { ok: true; data: ParsedMobileDiagnosticsReport }
  | { ok: false; error: string } {
  const parsed = mobileDiagnosticsReportSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      error: "Invalid mobile diagnostics payload"
    };
  }

  return {
    ok: true,
    data: parsed.data
  };
}

export function getMobileDiagnosticsAuditAction(
  severity: MobileDiagnosticsSeverity
): MobileDiagnosticsAction {
  return severity === "fatal" ? "MOBILE_APP_CRASH" : "MOBILE_APP_ERROR";
}

export function isMobileDiagnosticsAuditAction(action: string): action is MobileDiagnosticsAction {
  return MOBILE_DIAGNOSTICS_ACTION_SET.has(action as MobileDiagnosticsAction);
}

export function buildMobileDiagnosticsAuditPayload({
  report,
  device,
  role,
  employeeId
}: {
  report: ParsedMobileDiagnosticsReport;
  device: MobileDeviceHeaders;
  role?: string | null;
  employeeId?: string | null;
}) {
  return {
    severity: report.severity,
    source: report.source,
    name: report.name ?? null,
    message: report.message,
    route: report.route ?? null,
    stack: report.stack ?? null,
    componentStack: report.componentStack ?? null,
    appVersion: device.appVersion ?? null,
    platform: device.platform ?? null,
    deviceId: device.deviceId,
    deviceName: device.name ?? null,
    role: role ?? null,
    employeeId: employeeId ?? null,
    tags: report.tags ?? null,
    fingerprint: `${report.source}:${report.name ?? "Error"}:${report.message}:${report.route ?? "unknown"}`
  };
}

export function buildMobileDiagnosticsSummary({
  logs,
  locale,
  totalEventsLast7Days,
  fatalEventsLast7Days,
  affectedTenantsCount,
  tenantNameById
}: {
  logs: MobileDiagnosticsAuditLog[];
  locale: MobileDiagnosticsLocale;
  totalEventsLast7Days: number;
  fatalEventsLast7Days: number;
  affectedTenantsCount: number;
  tenantNameById: Record<string, string>;
}) {
  const recentEvents = logs.map((entry) => {
    const message =
      getAuditString(entry.newData, "message") ??
      (locale === "ar" ? "خطأ غير موصوف" : "Unspecified error");
    const route = getAuditString(entry.newData, "route");
    const appVersion = getAuditString(entry.newData, "appVersion");
    const platform = getAuditString(entry.newData, "platform");
    const deviceName = getAuditString(entry.newData, "deviceName");
    const source = getAuditString(entry.newData, "source");

    return {
      id: entry.id,
      severityLabel: getSeverityLabel(entry.action, locale),
      sourceLabel: getSourceLabel(source, locale),
      message,
      route,
      appVersion,
      deviceLabel: deviceName ?? platform,
      tenantLabel: entry.tenantId
        ? tenantNameById[entry.tenantId] ?? entry.tenantId
        : locale === "ar"
          ? "بدون شركة مرتبطة"
          : "No tenant linked",
      actorLabel:
        entry.user?.name ||
        entry.user?.email ||
        (locale === "ar" ? "بدون مستخدم مرتبط" : "No linked user"),
      createdAt: typeof entry.createdAt === "string" ? entry.createdAt : entry.createdAt.toISOString()
    };
  });

  return {
    totalEventsLast7Days,
    fatalEventsLast7Days,
    affectedTenantsCount,
    latestAppVersion: recentEvents.find((entry) => entry.appVersion)?.appVersion ?? null,
    recentEvents
  };
}