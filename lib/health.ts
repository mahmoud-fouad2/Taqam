import type {
  RuntimeIntegrationId,
  RuntimeIntegrationMode,
  RuntimeIntegrationReport
} from "@/lib/runtime-integrations";

export type SystemHealthStatus = "ok" | "degraded" | "error";
export type DatabaseHealthStatus = "connected" | "error" | "unknown";

export type SystemHealthSnapshot = {
  status: SystemHealthStatus;
  httpStatus: 200 | 503;
  timestamp: string;
  uptimeSeconds: number;
  database: {
    status: DatabaseHealthStatus;
  };
  runtime: RuntimeIntegrationReport;
};

export type PublicSystemHealthSnapshot = Omit<SystemHealthSnapshot, "runtime"> & {
  runtime: {
    summary: RuntimeIntegrationReport["summary"];
    items: Array<{
      id: RuntimeIntegrationId;
      name: string;
      mode: RuntimeIntegrationMode;
    }>;
  };
};

export function deriveSystemHealthSnapshot({
  databaseStatus,
  runtimeReport,
  timestamp = new Date(),
  uptimeSeconds = process.uptime()
}: {
  databaseStatus: DatabaseHealthStatus;
  runtimeReport: RuntimeIntegrationReport;
  timestamp?: Date;
  uptimeSeconds?: number;
}): SystemHealthSnapshot {
  const hasRuntimeGaps = runtimeReport.summary.partial > 0 || runtimeReport.summary.missing > 0;

  const status: SystemHealthStatus =
    databaseStatus !== "connected" ? "error" : hasRuntimeGaps ? "degraded" : "ok";

  return {
    status,
    httpStatus: status === "error" ? 503 : 200,
    timestamp: timestamp.toISOString(),
    uptimeSeconds,
    database: {
      status: databaseStatus
    },
    runtime: runtimeReport
  };
}

export function toPublicSystemHealthSnapshot(
  snapshot: SystemHealthSnapshot
): PublicSystemHealthSnapshot {
  return {
    status: snapshot.status,
    httpStatus: snapshot.httpStatus,
    timestamp: snapshot.timestamp,
    uptimeSeconds: snapshot.uptimeSeconds,
    database: snapshot.database,
    runtime: {
      summary: snapshot.runtime.summary,
      items: snapshot.runtime.items.map((item) => ({
        id: item.id,
        name: item.name,
        mode: item.mode
      }))
    }
  };
}
