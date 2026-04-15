export const INTEGRATION_SYNC_SCHEDULE_FREQUENCIES = ["daily", "weekly", "monthly"] as const;

export type IntegrationSyncScheduleFrequency =
  (typeof INTEGRATION_SYNC_SCHEDULE_FREQUENCIES)[number];

export type IntegrationSyncRunOutcome = "success" | "partial" | "failed";

export type IntegrationSyncSchedule = {
  enabled: boolean;
  frequency: IntegrationSyncScheduleFrequency;
  enabledAt?: string;
  lastTriggeredAt?: string;
  lastOutcome?: IntegrationSyncRunOutcome;
  lastSummary?: string;
};

export type IntegrationConnectionConfig = Record<string, unknown> & {
  syncSchedule?: IntegrationSyncSchedule;
};

const SYNC_SCHEDULE_FREQUENCY_LABELS_AR: Record<IntegrationSyncScheduleFrequency, string> = {
  daily: "يومي",
  weekly: "أسبوعي",
  monthly: "شهري"
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isIntegrationSyncScheduleFrequency(
  value: unknown
): value is IntegrationSyncScheduleFrequency {
  return (
    typeof value === "string" &&
    INTEGRATION_SYNC_SCHEDULE_FREQUENCIES.includes(value as IntegrationSyncScheduleFrequency)
  );
}

function isIntegrationSyncRunOutcome(value: unknown): value is IntegrationSyncRunOutcome {
  return value === "success" || value === "partial" || value === "failed";
}

function normalizeDateString(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

function normalizeSummary(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  return trimmed.length > 240 ? `${trimmed.slice(0, 237)}...` : trimmed;
}

function toDate(value: Date | string | null | undefined) {
  if (!value) {
    return null;
  }

  const parsed = value instanceof Date ? new Date(value) : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function addIntegrationSyncInterval(anchor: Date, frequency: IntegrationSyncScheduleFrequency) {
  const next = new Date(anchor);

  if (frequency === "daily") {
    next.setUTCDate(next.getUTCDate() + 1);
    return next;
  }

  if (frequency === "weekly") {
    next.setUTCDate(next.getUTCDate() + 7);
    return next;
  }

  next.setUTCMonth(next.getUTCMonth() + 1);
  return next;
}

export function getIntegrationSyncScheduleLabelAr(frequency: IntegrationSyncScheduleFrequency) {
  return SYNC_SCHEDULE_FREQUENCY_LABELS_AR[frequency];
}

export function normalizeIntegrationSyncSchedule(input: unknown): IntegrationSyncSchedule | null {
  if (!isRecord(input)) {
    return null;
  }

  if (typeof input.enabled !== "boolean" || !isIntegrationSyncScheduleFrequency(input.frequency)) {
    return null;
  }

  const enabledAt = normalizeDateString(input.enabledAt);
  const lastTriggeredAt = normalizeDateString(input.lastTriggeredAt);
  const lastOutcome = isIntegrationSyncRunOutcome(input.lastOutcome)
    ? input.lastOutcome
    : undefined;
  const lastSummary = normalizeSummary(input.lastSummary);

  return {
    enabled: input.enabled,
    frequency: input.frequency,
    ...(enabledAt ? { enabledAt } : {}),
    ...(lastTriggeredAt ? { lastTriggeredAt } : {}),
    ...(lastOutcome ? { lastOutcome } : {}),
    ...(lastSummary ? { lastSummary } : {})
  };
}

export function normalizeIntegrationConnectionConfig(input: unknown): IntegrationConnectionConfig {
  if (!isRecord(input)) {
    return {};
  }

  const normalized: Record<string, unknown> = { ...input };
  const schedule = normalizeIntegrationSyncSchedule(input.syncSchedule);

  if (schedule) {
    normalized.syncSchedule = schedule;
  } else {
    delete normalized.syncSchedule;
  }

  return normalized as IntegrationConnectionConfig;
}

export function validateIntegrationConnectionConfig(
  input: unknown
): { ok: true; data: IntegrationConnectionConfig } | { ok: false; error: string } {
  if (!isRecord(input)) {
    return {
      ok: false,
      error: "Invalid integration config payload"
    };
  }

  if (
    input.syncSchedule !== undefined &&
    input.syncSchedule !== null &&
    !normalizeIntegrationSyncSchedule(input.syncSchedule)
  ) {
    return {
      ok: false,
      error: "Invalid integration sync schedule"
    };
  }

  return {
    ok: true,
    data: normalizeIntegrationConnectionConfig(input)
  };
}

export function getIntegrationSyncSchedule(config: unknown) {
  return normalizeIntegrationConnectionConfig(config).syncSchedule ?? null;
}

export function buildIntegrationConnectionConfigWithSchedule(
  config: unknown,
  scheduleInput: Pick<IntegrationSyncSchedule, "enabled" | "frequency">
): IntegrationConnectionConfig {
  const normalized = normalizeIntegrationConnectionConfig(config);
  const existingSchedule = getIntegrationSyncSchedule(normalized);

  return {
    ...normalized,
    syncSchedule: {
      enabled: scheduleInput.enabled,
      frequency: scheduleInput.frequency,
      ...(existingSchedule?.enabledAt ? { enabledAt: existingSchedule.enabledAt } : {}),
      ...(existingSchedule?.lastTriggeredAt
        ? { lastTriggeredAt: existingSchedule.lastTriggeredAt }
        : {}),
      ...(existingSchedule?.lastOutcome ? { lastOutcome: existingSchedule.lastOutcome } : {}),
      ...(existingSchedule?.lastSummary ? { lastSummary: existingSchedule.lastSummary } : {})
    }
  };
}

export function mergeIntegrationConnectionConfigUpdate({
  currentConfig,
  nextConfig,
  now = new Date()
}: {
  currentConfig: unknown;
  nextConfig: unknown;
  now?: Date;
}): IntegrationConnectionConfig {
  const normalizedCurrent = normalizeIntegrationConnectionConfig(currentConfig);
  const normalizedNext = normalizeIntegrationConnectionConfig(nextConfig);

  if (!("syncSchedule" in normalizedNext)) {
    return normalizedNext;
  }

  const currentSchedule = getIntegrationSyncSchedule(normalizedCurrent);
  const nextSchedule = getIntegrationSyncSchedule(normalizedNext);

  if (!nextSchedule) {
    const { syncSchedule: _removedSchedule, ...rest } = normalizedNext;
    return rest as IntegrationConnectionConfig;
  }

  return {
    ...normalizedNext,
    syncSchedule: {
      enabled: nextSchedule.enabled,
      frequency: nextSchedule.frequency,
      ...(currentSchedule?.enabledAt || nextSchedule.enabled
        ? {
            enabledAt: currentSchedule?.enabledAt ?? nextSchedule.enabledAt ?? now.toISOString()
          }
        : {}),
      ...(currentSchedule?.lastTriggeredAt
        ? { lastTriggeredAt: currentSchedule.lastTriggeredAt }
        : nextSchedule.lastTriggeredAt
          ? { lastTriggeredAt: nextSchedule.lastTriggeredAt }
          : {}),
      ...(currentSchedule?.lastOutcome
        ? { lastOutcome: currentSchedule.lastOutcome }
        : nextSchedule.lastOutcome
          ? { lastOutcome: nextSchedule.lastOutcome }
          : {}),
      ...(currentSchedule?.lastSummary
        ? { lastSummary: currentSchedule.lastSummary }
        : nextSchedule.lastSummary
          ? { lastSummary: nextSchedule.lastSummary }
          : {})
    }
  };
}

export function recordIntegrationSyncScheduleExecution({
  config,
  executedAt,
  outcome,
  summary
}: {
  config: unknown;
  executedAt: Date;
  outcome: IntegrationSyncRunOutcome;
  summary?: string | null;
}): IntegrationConnectionConfig {
  const normalized = normalizeIntegrationConnectionConfig(config);
  const schedule = getIntegrationSyncSchedule(normalized);

  if (!schedule) {
    return normalized;
  }

  const nextSummary = normalizeSummary(summary);

  return {
    ...normalized,
    syncSchedule: {
      ...schedule,
      ...(schedule.enabledAt ? {} : { enabledAt: executedAt.toISOString() }),
      lastTriggeredAt: executedAt.toISOString(),
      lastOutcome: outcome,
      ...(nextSummary ? { lastSummary: nextSummary } : {})
    }
  };
}

export function getNextIntegrationSyncDueAt({
  config,
  createdAt,
  lastConnectedAt,
  lastSyncAt
}: {
  config: unknown;
  createdAt: Date | string;
  lastConnectedAt?: Date | string | null;
  lastSyncAt?: Date | string | null;
}) {
  const schedule = getIntegrationSyncSchedule(config);
  if (!schedule?.enabled) {
    return null;
  }

  const candidates = [
    toDate(schedule.enabledAt),
    toDate(schedule.lastTriggeredAt),
    toDate(lastSyncAt),
    toDate(lastConnectedAt),
    toDate(createdAt)
  ].filter((value): value is Date => Boolean(value));

  if (candidates.length === 0) {
    return null;
  }

  const anchor = candidates.reduce((latest, candidate) =>
    candidate.getTime() > latest.getTime() ? candidate : latest
  );

  return addIntegrationSyncInterval(anchor, schedule.frequency);
}

export function isIntegrationSyncDue({
  config,
  createdAt,
  lastConnectedAt,
  lastSyncAt,
  now = new Date()
}: {
  config: unknown;
  createdAt: Date | string;
  lastConnectedAt?: Date | string | null;
  lastSyncAt?: Date | string | null;
  now?: Date;
}) {
  const nextDueAt = getNextIntegrationSyncDueAt({
    config,
    createdAt,
    lastConnectedAt,
    lastSyncAt
  });

  return Boolean(nextDueAt && nextDueAt.getTime() <= now.getTime());
}
