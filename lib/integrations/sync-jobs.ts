import { hasFeature } from "@/lib/feature-gate";
import { logger } from "@/lib/logger";
import prisma from "@/lib/db";
import { getTenantAccessIssue } from "@/lib/tenant-access";
import { executeIntegrationSync } from "@/lib/integrations/sync-executor";
import { SUPPORTED_INTEGRATION_PROVIDER_SYNC_ADAPTERS } from "@/lib/integrations/provider-adapters";
import { isIntegrationSyncDue } from "@/lib/integrations/sync-schedule";

export async function runScheduledIntegrationSyncJobs({ now = new Date() } = {}) {
  const eligibleConnections = await prisma.integrationConnection.findMany({
    where: {
      providerKey: { in: [...SUPPORTED_INTEGRATION_PROVIDER_SYNC_ADAPTERS] },
      status: { in: ["CONNECTED", "DEGRADED"] }
    },
    select: {
      tenantId: true,
      providerKey: true,
      config: true,
      createdAt: true,
      lastConnectedAt: true,
      lastSyncAt: true,
      tenant: {
        select: {
          status: true,
          plan: true,
          planExpiresAt: true
        }
      }
    }
  });

  const dueConnections = eligibleConnections.filter((connection) => {
    const tenantIssue = getTenantAccessIssue(connection.tenant);
    if (tenantIssue) {
      return false;
    }

    if (!hasFeature(connection.tenant.plan, "integrations")) {
      return false;
    }

    return isIntegrationSyncDue({
      config: connection.config,
      createdAt: connection.createdAt,
      lastConnectedAt: connection.lastConnectedAt,
      lastSyncAt: connection.lastSyncAt,
      now
    });
  });

  const results: Array<{
    tenantId: string;
    providerKey: string;
    ok: boolean;
    runStatus?: string;
    summary?: string;
    error?: string;
    runId?: string;
  }> = [];

  for (const connection of dueConnections) {
    const result = await executeIntegrationSync({
      tenantId: connection.tenantId,
      providerKey: connection.providerKey,
      trigger: "scheduled"
    });

    results.push({
      tenantId: connection.tenantId,
      providerKey: connection.providerKey,
      ok: result.ok,
      runStatus: result.ok ? result.runStatus : result.runStatus,
      summary: result.ok ? result.summary : undefined,
      error: result.ok ? undefined : result.error,
      runId: result.runId
    });
  }

  const successCount = results.filter((result) => result.runStatus === "success").length;
  const partialCount = results.filter((result) => result.runStatus === "partial").length;
  const failedCount = results.filter((result) => result.runStatus === "failed").length;

  logger.info("Scheduled integration sync jobs completed", {
    dueConnections: dueConnections.length,
    successCount,
    partialCount,
    failedCount
  });

  return {
    scannedConnections: eligibleConnections.length,
    dueConnections: dueConnections.length,
    executedConnections: results.length,
    successCount,
    partialCount,
    failedCount,
    results
  };
}
