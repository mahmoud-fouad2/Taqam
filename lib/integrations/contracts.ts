import { z } from "zod";

import {
  normalizeIntegrationConnectionConfig,
  type IntegrationConnectionConfig,
  type IntegrationSyncRunOutcome
} from "@/lib/integrations/sync-schedule";
import { parseIntegrationRunLogs } from "@/lib/integrations/structured-logs";

export const integrationRunLogEntrySchema = z.object({
  timestamp: z.string(),
  level: z.enum(["info", "warn", "error"]),
  category: z.enum(["operation", "credentials", "connection", "retry"]),
  message: z.string(),
  context: z.record(z.string()).optional()
});

export const integrationRunRecordSchema = z.object({
  id: z.string().min(1),
  operation: z.string().min(1),
  status: z.string().min(1),
  summary: z.string().nullable(),
  errorMessage: z.string().nullable(),
  logs: z.array(integrationRunLogEntrySchema),
  durationMs: z.number().nonnegative().nullable(),
  retryCount: z.number().int().nonnegative(),
  startedAt: z.string(),
  finishedAt: z.string().nullable()
});

export const integrationConnectionSnapshotSchema = z.object({
  providerKey: z.string().min(1),
  mode: z.enum(["NATIVE_API", "EMBEDDED", "MANUAL_BRIDGE", "ENTERPRISE_CUSTOM"]),
  status: z.enum(["DISCONNECTED", "PENDING", "CONNECTED", "DEGRADED", "ERROR"]),
  config: z.record(z.unknown()).nullable(),
  lastConnectedAt: z.string().nullable(),
  lastSyncAt: z.string().nullable(),
  lastError: z.string().nullable(),
  hasCredentials: z.boolean(),
  runs: z.array(integrationRunRecordSchema)
});

export const integrationConnectionTestResponseSchema = z.object({
  ok: z.boolean(),
  runId: z.string().min(1),
  status: z.enum(["CONNECTED", "ERROR"]),
  summary: z.string().min(1),
  durationMs: z.number().nonnegative(),
  logs: z.array(integrationRunLogEntrySchema),
  error: z.string().optional()
});

export const integrationSyncResponseSchema = z.object({
  ok: z.literal(true),
  runId: z.string().min(1),
  runStatus: z.enum(["success", "partial"]),
  summary: z.string().min(1),
  durationMs: z.number().nonnegative(),
  logs: z.array(integrationRunLogEntrySchema),
  lastSyncAt: z.string().nullable()
});

export const integrationRetryResponseSchema = z.object({
  ok: z.boolean(),
  runId: z.string().min(1).optional(),
  retryCount: z.number().int().nonnegative(),
  summary: z.string().optional(),
  durationMs: z.number().nonnegative().optional(),
  logs: z.array(integrationRunLogEntrySchema).optional(),
  runStatus: z.enum(["success", "partial", "failed"]).optional(),
  error: z.string().optional()
});

const integrationErrorResponseSchema = z.object({
  error: z.string().optional()
});

export type IntegrationRunRecord = z.infer<typeof integrationRunRecordSchema>;
export type IntegrationConnectionSnapshot = z.infer<typeof integrationConnectionSnapshotSchema>;
export type IntegrationConnectionTestResponse = z.infer<
  typeof integrationConnectionTestResponseSchema
>;
export type IntegrationSyncResponse = z.infer<typeof integrationSyncResponseSchema>;
export type IntegrationRetryResponse = z.infer<typeof integrationRetryResponseSchema>;

function toIsoString(value: Date | string | null | undefined) {
  if (!value) {
    return null;
  }

  const parsed = value instanceof Date ? new Date(value) : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

export function buildIntegrationRunRecord(run: {
  id: string;
  operation: string;
  status: string;
  summary: string | null;
  errorMessage: string | null;
  logs: unknown;
  durationMs: number | null;
  retryCount: number;
  startedAt: Date | string;
  finishedAt: Date | string | null;
}): IntegrationRunRecord {
  return integrationRunRecordSchema.parse({
    id: run.id,
    operation: run.operation,
    status: run.status,
    summary: run.summary,
    errorMessage: run.errorMessage,
    logs: parseIntegrationRunLogs(run.logs),
    durationMs: run.durationMs,
    retryCount: run.retryCount,
    startedAt: toIsoString(run.startedAt),
    finishedAt: toIsoString(run.finishedAt)
  });
}

export function buildIntegrationConnectionSnapshot(connection: {
  providerKey: string;
  mode: string;
  status: string;
  config: unknown;
  lastConnectedAt: Date | string | null;
  lastSyncAt: Date | string | null;
  lastError: string | null;
  hasCredentials: boolean;
  runs: Array<{
    id: string;
    operation: string;
    status: string;
    summary: string | null;
    errorMessage: string | null;
    logs: unknown;
    durationMs: number | null;
    retryCount: number;
    startedAt: Date | string;
    finishedAt: Date | string | null;
  }>;
}): IntegrationConnectionSnapshot {
  return integrationConnectionSnapshotSchema.parse({
    providerKey: connection.providerKey,
    mode: connection.mode,
    status: connection.status,
    config:
      connection.config == null ? null : normalizeIntegrationConnectionConfig(connection.config),
    lastConnectedAt: toIsoString(connection.lastConnectedAt),
    lastSyncAt: toIsoString(connection.lastSyncAt),
    lastError: connection.lastError,
    hasCredentials: connection.hasCredentials,
    runs: connection.runs.map((run) => buildIntegrationRunRecord(run))
  });
}

export function buildIntegrationConnectionTestResponse(input: {
  ok: boolean;
  runId: string;
  status: "CONNECTED" | "ERROR";
  summary: string;
  durationMs: number;
  logs: unknown;
  error?: string;
}): IntegrationConnectionTestResponse {
  return integrationConnectionTestResponseSchema.parse({
    ok: input.ok,
    runId: input.runId,
    status: input.status,
    summary: input.summary,
    durationMs: input.durationMs,
    logs: parseIntegrationRunLogs(input.logs),
    ...(input.error ? { error: input.error } : {})
  });
}

export function buildIntegrationSyncResponse(input: {
  runId: string;
  runStatus: Extract<IntegrationSyncRunOutcome, "success" | "partial">;
  summary: string;
  durationMs: number;
  logs: unknown;
  lastSyncAt: Date | string | null;
}): IntegrationSyncResponse {
  return integrationSyncResponseSchema.parse({
    ok: true,
    runId: input.runId,
    runStatus: input.runStatus,
    summary: input.summary,
    durationMs: input.durationMs,
    logs: parseIntegrationRunLogs(input.logs),
    lastSyncAt: toIsoString(input.lastSyncAt)
  });
}

export function buildIntegrationRetryResponse(input: {
  ok: boolean;
  retryCount: number;
  runId?: string;
  summary?: string;
  durationMs?: number;
  logs?: unknown;
  runStatus?: IntegrationSyncRunOutcome;
  error?: string;
}): IntegrationRetryResponse {
  return integrationRetryResponseSchema.parse({
    ok: input.ok,
    retryCount: input.retryCount,
    ...(input.runId ? { runId: input.runId } : {}),
    ...(input.summary ? { summary: input.summary } : {}),
    ...(typeof input.durationMs === "number" ? { durationMs: input.durationMs } : {}),
    ...(input.logs !== undefined ? { logs: parseIntegrationRunLogs(input.logs) } : {}),
    ...(input.runStatus ? { runStatus: input.runStatus } : {}),
    ...(input.error ? { error: input.error } : {})
  });
}

export function parseIntegrationConnectionTestResponse(value: unknown) {
  return integrationConnectionTestResponseSchema.safeParse(value);
}

export function parseIntegrationSyncResponse(value: unknown) {
  return integrationSyncResponseSchema.safeParse(value);
}

export function parseIntegrationRetryResponse(value: unknown) {
  return integrationRetryResponseSchema.safeParse(value);
}

export function getIntegrationApiErrorMessage(value: unknown, fallback: string) {
  const parsed = integrationErrorResponseSchema.safeParse(value);
  return parsed.success && parsed.data.error ? parsed.data.error : fallback;
}

export type { IntegrationConnectionConfig };
