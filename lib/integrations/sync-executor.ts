import prisma from "@/lib/db";
import {
  buildManualBridgeSyncSummary,
  type ManualBridgeSyncSubmission
} from "@/lib/integrations/manual-bridge";
import {
  runIntegrationProviderSyncAdapter,
  supportsIntegrationProviderSyncAdapter
} from "@/lib/integrations/provider-adapters";
import {
  recordIntegrationSyncScheduleExecution,
  type IntegrationSyncRunOutcome
} from "@/lib/integrations/sync-schedule";
import { buildIntegrationSyncRunLogs } from "@/lib/integrations/structured-logs";

type SyncTrigger = "manual" | "retry" | "scheduled";

export async function executeIntegrationSync({
  tenantId,
  providerKey,
  trigger,
  manualBridgeSubmission,
  retryContext
}: {
  tenantId: string;
  providerKey: string;
  trigger: SyncTrigger;
  manualBridgeSubmission?: ManualBridgeSyncSubmission;
  retryContext?: {
    originalRunId: string;
    previousRetryCount: number;
    connectionStatus: string;
  };
}): Promise<
  | {
      ok: true;
      runId: string;
      runStatus: Exclude<IntegrationSyncRunOutcome, "failed">;
      summary: string;
      durationMs: number;
      logs: ReturnType<typeof buildIntegrationSyncRunLogs>;
      lastSyncAt: string | null;
    }
  | {
      ok: false;
      status: number;
      error: string;
      runId?: string;
      runStatus?: IntegrationSyncRunOutcome;
      durationMs?: number;
      logs?: ReturnType<typeof buildIntegrationSyncRunLogs>;
    }
> {
  const connection = await prisma.integrationConnection.findUnique({
    where: { tenantId_providerKey: { tenantId, providerKey } },
    select: {
      id: true,
      mode: true,
      status: true,
      config: true
    }
  });

  if (!connection) {
    return { ok: false, status: 404, error: "Integration not connected" };
  }

  if (connection.status === "DISCONNECTED") {
    return {
      ok: false,
      status: 409,
      error: "لا يمكن المزامنة — التكامل غير مربوط"
    };
  }

  if (trigger === "scheduled" && !supportsIntegrationProviderSyncAdapter(providerKey)) {
    return {
      ok: false,
      status: 409,
      error: "لا يدعم هذا التكامل المزامنة المجدولة حالياً"
    };
  }

  const startedAt = new Date();
  const adapterResult = await runIntegrationProviderSyncAdapter({ tenantId, providerKey });

  let runStatus: IntegrationSyncRunOutcome;
  let summary: string;
  let errorMessage: string | undefined;

  if (adapterResult && !adapterResult.ok) {
    runStatus = "failed";
    summary =
      trigger === "scheduled"
        ? "فشلت المزامنة المجدولة"
        : trigger === "retry"
          ? "فشلت إعادة المزامنة"
          : "فشلت المزامنة";
    errorMessage = adapterResult.error;
  } else if (connection.mode === "MANUAL_BRIDGE") {
    if (manualBridgeSubmission) {
      summary = [
        buildManualBridgeSyncSummary({
          providerKey,
          referenceId: manualBridgeSubmission.referenceId
        }),
        adapterResult?.ok ? adapterResult.summary : null
      ]
        .filter(Boolean)
        .join(" — ");
      runStatus = "success";
    } else if (adapterResult?.ok) {
      summary = `${adapterResult.summary} — بانتظار الإرسال اليدوي وتوثيق العملية`;
      runStatus = "partial";
    } else {
      summary = "المزامنة تتطلب تنفيذ الخطوات اليدوية وتوثيقها قبل اعتمادها";
      runStatus = "partial";
    }
  } else if (adapterResult?.ok) {
    summary = adapterResult.summary;
    runStatus = "success";
  } else {
    summary =
      trigger === "retry"
        ? "تمت إعادة المزامنة بنجاح (وضع محاكاة)"
        : "تمت المزامنة (وضع محاكاة — سيتحول لمزامنة حقيقية عند تفعيل الـ adapter)";
    runStatus = "success";
  }

  const logs = buildIntegrationSyncRunLogs({
    mode: connection.mode,
    trigger,
    runStatus,
    errorMessage,
    retryContext,
    awaitingManualAction:
      connection.mode === "MANUAL_BRIDGE" && !manualBridgeSubmission && runStatus === "partial",
    manualBridgeContext: manualBridgeSubmission
      ? {
          referenceId: manualBridgeSubmission.referenceId,
          note: manualBridgeSubmission.note,
          completedSteps: manualBridgeSubmission.completedSteps
        }
      : undefined,
    adapterContext: adapterResult?.ok ? adapterResult.artifact : undefined
  });

  const finishedAt = new Date();
  const durationMs = finishedAt.getTime() - startedAt.getTime();
  const configUpdate =
    trigger === "scheduled"
      ? recordIntegrationSyncScheduleExecution({
          config: connection.config,
          executedAt: finishedAt,
          outcome: runStatus,
          summary: runStatus === "failed" ? errorMessage ?? summary : summary
        })
      : undefined;

  const [run] = await prisma.$transaction([
    prisma.integrationRun.create({
      data: {
        connectionId: connection.id,
        operation: "sync",
        status: runStatus,
        summary,
        ...(errorMessage ? { errorMessage } : {}),
        logs,
        durationMs,
        ...(retryContext ? { retryCount: retryContext.previousRetryCount + 1 } : {}),
        startedAt,
        finishedAt
      }
    }),
    prisma.integrationConnection.update({
      where: { id: connection.id },
      data: {
        ...(runStatus === "success" ? { lastSyncAt: finishedAt } : {}),
        lastError: runStatus === "failed" ? (errorMessage ?? null) : null,
        ...(configUpdate ? { config: configUpdate } : {})
      }
    })
  ]);

  if (runStatus === "failed") {
    return {
      ok: false,
      status: 409,
      error: errorMessage ?? summary,
      runId: run.id,
      runStatus,
      durationMs,
      logs
    };
  }

  return {
    ok: true,
    runId: run.id,
    runStatus,
    summary,
    durationMs,
    logs,
    lastSyncAt: runStatus === "success" ? finishedAt.toISOString() : null
  };
}