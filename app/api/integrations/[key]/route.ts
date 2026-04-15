/**
 * Single Integration Connection
 * GET    /api/integrations/[key]        → get connection status
 * PATCH  /api/integrations/[key]        → update mode/config
 * DELETE /api/integrations/[key]        → disconnect (keep run history)
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireTenantSession, logApiError } from "@/lib/api/route-helper";
import prisma from "@/lib/db";
import { getIntegrationProvider } from "@/lib/integrations/catalog";
import { buildIntegrationConnectionSnapshot } from "@/lib/integrations/contracts";
import { encryptCredentials } from "@/lib/integrations/credentials";
import {
  mergeIntegrationConnectionConfigUpdate,
  validateIntegrationConnectionConfig
} from "@/lib/integrations/sync-schedule";

type Params = { params: Promise<{ key: string }> };

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { key } = await params;
    const result = await requireTenantSession();
    if (!result.ok) return result.response;
    const { tenantId } = result;

    const connection = await prisma.integrationConnection.findUnique({
      where: { tenantId_providerKey: { tenantId, providerKey: key } },
      select: {
        id: true,
        providerKey: true,
        mode: true,
        status: true,
        lastConnectedAt: true,
        lastSyncAt: true,
        lastHealthCheckAt: true,
        lastError: true,
        config: true,
        createdAt: true,
        updatedAt: true,
        // Include presence flag for credentials without exposing the value
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

    if (!connection) {
      const provider = getIntegrationProvider(key);
      if (!provider) {
        return NextResponse.json({ error: "Unknown integration provider" }, { status: 404 });
      }
      // Return catalog entry with null connection
      return NextResponse.json({ data: { provider, connection: null } });
    }

    // Strip raw credentials; expose only whether they exist
    const { credentialsEncrypted, runs, ...safeConnection } = connection;
    const snapshot = buildIntegrationConnectionSnapshot({
      providerKey: connection.providerKey,
      mode: connection.mode.toString(),
      status: connection.status.toString(),
      config: connection.config,
      lastConnectedAt: connection.lastConnectedAt,
      lastSyncAt: connection.lastSyncAt,
      lastError: connection.lastError,
      hasCredentials: !!credentialsEncrypted,
      runs
    });

    return NextResponse.json({
      data: {
        ...safeConnection,
        ...snapshot
      }
    });
  } catch (error) {
    logApiError("GET integration key error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── PATCH ─────────────────────────────────────────────────────────────────────

const patchSchema = z.object({
  mode: z.enum(["NATIVE_API", "EMBEDDED", "MANUAL_BRIDGE", "ENTERPRISE_CUSTOM"]).optional(),
  config: z.record(z.unknown()).optional(),
  status: z.enum(["DISCONNECTED", "PENDING", "CONNECTED", "DEGRADED", "ERROR"]).optional(),
  // Raw credentials are accepted here and immediately encrypted before storage.
  // Never returned to the client — only stored as credentialsEncrypted.
  credentials: z.record(z.string()).optional()
});

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { key } = await params;
    const result = await requireTenantSession();
    if (!result.ok) return result.response;
    const { tenantId } = result;

    const currentConnection = await prisma.integrationConnection.findUnique({
      where: { tenantId_providerKey: { tenantId, providerKey: key } },
      select: { id: true, config: true }
    });

    if (!currentConnection) {
      return NextResponse.json({ error: "Integration not connected" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const nextConfig =
      parsed.data.config !== undefined
        ? (() => {
            const configValidation = validateIntegrationConnectionConfig(parsed.data.config);
            if (!configValidation.ok) {
              return configValidation;
            }

            return {
              ok: true as const,
              data: mergeIntegrationConnectionConfigUpdate({
                currentConfig: currentConnection.config,
                nextConfig: configValidation.data
              })
            };
          })()
        : null;

    if (nextConfig && !nextConfig.ok) {
      return NextResponse.json({ error: nextConfig.error }, { status: 400 });
    }

    // Encrypt credentials if provided — never store plaintext
    let credentialsUpdate: { credentialsEncrypted?: string | null } = {};
    if (parsed.data.credentials !== undefined) {
      const encrypted = encryptCredentials(parsed.data.credentials);
      credentialsUpdate = { credentialsEncrypted: encrypted };
    }

    const updated = await prisma.integrationConnection.update({
      where: { id: currentConnection.id },
      data: {
        ...(parsed.data.mode ? { mode: parsed.data.mode } : {}),
        ...(nextConfig?.ok ? { config: nextConfig.data } : {}),
        ...(parsed.data.status ? { status: parsed.data.status } : {}),
        ...credentialsUpdate,
        // If credentials were provided, mark as PENDING for re-verification
        ...(parsed.data.credentials && !parsed.data.status ? { status: "PENDING" } : {})
      },
      select: {
        id: true,
        providerKey: true,
        mode: true,
        status: true,
        updatedAt: true
        // credentialsEncrypted intentionally excluded from response
      }
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    logApiError("PATCH integration key error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── DELETE ────────────────────────────────────────────────────────────────────

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { key } = await params;
    const result = await requireTenantSession();
    if (!result.ok) return result.response;
    const { tenantId } = result;

    await prisma.integrationConnection.updateMany({
      where: { tenantId, providerKey: key },
      data: {
        status: "DISCONNECTED",
        credentialsEncrypted: null,
        lastConnectedAt: null,
        lastError: null
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    logApiError("DELETE integration key error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
