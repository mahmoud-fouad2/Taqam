import { Metadata } from "next";
import { requireTenantAccess } from "@/lib/auth";
import prisma from "@/lib/db";
import { INTEGRATION_PROVIDERS } from "@/lib/integrations/catalog";
import { buildIntegrationConnectionSnapshot } from "@/lib/integrations/contracts";
import { supportsIntegrationProviderSyncAdapter } from "@/lib/integrations/provider-adapters";
import { IntegrationsShowcase } from "./integrations-showcase";
import { generateMeta } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  return generateMeta({
    title: "التكاملات | الإعدادات",
    description: "إدارة تكاملات طاقم مع الأنظمة الخارجية"
  });
}

export default async function IntegrationsPage() {
  const user = await requireTenantAccess();

  const connections = await prisma.integrationConnection.findMany({
    where: { tenantId: user.tenantId },
    select: {
      providerKey: true,
      mode: true,
      status: true,
      config: true,
      lastConnectedAt: true,
      lastSyncAt: true,
      lastError: true,
      credentialsEncrypted: true,
      runs: {
        orderBy: { startedAt: "desc" },
        take: 10,
        select: {
          id: true,
          operation: true,
          status: true,
          summary: true,
          errorMessage: true,
          logs: true,
          durationMs: true,
          retryCount: true,
          startedAt: true,
          finishedAt: true
        }
      }
    }
  });

  const connectionMap = new Map(connections.map((c) => [c.providerKey, c]));

  const catalog = INTEGRATION_PROVIDERS.map((provider) => {
    const conn = connectionMap.get(provider.key);
    return {
      ...provider,
      supportsScheduledSync: supportsIntegrationProviderSyncAdapter(provider.key),
      connection: conn
        ? buildIntegrationConnectionSnapshot({
            providerKey: conn.providerKey,
            mode: conn.mode.toString(),
            status: conn.status.toString(),
            config: conn.config,
            lastConnectedAt: conn.lastConnectedAt,
            lastSyncAt: conn.lastSyncAt,
            lastError: conn.lastError,
            hasCredentials: !!conn.credentialsEncrypted,
            runs: conn.runs
          })
        : null
    };
  });

  return <IntegrationsShowcase catalog={catalog} />;
}
