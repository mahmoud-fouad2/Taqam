"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Bot,
  Loader2,
  RefreshCcw,
  RotateCcw,
  Sparkles,
  Workflow
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import type { AutomationDashboardData } from "@/lib/automation";
import { AUTOMATION_TRIGGER_LABELS } from "@/lib/automation";
import { useClientLocale } from "@/lib/i18n/use-client-locale";

type Props = {
  initialData: AutomationDashboardData;
};

function getStatusBadgeVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "success":
      return "default";
    case "running":
      return "secondary";
    case "partial":
      return "outline";
    case "failed":
      return "destructive";
    case "skipped":
      return "secondary";
    default:
      return "outline";
  }
}

function formatDate(value: string | null, locale: "ar" | "en") {
  if (!value) return locale === "ar" ? "غير متوفر" : "Not available";
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function AutomationManager({ initialData }: Props) {
  const locale = useClientLocale();
  const router = useRouter();
  const [togglingId, setTogglingId] = React.useState<string | null>(null);
  const [retryingRunId, setRetryingRunId] = React.useState<string | null>(null);
  const [syncingDefaults, setSyncingDefaults] = React.useState(false);

  const isArabic = locale === "ar";
  const text = React.useMemo(
    () => ({
      workflowTitle: isArabic ? "الـ Workflows النشطة" : "Active workflows",
      workflowDesc: isArabic
        ? "هذه الـ workflows مبنية على الأحداث الحالية داخل النظام ويمكنك تعطيلها أو مراجعة آخر تشغيل لها."
        : "These workflows are bound to real product events. You can disable them or review their latest executions.",
      runsTitle: isArabic ? "آخر التشغيلات" : "Recent runs",
      runsDesc: isArabic
        ? "سجل آخر 20 عملية تنفيذ مع الحالة وإمكانية إعادة المحاولة عند الحاجة."
        : "The latest 20 workflow executions with status and retry support.",
      builtin: isArabic ? "مضمّن" : "Built-in",
      version: isArabic ? "الإصدار" : "Version",
      conditions: isArabic ? "الشروط" : "Conditions",
      actions: isArabic ? "الإجراءات" : "Actions",
      latestRun: isArabic ? "آخر تشغيل" : "Latest run",
      updatedAt: isArabic ? "آخر تحديث" : "Updated at",
      enable: isArabic ? "تفعيل" : "Enable",
      retry: isArabic ? "إعادة المحاولة" : "Retry",
      syncDefaults: isArabic ? "مزامنة الـ workflows الافتراضية" : "Sync default workflows",
      workflow: isArabic ? "Workflow" : "Workflow",
      trigger: isArabic ? "المشغّل" : "Trigger",
      status: isArabic ? "الحالة" : "Status",
      summary: isArabic ? "الملخص" : "Summary",
      noSummary: isArabic ? "لا يوجد ملخص" : "No summary",
      retryCount: isArabic ? "عدد الإعادات" : "Retry count",
      startedAt: isArabic ? "بدأت في" : "Started at",
      noRuns: isArabic ? "لا توجد تشغيلات حتى الآن" : "No runs yet",
      toggleSuccess: isArabic ? "تم تحديث الـ workflow بنجاح" : "Workflow updated successfully",
      retrySuccess: isArabic ? "تمت إعادة المحاولة بنجاح" : "Workflow retried successfully",
      syncSuccess: isArabic ? "تمت مزامنة الـ workflows الافتراضية" : "Default workflows synced successfully",
      actionFailed: isArabic ? "تعذر تنفيذ العملية" : "Action failed"
    }),
    [isArabic]
  );

  const refreshPage = React.useCallback(() => {
    router.refresh();
  }, [router]);

  const handleToggle = async (workflowId: string, enabled: boolean) => {
    setTogglingId(workflowId);
    try {
      const res = await fetch(`/api/automation/workflows/${workflowId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled })
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error ?? text.actionFailed);
      }

      toast.success(text.toggleSuccess);
      refreshPage();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : text.actionFailed);
    } finally {
      setTogglingId(null);
    }
  };

  const handleRetry = async (workflowId: string, runId: string) => {
    setRetryingRunId(runId);
    try {
      const res = await fetch(`/api/automation/workflows/${workflowId}/runs/${runId}/retry`, {
        method: "POST"
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error ?? text.actionFailed);
      }

      toast.success(text.retrySuccess);
      refreshPage();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : text.actionFailed);
    } finally {
      setRetryingRunId(null);
    }
  };

  const handleSyncDefaults = async () => {
    setSyncingDefaults(true);
    try {
      const res = await fetch("/api/automation/workflows", { method: "POST" });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error ?? text.actionFailed);
      }
      toast.success(text.syncSuccess);
      refreshPage();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : text.actionFailed);
    } finally {
      setSyncingDefaults(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Workflow className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
              {text.workflowTitle}
            </CardTitle>
            <CardDescription>{text.workflowDesc}</CardDescription>
          </div>
          <Button onClick={handleSyncDefaults} variant="outline" className="gap-2" disabled={syncingDefaults}>
            {syncingDefaults ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
            {text.syncDefaults}
          </Button>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          {initialData.workflows.map((workflow) => {
            const triggerLabel =
              workflow.triggerType in AUTOMATION_TRIGGER_LABELS
                ? AUTOMATION_TRIGGER_LABELS[workflow.triggerType as keyof typeof AUTOMATION_TRIGGER_LABELS][
                    isArabic ? "ar" : "en"
                  ]
                : workflow.triggerType;

            return (
              <div key={workflow.id} className="rounded-2xl border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold leading-none">{workflow.name}</h3>
                      {workflow.isBuiltin ? <Badge variant="outline">{text.builtin}</Badge> : null}
                      <Badge variant="secondary">{triggerLabel}</Badge>
                    </div>
                    {workflow.description ? (
                      <p className="text-sm text-muted-foreground">{workflow.description}</p>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={workflow.enabled}
                      onCheckedChange={(checked) => void handleToggle(workflow.id, checked)}
                      disabled={togglingId === workflow.id}
                      aria-label={text.enable}
                    />
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline">{text.version}: v{workflow.version}</Badge>
                  <Badge variant="outline">{text.conditions}: {workflow.conditionsCount}</Badge>
                  <Badge variant="outline">{text.actions}: {workflow.actionsCount}</Badge>
                </div>

                <div className="mt-4 rounded-xl bg-muted/40 p-3 text-sm">
                  <div className="flex items-center gap-2 font-medium">
                    <Sparkles className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                    {text.latestRun}
                  </div>
                  {workflow.latestRun ? (
                    <div className="mt-2 space-y-1 text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusBadgeVariant(workflow.latestRun.status)}>
                          {workflow.latestRun.status}
                        </Badge>
                        <span>{workflow.latestRun.summary ?? text.noSummary}</span>
                      </div>
                      <div>{text.retryCount}: {workflow.latestRun.retryCount}</div>
                      <div>{text.startedAt}: {formatDate(workflow.latestRun.startedAt, locale)}</div>
                    </div>
                  ) : (
                    <p className="mt-2 text-muted-foreground">{text.noRuns}</p>
                  )}
                </div>

                <div className="mt-3 text-xs text-muted-foreground">
                  {text.updatedAt}: {formatDate(workflow.updatedAt, locale)}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bot className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
            {text.runsTitle}
          </CardTitle>
          <CardDescription>{text.runsDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          {initialData.runs.length === 0 ? (
            <p className="text-sm text-muted-foreground">{text.noRuns}</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{text.workflow}</TableHead>
                    <TableHead>{text.trigger}</TableHead>
                    <TableHead>{text.status}</TableHead>
                    <TableHead>{text.summary}</TableHead>
                    <TableHead>{text.retryCount}</TableHead>
                    <TableHead>{text.startedAt}</TableHead>
                    <TableHead className="w-[140px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {initialData.runs.map((run) => {
                    const triggerLabel =
                      run.triggerType in AUTOMATION_TRIGGER_LABELS
                        ? AUTOMATION_TRIGGER_LABELS[run.triggerType as keyof typeof AUTOMATION_TRIGGER_LABELS][
                            isArabic ? "ar" : "en"
                          ]
                        : run.triggerType;

                    return (
                      <TableRow key={run.id}>
                        <TableCell className="font-medium">{run.workflowName}</TableCell>
                        <TableCell>{triggerLabel}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(run.status)}>{run.status}</Badge>
                        </TableCell>
                        <TableCell>{run.summary ?? run.failureReason ?? text.noSummary}</TableCell>
                        <TableCell>{run.retryCount}</TableCell>
                        <TableCell>{formatDate(run.startedAt, locale)}</TableCell>
                        <TableCell>
                          {(run.status === "failed" || run.status === "partial") && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2"
                              disabled={retryingRunId === run.id}
                              onClick={() => void handleRetry(run.workflowId, run.id)}>
                              {retryingRunId === run.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <RotateCcw className="h-4 w-4" />
                              )}
                              {text.retry}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}