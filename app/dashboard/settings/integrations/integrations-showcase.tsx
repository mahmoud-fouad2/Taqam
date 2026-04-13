"use client";

import Image from "next/image";
import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { IntegrationProviderDef, CredentialField } from "@/lib/integrations/catalog";

// ── Types ─────────────────────────────────────────────────────────────────────

type RunRecord = {
  id: string;
  operation: string;
  status: string;
  summary: string | null;
  errorMessage: string | null;
  durationMs: number | null;
  startedAt: string;
  finishedAt: string | null;
};

type ConnectionSnapshot = {
  providerKey: string;
  mode: string;
  status: string;
  lastConnectedAt: string | null;
  lastSyncAt: string | null;
  lastError: string | null;
  hasCredentials: boolean;
  runs: RunRecord[];
} | null;

type CatalogEntry = IntegrationProviderDef & { connection: ConnectionSnapshot };

type Props = {
  catalog: CatalogEntry[];
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  if (status === "CONNECTED")
    return (
      <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 gap-1">
        <CheckCircle2 className="h-3 w-3" />
        متصل
      </Badge>
    );
  if (status === "PENDING")
    return (
      <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400 gap-1">
        <Clock className="h-3 w-3" />
        في المعالجة
      </Badge>
    );
  if (status === "ERROR" || status === "DEGRADED")
    return (
      <Badge variant="outline" className="border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400 gap-1">
        <AlertCircle className="h-3 w-3" />
        خطأ
      </Badge>
    );
  return (
    <Badge variant="outline" className="gap-1 text-muted-foreground">
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
      <Badge variant="outline" className="gap-1 text-[10px] text-muted-foreground">
        <Building2 className="h-2.5 w-2.5" />
        Enterprise
      </Badge>
    );
  return (
    <Badge variant="outline" className="gap-1 text-[10px] text-muted-foreground">
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

  const categories = [
    "all",
    ...Array.from(new Set(catalog.map((e) => e.category)))
  ];

  const filtered =
    activeCategory === "all"
      ? catalog
      : catalog.filter((e) => e.category === activeCategory);

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
        <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-card px-4 py-3 text-sm shadow-sm">
          <Activity className="h-4 w-4 text-muted-foreground shrink-0" />
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
            {cat === "all" ? "الكل" : CATEGORY_LABELS[cat] ?? cat}
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

function MaskedField({ value }: { value: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative flex items-center gap-2">
      <Input
        readOnly
        value={visible ? value : "•".repeat(Math.min(value.length, 20))}
        className="font-mono text-sm bg-muted/50 pr-9"
        dir="ltr"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute left-2 text-muted-foreground hover:text-foreground transition-colors">
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
  credentialFields,
  hasCredentials,
  runs,
  onSaved
}: ConfigDialogProps) {
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedOk, setSavedOk] = useState(false);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [retryingRunId, setRetryingRunId] = useState<string | null>(null);
  const [localRuns, setLocalRuns] = useState<RunRecord[]>(runs);

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
        const json = await res.json() as { error?: string };
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
      const res = await fetch(
        `/api/integrations/${providerKey}/runs/${runId}/retry`,
        { method: "POST" }
      );
      if (res.ok) {
        const json = await res.json() as { runId: string; ok: boolean; summary: string; durationMs: number };
        // Prepend new run to local list
        const newRun: RunRecord = {
          id: json.runId,
          operation: localRuns.find((r) => r.id === runId)?.operation ?? "test",
          status: json.ok ? "success" : "failed",
          summary: json.summary,
          errorMessage: null,
          durationMs: json.durationMs,
          startedAt: new Date().toISOString(),
          finishedAt: new Date().toISOString()
        };
        setLocalRuns((prev) => [newRun, ...prev].slice(0, 10));
      }
    } catch {
      // silently ignore
    } finally {
      setRetryingRunId(null);
    }
  }

  const hasFields = (credentialFields?.length ?? 0) > 0;

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
          </TabsList>

          {/* ── Credentials tab ── */}
          {hasFields && (
            <TabsContent value="credentials" className="mt-4 space-y-4">
              {hasCredentials && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30 px-4 py-3 text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  بيانات الاعتماد محفوظة ومشفّرة. أدخل قيماً جديدة أدناه للاستبدال.
                </div>
              )}
              <form onSubmit={handleSaveCredentials} className="space-y-4">
                {credentialFields!.map((field) => (
                  <div key={field.key} className="space-y-1.5">
                    <Label className="text-xs font-medium">
                      {field.labelAr}
                      {field.required && <span className="text-red-500 mr-1">*</span>}
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
                      <p className="text-xs text-muted-foreground">{field.hint}</p>
                    )}
                  </div>
                ))}

                {saveError && (
                  <p className="text-xs text-red-600 dark:text-red-400 rounded-lg bg-red-50 dark:bg-red-950/30 px-3 py-2">
                    {saveError}
                  </p>
                )}
                {savedOk && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2">
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
              <div className="py-10 text-center text-sm text-muted-foreground">
                لا توجد أنشطة مسجّلة بعد
              </div>
            ) : (
              <div className="divide-y divide-border rounded-lg border text-xs">
                {localRuns.map((run) => {
                  const runStatus = RUN_STATUS_LABELS[run.status] ?? {
                    label: run.status,
                    className: "text-muted-foreground"
                  };
                  const canRetry = run.status === "failed" &&
                    (run.operation === "test" || run.operation === "sync");
                  return (
                    <div key={run.id} className="px-4 py-3 flex items-start gap-3">
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">
                            {OPERATION_LABELS[run.operation] ?? run.operation}
                          </span>
                          <span className={cn("font-medium", runStatus.className)}>
                            {runStatus.label}
                          </span>
                          {run.durationMs !== null && (
                            <span className="text-muted-foreground">
                              {run.durationMs}ms
                            </span>
                          )}
                          {canRetry && (
                            <button
                              type="button"
                              onClick={() => handleRetry(run.id)}
                              disabled={retryingRunId === run.id}
                              className="flex items-center gap-1 text-primary hover:underline disabled:opacity-60">
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
                          <p className="text-muted-foreground leading-relaxed">
                            {run.summary}
                          </p>
                        )}
                        {run.errorMessage && (
                          <p className="text-red-600 dark:text-red-400">{run.errorMessage}</p>
                        )}
                      </div>
                      <div className="shrink-0 text-muted-foreground whitespace-nowrap" dir="ltr">
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
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────

function IntegrationCard({ entry }: { entry: CatalogEntry }) {
  const [connecting, setConnecting] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; summary: string } | null>(null);
  const [configOpen, setConfigOpen] = useState(false);

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
      const json = await res.json() as { ok: boolean; summary: string };
      setTestResult({ ok: json.ok, summary: json.summary });
      // Reload after a short delay to refresh status badge
      setTimeout(() => window.location.reload(), 1500);
    } catch {
      setTestResult({ ok: false, summary: "خطأ في الاتصال بالخادم" });
    } finally {
      setTesting(false);
    }
  }

  async function handleSync() {
    setConnecting(true);
    try {
      await fetch(`/api/integrations/${entry.key}/sync`, { method: "POST" });
      window.location.reload();
    } catch {
      setConnecting(false);
    }
  }

  const isConnected = entry.connection?.status === "CONNECTED";
  const isPending = entry.connection?.status === "PENDING";
  const isLive = entry.availability === "live";
  const isComingSoon = entry.availability === "coming-soon";
  const canTest = isLive && (isConnected || isPending);

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
            <p className="font-semibold text-sm">{entry.nameAr}</p>
            <p className="text-muted-foreground text-xs">{entry.nameEn}</p>
          </div>
        </div>
        <AvailabilityBadge availability={entry.availability} />
      </div>

      {/* Description */}
      <p className="text-muted-foreground text-xs leading-6 flex-1">{entry.descriptionAr}</p>

      {/* Test result feedback */}
      {testResult && (
        <p className={cn(
          "text-xs rounded-lg px-3 py-2",
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
              className="text-xs h-8 gap-1.5 text-muted-foreground hover:text-foreground px-2">
              <Settings2 className="h-3.5 w-3.5" />
            </Button>
          )}

          {canTest && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleTestConnection}
              disabled={testing || connecting}
              className="text-xs h-8 gap-1.5 text-muted-foreground hover:text-foreground">
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
              className="text-xs h-8 gap-1.5 text-muted-foreground hover:text-foreground">
              <RefreshCw className="h-3 w-3" />
              مزامنة
            </Button>
          )}

          {isLive && !isComingSoon && (
            isConnected || isPending ? (
              <Button
                size="sm"
                variant="outline"
                onClick={handleDisconnect}
                disabled={connecting || testing}
                className="text-xs h-8">
                قطع الاتصال
              </Button>
            ) : (
              <Button size="sm" onClick={handleConnect} disabled={connecting} className="text-xs h-8 gap-1.5">
                <Wifi className="h-3 w-3" />
                ربط
              </Button>
            )
          )}

          {entry.availability === "enterprise-custom" && (
            <Button
              size="sm"
              variant="outline"
              asChild
              className="text-xs h-8 gap-1.5">
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
          credentialFields={entry.credentialFields}
          hasCredentials={entry.connection.hasCredentials}
          runs={entry.connection.runs}
          onSaved={() => {
            setConfigOpen(false);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
