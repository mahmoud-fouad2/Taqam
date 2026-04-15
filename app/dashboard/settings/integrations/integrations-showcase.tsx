"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  Wifi,
  WifiOff,
  ExternalLink,
  Sparkles,
  Building2,
  FlaskConical,
  Settings2,
  KeyRound,
  History,
  Eye,
  EyeOff,
  Loader2,
  RefreshCw,
  RotateCcw,
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MAX_INTEGRATION_RUN_RETRIES } from "@/lib/integrations/constants";
import {
  getIntegrationApiErrorMessage,
  parseIntegrationConnectionTestResponse,
  parseIntegrationRetryResponse,
  parseIntegrationSyncResponse,
  type IntegrationConnectionSnapshot,
  type IntegrationConnectionTestResponse,
  type IntegrationRunRecord as RunRecord
} from "@/lib/integrations/contracts";
import type { IntegrationRunLogEntry } from "@/lib/integrations/structured-logs";
import {
  buildIntegrationConnectionConfigWithSchedule,
  getIntegrationSyncSchedule,
  getIntegrationSyncScheduleLabelAr,
  getNextIntegrationSyncDueAt,
  type IntegrationConnectionConfig,
  type IntegrationSyncScheduleFrequency
} from "@/lib/integrations/sync-schedule";
import { cn } from "@/lib/utils";
import type {
  IntegrationProviderDef,
  CredentialField,
  ManualBridgeWorkflowDef
} from "@/lib/integrations/catalog";

type CatalogEntry = IntegrationProviderDef & {
  connection: IntegrationConnectionSnapshot | null;
  supportsScheduledSync: boolean;
};

type Props = {
  catalog: CatalogEntry[];
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  if (status === "CONNECTED")
    return (
      <Badge
        variant="outline"
        className="gap-1 border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400">
        <CheckCircle2 className="h-3 w-3" />
        متصل
      </Badge>
    );
  if (status === "PENDING")
    return (
      <Badge
        variant="outline"
        className="gap-1 border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
        <Clock className="h-3 w-3" />
        في المعالجة
      </Badge>
    );
  if (status === "ERROR" || status === "DEGRADED")
    return (
      <Badge
        variant="outline"
        className="gap-1 border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400">
        <AlertCircle className="h-3 w-3" />
        خطأ
      </Badge>
    );
  return (
    <Badge variant="outline" className="text-muted-foreground gap-1">
      <WifiOff className="h-3 w-3" />
      غير متصل
    </Badge>
  );
}

function AvailabilityBadge({ availability }: { availability: string }) {
  if (availability === "live")
    return (
      <Badge className="bg-primary/10 text-primary border-primary/20 gap-1 text-[10px]">
        <Wifi className="h-2.5 w-2.5" />
        متاح
      </Badge>
    );
  if (availability === "enterprise-custom")
    return (
      <Badge variant="outline" className="text-muted-foreground gap-1 text-[10px]">
        <Building2 className="h-2.5 w-2.5" />
        Enterprise
      </Badge>
    );
  return (
    <Badge variant="outline" className="text-muted-foreground gap-1 text-[10px]">
      <Sparkles className="h-2.5 w-2.5" />
      قريباً
    </Badge>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  "payroll-compliance": "الامتثال والرواتب",
  government: "الجهات الحكومية",
  "finance-erp": "المالية وأنظمة ERP",
  productivity: "الإنتاجية والتواصل",
  communication: "التواصل"
};

export function IntegrationsShowcase({ catalog }: Props) {
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const categories = ["all", ...Array.from(new Set(catalog.map((e) => e.category)))];

  const filtered =
    activeCategory === "all" ? catalog : catalog.filter((e) => e.category === activeCategory);

  // Health summary counts
  const connected = catalog.filter((e) => e.connection?.status === "CONNECTED").length;
  const pending = catalog.filter((e) => e.connection?.status === "PENDING").length;
  const errors = catalog.filter(
    (e) => e.connection?.status === "ERROR" || e.connection?.status === "DEGRADED"
  ).length;
  const anyConnected = connected + pending + errors > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight">التكاملات</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          اربط طاقم مع الأنظمة التي تستخدمها يومياً لتوحيد بيانات فريقك
        </p>
      </div>

      {/* Health summary — only shown when at least one connection exists */}
      {anyConnected && (
        <div className="bg-card flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3 text-sm shadow-sm">
          <Activity className="text-muted-foreground h-4 w-4 shrink-0" />
          <span className="text-muted-foreground text-xs font-medium">حالة التكاملات:</span>
          {connected > 0 && (
            <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {connected} متصل
            </span>
          )}
          {pending > 0 && (
            <span className="flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
              <Clock className="h-3.5 w-3.5" />
              {pending} جارٍ
            </span>
          )}
          {errors > 0 && (
            <span className="flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400">
              <AlertCircle className="h-3.5 w-3.5" />
              {errors} {errors === 1 ? "خطأ" : "أخطاء"}
            </span>
          )}
        </div>
      )}

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              cat === activeCategory
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
            )}>
            {cat === "all" ? "الكل" : (CATEGORY_LABELS[cat] ?? cat)}
          </button>
        ))}
      </div>

      {/* Cards grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((entry) => (
          <IntegrationCard key={entry.key} entry={entry} />
        ))}
      </div>
    </div>
  );
}

// ── Integration Config Dialog ─────────────────────────────────────────────────

const OPERATION_LABELS: Record<string, string> = {
  test: "اختبار",
  sync: "مزامنة",
  push: "إرسال",
  "health-check": "فحص صحة"
};

const RUN_STATUS_LABELS: Record<string, { label: string; className: string }> = {
  success: { label: "ناجح", className: "text-emerald-600 dark:text-emerald-400" },
  failed: { label: "فشل", className: "text-red-600 dark:text-red-400" },
  running: { label: "جارٍ", className: "text-amber-600 dark:text-amber-400" },
  partial: { label: "جزئي", className: "text-amber-600 dark:text-amber-400" }
};

const SCHEDULE_OUTCOME_LABELS: Record<string, string> = {
  success: "ناجح",
  partial: "جزئي",
  failed: "فشل"
};

const LOG_LEVEL_LABELS: Record<IntegrationRunLogEntry["level"], string> = {
  info: "معلومة",
  warn: "تنبيه",
  error: "خطأ"
};

function logLevelClassName(level: IntegrationRunLogEntry["level"]) {
  if (level === "info") {
    return "rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[11px] font-medium text-sky-700 dark:text-sky-400";
  }

  if (level === "warn") {
    return "rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-400";
  }

  return "rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[11px] font-medium text-red-700 dark:text-red-400";
}

function MaskedField({ value }: { value: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative flex items-center gap-2">
      <Input
        readOnly
        value={visible ? value : "•".repeat(Math.min(value.length, 20))}
        className="bg-muted/50 pr-9 font-mono text-sm"
        dir="ltr"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="text-muted-foreground hover:text-foreground absolute left-2 transition-colors">
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

type ConfigDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providerKey: string;
  nameAr: string;
  mode: string;
  config: IntegrationConnectionConfig | null;
  supportsScheduledSync: boolean;
  lastConnectedAt: string | null;
  lastSyncAt: string | null;
  credentialFields?: CredentialField[];
  hasCredentials: boolean;
  runs: RunRecord[];
  onSaved: () => void;
};

function IntegrationConfigDialog({
  open,
  onOpenChange,
  providerKey,
  nameAr,
  mode,
  config,
  supportsScheduledSync,
  lastConnectedAt,
  lastSyncAt,
  credentialFields,
  hasCredentials,
  runs,
  onSaved
}: ConfigDialogProps) {
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedOk, setSavedOk] = useState(false);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [scheduleSavedOk, setScheduleSavedOk] = useState(false);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduleFrequency, setScheduleFrequency] =
    useState<IntegrationSyncScheduleFrequency>("weekly");
  const [retryingRunId, setRetryingRunId] = useState<string | null>(null);
  const [localRuns, setLocalRuns] = useState<RunRecord[]>(runs);

  useEffect(() => {
    setLocalRuns(runs);

    const currentSchedule = getIntegrationSyncSchedule(config);
    setScheduleEnabled(Boolean(currentSchedule?.enabled));
    setScheduleFrequency(currentSchedule?.frequency ?? "weekly");
    setScheduleError(null);
    setScheduleSavedOk(false);
  }, [config, runs]);

  async function handleSaveCredentials(e: React.FormEvent) {
    e.preventDefault();
    setSaveError(null);
    setSavedOk(false);
    // Validate required fields
    const missing = (credentialFields ?? []).filter(
      (f) => f.required && !fieldValues[f.key]?.trim()
    );
    if (missing.length > 0) {
      setSaveError(`يرجى ملء الحقول المطلوبة: ${missing.map((f) => f.labelAr).join("، ")}`);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/integrations/${providerKey}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credentials: fieldValues })
      });
      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        setSaveError(json.error ?? "حدث خطأ أثناء الحفظ");
        return;
      }
      setSavedOk(true);
      setFieldValues({});
      onSaved();
    } catch {
      setSaveError("تعذّر الوصول للخادم");
    } finally {
      setSaving(false);
    }
  }

  async function handleRetry(runId: string) {
    setRetryingRunId(runId);
    try {
      const res = await fetch(`/api/integrations/${providerKey}/runs/${runId}/retry`, {
        method: "POST"
      });
      const json = await res.json().catch(() => null);
      const parsed = parseIntegrationRetryResponse(json);

      if (!parsed.success || !parsed.data.runId) {
        toast.error(getIntegrationApiErrorMessage(json, "تعذر تنفيذ إعادة المحاولة"));
        return;
      }

      const retryResponse = parsed.data;
      const retryRunId = retryResponse.runId;

      if (!retryRunId) {
        toast.error("تعذر تنفيذ إعادة المحاولة");
        return;
      }

      const previousRun = localRuns.find((run) => run.id === runId);
      const nowIso = new Date().toISOString();
      const newRun: RunRecord = {
        id: retryRunId,
        operation: previousRun?.operation ?? "test",
        status: retryResponse.runStatus ?? (retryResponse.ok ? "success" : "failed"),
        summary: retryResponse.summary ?? null,
        errorMessage: retryResponse.ok
          ? null
          : (retryResponse.error ?? retryResponse.summary ?? null),
        logs: retryResponse.logs ?? [],
        durationMs: typeof retryResponse.durationMs === "number" ? retryResponse.durationMs : null,
        retryCount:
          typeof retryResponse.retryCount === "number"
            ? retryResponse.retryCount
            : (previousRun?.retryCount ?? 0) + 1,
        startedAt: nowIso,
        finishedAt: nowIso
      };

      setLocalRuns((prev) => [newRun, ...prev].slice(0, 10));
      toast[retryResponse.ok ? "success" : "error"](
        retryResponse.summary ??
          (retryResponse.ok ? "تمت إعادة المحاولة بنجاح" : "فشلت إعادة المحاولة")
      );
    } catch {
      toast.error("تعذّر الوصول للخادم أثناء إعادة المحاولة");
    } finally {
      setRetryingRunId(null);
    }
  }

  async function handleSaveSchedule(event: React.FormEvent) {
    event.preventDefault();
    setScheduleError(null);
    setScheduleSavedOk(false);
    setScheduleSaving(true);

    try {
      const nextConfig = buildIntegrationConnectionConfigWithSchedule(config, {
        enabled: scheduleEnabled,
        frequency: scheduleFrequency
      });
      const res = await fetch(`/api/integrations/${providerKey}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: nextConfig })
      });
      const json = (await res.json().catch(() => null)) as { error?: string } | null;

      if (!res.ok) {
        setScheduleError(json?.error ?? "تعذر حفظ إعدادات الجدولة");
        return;
      }

      setScheduleSavedOk(true);
      onSaved();
    } catch {
      setScheduleError("تعذّر الوصول للخادم أثناء حفظ الجدولة");
    } finally {
      setScheduleSaving(false);
    }
  }

  const hasFields = (credentialFields?.length ?? 0) > 0;
  const currentSchedule = getIntegrationSyncSchedule(config);
  const nextDueAt = getNextIntegrationSyncDueAt({
    config,
    createdAt: currentSchedule?.enabledAt ?? new Date().toISOString(),
    lastConnectedAt,
    lastSyncAt
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">{nameAr}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue={hasFields ? "credentials" : "history"} className="mt-2">
          <TabsList className="w-full">
            {hasFields && (
              <TabsTrigger value="credentials" className="flex-1 gap-1.5 text-xs">
                <KeyRound className="h-3.5 w-3.5" />
                بيانات الاعتماد
              </TabsTrigger>
            )}
            <TabsTrigger value="history" className="flex-1 gap-1.5 text-xs">
              <History className="h-3.5 w-3.5" />
              سجل الأنشطة
            </TabsTrigger>
            {supportsScheduledSync && (
              <TabsTrigger value="schedule" className="flex-1 gap-1.5 text-xs">
                <Clock className="h-3.5 w-3.5" />
                الجدولة
              </TabsTrigger>
            )}
          </TabsList>

          {/* ── Credentials tab ── */}
          {hasFields && (
            <TabsContent value="credentials" className="mt-4 space-y-4">
              {hasCredentials && (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  بيانات الاعتماد محفوظة ومشفّرة. أدخل قيماً جديدة أدناه للاستبدال.
                </div>
              )}
              <form onSubmit={handleSaveCredentials} className="space-y-4">
                {credentialFields!.map((field) => (
                  <div key={field.key} className="space-y-1.5">
                    <Label className="text-xs font-medium">
                      {field.labelAr}
                      {field.required && <span className="mr-1 text-red-500">*</span>}
                    </Label>
                    {field.type === "password" ? (
                      <MaskedField value={fieldValues[field.key] ?? ""} />
                    ) : (
                      <Input
                        type={field.type === "url" ? "url" : "text"}
                        value={fieldValues[field.key] ?? ""}
                        onChange={(e) =>
                          setFieldValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                        }
                        placeholder={field.hint}
                        className="text-sm"
                        dir="ltr"
                      />
                    )}
                    {field.hint && field.type !== "password" && (
                      <p className="text-muted-foreground text-xs">{field.hint}</p>
                    )}
                  </div>
                ))}

                {saveError && (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-950/30 dark:text-red-400">
                    {saveError}
                  </p>
                )}
                {savedOk && (
                  <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
                    تم الحفظ بنجاح ✓
                  </p>
                )}

                <DialogFooter>
                  <Button type="submit" size="sm" disabled={saving} className="gap-1.5">
                    {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    حفظ البيانات
                  </Button>
                </DialogFooter>
              </form>
            </TabsContent>
          )}

          {/* ── Run history tab ── */}
          <TabsContent value="history" className="mt-4">
            {localRuns.length === 0 ? (
              <div className="text-muted-foreground py-10 text-center text-sm">
                لا توجد أنشطة مسجّلة بعد
              </div>
            ) : (
              <div className="divide-border divide-y rounded-lg border text-xs">
                {localRuns.map((run) => {
                  const runStatus = RUN_STATUS_LABELS[run.status] ?? {
                    label: run.status,
                    className: "text-muted-foreground"
                  };
                  const canRetry =
                    run.status === "failed" &&
                    (run.operation === "test" || run.operation === "sync") &&
                    run.retryCount < MAX_INTEGRATION_RUN_RETRIES;
                  return (
                    <div key={run.id} className="flex items-start gap-3 px-4 py-3">
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">
                            {OPERATION_LABELS[run.operation] ?? run.operation}
                          </span>
                          <span className={cn("font-medium", runStatus.className)}>
                            {runStatus.label}
                          </span>
                          {run.durationMs !== null && (
                            <span className="text-muted-foreground">{run.durationMs}ms</span>
                          )}
                          {canRetry && (
                            <button
                              type="button"
                              onClick={() => handleRetry(run.id)}
                              disabled={retryingRunId === run.id}
                              className="text-primary flex items-center gap-1 hover:underline disabled:opacity-60">
                              {retryingRunId === run.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <RotateCcw className="h-3 w-3" />
                              )}
                              إعادة
                            </button>
                          )}
                        </div>
                        {run.summary && (
                          <p className="text-muted-foreground leading-relaxed">{run.summary}</p>
                        )}
                        {run.errorMessage && (
                          <p className="text-red-600 dark:text-red-400">{run.errorMessage}</p>
                        )}
                        {run.logs.length > 0 && (
                          <details className="bg-muted/20 mt-2 rounded-lg border px-3 py-2">
                            <summary className="text-muted-foreground cursor-pointer list-none font-medium">
                              تفاصيل السجل
                            </summary>
                            <div className="mt-2 space-y-2">
                              {run.logs.map((log, index) => (
                                <div
                                  key={`${run.id}-${index}`}
                                  className="bg-background rounded-md px-3 py-2">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className={logLevelClassName(log.level)}>
                                      {LOG_LEVEL_LABELS[log.level]}
                                    </span>
                                    <span className="text-muted-foreground">{log.message}</span>
                                  </div>
                                  {log.context && Object.keys(log.context).length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                      {Object.entries(log.context).map(([key, value]) =>
                                        key === "downloadPath" && value.startsWith("/") ? (
                                          <a
                                            key={`${run.id}-${index}-${key}`}
                                            href={value}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="bg-muted text-primary rounded-md px-2 py-1 font-mono text-[11px] underline-offset-4 hover:underline">
                                            تنزيل الملف
                                          </a>
                                        ) : (
                                          <span
                                            key={`${run.id}-${index}-${key}`}
                                            className="bg-muted text-muted-foreground rounded-md px-2 py-1 font-mono text-[11px]">
                                            {key}: {value}
                                          </span>
                                        )
                                      )}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </details>
                        )}
                      </div>
                      <div className="text-muted-foreground shrink-0 whitespace-nowrap" dir="ltr">
                        {new Date(run.startedAt).toLocaleDateString("ar-SA", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {supportsScheduledSync && (
            <TabsContent value="schedule" className="mt-4 space-y-4">
              <div className="bg-muted/20 text-muted-foreground rounded-xl border p-4 text-sm leading-6">
                <p className="text-foreground font-medium">تشغيل مزامنة مجدولة</p>
                <p>
                  {mode === "MANUAL_BRIDGE"
                    ? "الجدولة هنا تجهز ملف التكامل تلقائياً وتترك العملية بوضع جزئي حتى يتم الإرسال اليدوي وتوثيقه."
                    : "سيتم تشغيل المزامنة تلقائياً وفق التكرار المحدد عندما يكون التكامل في حالة متصل."}
                </p>
              </div>

              <form onSubmit={handleSaveSchedule} className="space-y-4">
                <label className="flex cursor-pointer items-start gap-2 rounded-xl border px-4 py-3">
                  <Checkbox
                    checked={scheduleEnabled}
                    onCheckedChange={(checked) => setScheduleEnabled(checked === true)}
                    className="mt-0.5"
                  />
                  <span className="text-sm leading-6">تفعيل مزامنة مجدولة لهذا التكامل</span>
                </label>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">التكرار</Label>
                  <Select
                    value={scheduleFrequency}
                    onValueChange={(value) =>
                      setScheduleFrequency(value as IntegrationSyncScheduleFrequency)
                    }>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="اختر التكرار" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">يومي</SelectItem>
                      <SelectItem value="weekly">أسبوعي</SelectItem>
                      <SelectItem value="monthly">شهري</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {currentSchedule && (
                  <div className="bg-background text-muted-foreground space-y-1.5 rounded-xl border px-4 py-3 text-xs">
                    <p>
                      الحالة الحالية: {currentSchedule.enabled ? "مفعلة" : "متوقفة"} (
                      {getIntegrationSyncScheduleLabelAr(currentSchedule.frequency)})
                    </p>
                    {currentSchedule.lastOutcome && (
                      <p>
                        آخر نتيجة مجدولة:{" "}
                        {SCHEDULE_OUTCOME_LABELS[currentSchedule.lastOutcome] ??
                          currentSchedule.lastOutcome}
                      </p>
                    )}
                    {currentSchedule.lastTriggeredAt && (
                      <p>
                        آخر تشغيل مجدول:{" "}
                        {new Date(currentSchedule.lastTriggeredAt).toLocaleString("ar-SA")}
                      </p>
                    )}
                    {currentSchedule.lastSummary && <p>{currentSchedule.lastSummary}</p>}
                    {nextDueAt && scheduleEnabled && (
                      <p>الاستحقاق التالي تقريباً: {nextDueAt.toLocaleString("ar-SA")}</p>
                    )}
                  </div>
                )}

                {scheduleError && (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-950/30 dark:text-red-400">
                    {scheduleError}
                  </p>
                )}
                {scheduleSavedOk && (
                  <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
                    تم حفظ إعدادات الجدولة ✓
                  </p>
                )}

                <DialogFooter>
                  <Button type="submit" size="sm" disabled={scheduleSaving} className="gap-1.5">
                    {scheduleSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    حفظ الجدولة
                  </Button>
                </DialogFooter>
              </form>
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

type ManualBridgeSyncDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providerKey: string;
  nameAr: string;
  workflow: ManualBridgeWorkflowDef;
  onSynced: () => void;
};

function ManualBridgeSyncDialog({
  open,
  onOpenChange,
  providerKey,
  nameAr,
  workflow,
  onSynced
}: ManualBridgeSyncDialogProps) {
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [referenceId, setReferenceId] = useState("");
  const [note, setNote] = useState("");
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!open) {
      return;
    }

    setSyncing(false);
    setError(null);
    setConfirmed(false);
    setReferenceId("");
    setNote("");
    setCompletedSteps(Object.fromEntries(workflow.steps.map((step) => [step.id, false])));
  }, [open, workflow.steps]);

  const allStepsCompleted = workflow.steps.every((step) => completedSteps[step.id]);
  const hasAuditContext = Boolean(referenceId.trim() || note.trim());

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!confirmed) {
      setError("يجب تأكيد تنفيذ الخطوات اليدوية قبل المتابعة");
      return;
    }

    if (!allStepsCompleted) {
      setError("أكمل جميع خطوات الربط اليدوي أولًا");
      return;
    }

    if (!hasAuditContext) {
      setError("أدخل مرجعًا أو ملاحظة واحدة على الأقل لتوثيق العملية");
      return;
    }

    setSyncing(true);
    try {
      const res = await fetch(`/api/integrations/${providerKey}/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmed: true,
          completedSteps: workflow.steps
            .filter((step) => completedSteps[step.id])
            .map((step) => step.id),
          referenceId,
          note
        })
      });
      const json = await res.json().catch(() => null);
      const parsed = parseIntegrationSyncResponse(json);

      if (!res.ok || !parsed.success) {
        setError(getIntegrationApiErrorMessage(json, "تعذر تسجيل المزامنة اليدوية"));
        return;
      }

      toast.success(parsed.data.summary ?? `تم تسجيل مزامنة ${nameAr} اليدوية بنجاح`);
      onOpenChange(false);
      onSynced();
    } catch {
      setError("تعذّر الوصول للخادم أثناء تسجيل المزامنة اليدوية");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">{workflow.titleAr || nameAr}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-muted/20 text-muted-foreground rounded-xl border p-4 text-sm leading-6">
            <p className="text-foreground font-medium">{workflow.descriptionAr}</p>
          </div>

          <div className="space-y-3 rounded-xl border p-4">
            <p className="text-sm font-medium">الخطوات المطلوبة</p>
            <div className="space-y-2">
              {workflow.steps.map((step) => (
                <label
                  key={step.id}
                  className="flex cursor-pointer items-start gap-2 rounded-lg px-1 py-1">
                  <Checkbox
                    checked={completedSteps[step.id] ?? false}
                    onCheckedChange={(checked) =>
                      setCompletedSteps((prev) => ({
                        ...prev,
                        [step.id]: checked === true
                      }))
                    }
                    className="mt-0.5"
                  />
                  <span className="text-sm leading-6">{step.labelAr}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">{workflow.referenceLabelAr}</Label>
              <Input
                value={referenceId}
                onChange={(event) => setReferenceId(event.target.value)}
                placeholder={workflow.referenceHintAr}
                className="text-sm"
                dir="ltr"
              />
              {workflow.referenceHintAr && (
                <p className="text-muted-foreground text-xs">{workflow.referenceHintAr}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">{workflow.noteLabelAr}</Label>
              <Textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder={workflow.notePlaceholderAr}
                className="min-h-24 resize-none text-sm"
              />
            </div>
          </div>

          <label className="bg-muted/20 flex cursor-pointer items-start gap-2 rounded-xl border px-4 py-3">
            <Checkbox
              checked={confirmed}
              onCheckedChange={(checked) => setConfirmed(checked === true)}
              className="mt-0.5"
            />
            <span className="text-sm leading-6">{workflow.confirmLabelAr}</span>
          </label>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-950/30 dark:text-red-400">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={syncing}>
              إلغاء
            </Button>
            <Button type="submit" disabled={syncing} className="gap-1.5">
              {syncing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              تسجيل المزامنة
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────

function IntegrationCard({ entry }: { entry: CatalogEntry }) {
  const [connecting, setConnecting] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<Pick<
    IntegrationConnectionTestResponse,
    "ok" | "summary"
  > | null>(null);
  const [configOpen, setConfigOpen] = useState(false);
  const [manualSyncOpen, setManualSyncOpen] = useState(false);
  const currentSchedule = getIntegrationSyncSchedule(entry.connection?.config);

  async function handleConnect() {
    setConnecting(true);
    try {
      await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerKey: entry.key })
      });
      // Optimistic: reload page to get fresh status
      window.location.reload();
    } catch {
      setConnecting(false);
    }
  }

  async function handleDisconnect() {
    setConnecting(true);
    try {
      await fetch(`/api/integrations/${entry.key}`, { method: "DELETE" });
      window.location.reload();
    } catch {
      setConnecting(false);
    }
  }

  async function handleTestConnection() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(`/api/integrations/${entry.key}/test`, { method: "POST" });
      const json = await res.json().catch(() => null);
      const parsed = parseIntegrationConnectionTestResponse(json);

      if (!res.ok || !parsed.success) {
        setTestResult({
          ok: false,
          summary: getIntegrationApiErrorMessage(json, "خطأ في الاتصال بالخادم")
        });
        return;
      }

      setTestResult({ ok: parsed.data.ok, summary: parsed.data.summary });
      // Reload after a short delay to refresh status badge
      setTimeout(() => window.location.reload(), 1500);
    } catch {
      setTestResult({ ok: false, summary: "خطأ في الاتصال بالخادم" });
    } finally {
      setTesting(false);
    }
  }

  async function handleSync() {
    if (isManualBridge) {
      setManualSyncOpen(true);
      return;
    }

    setConnecting(true);
    try {
      const res = await fetch(`/api/integrations/${entry.key}/sync`, { method: "POST" });
      const json = await res.json().catch(() => null);
      const parsed = parseIntegrationSyncResponse(json);

      if (!res.ok || !parsed.success) {
        toast.error(getIntegrationApiErrorMessage(json, "تعذر تنفيذ المزامنة"));
        return;
      }

      toast.success(parsed.data.summary ?? "تمت المزامنة بنجاح");
      window.location.reload();
    } catch {
      toast.error("تعذّر الوصول للخادم أثناء المزامنة");
    } finally {
      setConnecting(false);
    }
  }

  const isConnected = entry.connection?.status === "CONNECTED";
  const isPending = entry.connection?.status === "PENDING";
  const isLive = entry.availability === "live";
  const isComingSoon = entry.availability === "coming-soon";
  const canTest = isLive && (isConnected || isPending);
  const isManualBridge = entry.connection?.mode === "MANUAL_BRIDGE" && !!entry.manualBridgeWorkflow;

  return (
    <div
      className={cn(
        "bg-card border-border/60 flex flex-col gap-4 rounded-2xl border p-5 shadow-sm transition-shadow hover:shadow-md",
        !isLive && "opacity-75"
      )}>
      {/* Logo + name */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-muted flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl">
            {entry.logoPath ? (
              <Image
                src={entry.logoPath}
                alt={entry.nameEn}
                width={32}
                height={32}
                className="object-contain"
              />
            ) : (
              <span className="text-muted-foreground text-xs font-bold">
                {entry.nameEn.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <p className="text-sm font-semibold">{entry.nameAr}</p>
            <p className="text-muted-foreground text-xs">{entry.nameEn}</p>
          </div>
        </div>
        <AvailabilityBadge availability={entry.availability} />
      </div>

      {/* Description */}
      <p className="text-muted-foreground flex-1 text-xs leading-6">{entry.descriptionAr}</p>

      {isManualBridge && (
        <div className="bg-muted/20 text-muted-foreground rounded-lg border px-3 py-2 text-xs leading-6">
          هذا التكامل يعمل عبر ربط يدوي موثق. عند كل مزامنة ستسجل الخطوات المنفذة والمرجع والملاحظات
          داخل السجل.
        </div>
      )}

      {entry.supportsScheduledSync && currentSchedule?.enabled && (
        <div className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs leading-6 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-300">
          مزامنة مجدولة {getIntegrationSyncScheduleLabelAr(currentSchedule.frequency)} مفعلة لهذا
          التكامل.
        </div>
      )}

      {/* Test result feedback */}
      {testResult && (
        <p
          className={cn(
            "rounded-lg px-3 py-2 text-xs",
            testResult.ok
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
              : "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400"
          )}>
          {testResult.summary}
        </p>
      )}

      {/* Status + action */}
      <div className="flex items-center justify-between gap-3">
        {entry.connection ? (
          <StatusBadge status={entry.connection.status} />
        ) : (
          <span className="text-muted-foreground text-xs">
            {isComingSoon ? "قيد التطوير" : "غير مربوط"}
          </span>
        )}

        <div className="flex items-center gap-2">
          {/* Settings/config button for connected integrations */}
          {entry.connection && isLive && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setConfigOpen(true)}
              className="text-muted-foreground hover:text-foreground h-8 gap-1.5 px-2 text-xs">
              <Settings2 className="h-3.5 w-3.5" />
            </Button>
          )}

          {canTest && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleTestConnection}
              disabled={testing || connecting}
              className="text-muted-foreground hover:text-foreground h-8 gap-1.5 text-xs">
              <FlaskConical className="h-3 w-3" />
              {testing ? "جارٍ الاختبار…" : "اختبر"}
            </Button>
          )}

          {isConnected && isLive && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleSync}
              disabled={connecting || testing}
              className="text-muted-foreground hover:text-foreground h-8 gap-1.5 text-xs">
              <RefreshCw className="h-3 w-3" />
              {isManualBridge ? "تسجيل يدوي" : "مزامنة"}
            </Button>
          )}

          {isLive &&
            !isComingSoon &&
            (isConnected || isPending ? (
              <Button
                size="sm"
                variant="outline"
                onClick={handleDisconnect}
                disabled={connecting || testing}
                className="h-8 text-xs">
                قطع الاتصال
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleConnect}
                disabled={connecting}
                className="h-8 gap-1.5 text-xs">
                <Wifi className="h-3 w-3" />
                ربط
              </Button>
            ))}

          {entry.availability === "enterprise-custom" && (
            <Button size="sm" variant="outline" asChild className="h-8 gap-1.5 text-xs">
              <a href="/request-demo" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3 w-3" />
                تواصل معنا
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Config dialog */}
      {entry.connection && (
        <IntegrationConfigDialog
          open={configOpen}
          onOpenChange={setConfigOpen}
          providerKey={entry.key}
          nameAr={entry.nameAr}
          mode={entry.connection.mode}
          config={entry.connection.config}
          supportsScheduledSync={entry.supportsScheduledSync}
          lastConnectedAt={entry.connection.lastConnectedAt}
          lastSyncAt={entry.connection.lastSyncAt}
          credentialFields={entry.credentialFields}
          hasCredentials={entry.connection.hasCredentials}
          runs={entry.connection.runs}
          onSaved={() => {
            setConfigOpen(false);
            window.location.reload();
          }}
        />
      )}

      {entry.connection && entry.manualBridgeWorkflow && (
        <ManualBridgeSyncDialog
          open={manualSyncOpen}
          onOpenChange={setManualSyncOpen}
          providerKey={entry.key}
          nameAr={entry.nameAr}
          workflow={entry.manualBridgeWorkflow}
          onSynced={() => {
            setManualSyncOpen(false);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
