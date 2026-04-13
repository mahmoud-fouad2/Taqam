import { Metadata } from "next";
import { requireTenantAccess } from "@/lib/auth";
import prisma from "@/lib/db";
import { INTEGRATION_PROVIDERS } from "@/lib/integrations/catalog";
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
          durationMs: true,
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
      connection: conn
        ? {
            providerKey: conn.providerKey,
            mode: conn.mode.toString(),
            status: conn.status.toString(),
            lastConnectedAt: conn.lastConnectedAt?.toISOString() ?? null,
            lastSyncAt: conn.lastSyncAt?.toISOString() ?? null,
            lastError: conn.lastError ?? null,
            hasCredentials: !!conn.credentialsEncrypted,
            runs: conn.runs.map((r) => ({
              id: r.id,
              operation: r.operation,
              status: r.status,
              summary: r.summary ?? null,
              errorMessage: r.errorMessage ?? null,
              durationMs: r.durationMs ?? null,
              startedAt: r.startedAt.toISOString(),
              finishedAt: r.finishedAt?.toISOString() ?? null
            }))
          }
        : null
    };
  });

  return <IntegrationsShowcase catalog={catalog} />;
}
