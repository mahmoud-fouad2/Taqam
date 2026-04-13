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
import { encryptCredentials, decryptCredentials } from "@/lib/integrations/credentials";

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
    const { credentialsEncrypted, ...safeConnection } = connection;
    return NextResponse.json({
      data: { ...safeConnection, hasCredentials: !!credentialsEncrypted }
    });
  } catch (error) {
    logApiError("GET integration key error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── PATCH ─────────────────────────────────────────────────────────────────────

const patchSchema = z.object({
  mode: z
    .enum(["NATIVE_API", "EMBEDDED", "MANUAL_BRIDGE", "ENTERPRISE_CUSTOM"])
    .optional(),
  config: z.record(z.unknown()).optional(),
  status: z
    .enum(["DISCONNECTED", "PENDING", "CONNECTED", "DEGRADED", "ERROR"])
    .optional(),
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

    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Encrypt credentials if provided — never store plaintext
    let credentialsUpdate: { credentialsEncrypted?: string | null } = {};
    if (parsed.data.credentials !== undefined) {
      const encrypted = encryptCredentials(parsed.data.credentials);
      credentialsUpdate = { credentialsEncrypted: encrypted };
    }

    const updated = await prisma.integrationConnection.update({
      where: { tenantId_providerKey: { tenantId, providerKey: key } },
      data: {
        ...(parsed.data.mode ? { mode: parsed.data.mode } : {}),
        ...(parsed.data.config !== undefined ? { config: parsed.data.config } : {}),
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

