/**
 * Integrations API — Tenant
 * GET  /api/integrations          → list connections + catalog for this tenant
 * POST /api/integrations          → create / upsert connection
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireTenantSession, logApiError } from "@/lib/api/route-helper";
import { checkRateLimit, withRateLimitHeaders } from "@/lib/rate-limit";
import prisma from "@/lib/db";
import { INTEGRATION_PROVIDERS, getIntegrationProvider } from "@/lib/integrations/catalog";
import { hasFeature, requiredPlanAr } from "@/lib/feature-gate";
import {
  supportsIntegrationProviderSyncAdapter
} from "@/lib/integrations/provider-adapters";
import {
  type IntegrationConnectionConfig,
  validateIntegrationConnectionConfig
} from "@/lib/integrations/sync-schedule";

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const result = await requireTenantSession();
    if (!result.ok) return result.response;
    const { tenantId } = result;

    const connections = await prisma.integrationConnection.findMany({
      where: { tenantId },
      select: {
        id: true,
        providerKey: true,
        mode: true,
        status: true,
        config: true,
        lastConnectedAt: true,
        lastSyncAt: true,
        lastHealthCheckAt: true,
        lastError: true,
        createdAt: true,
        updatedAt: true
        // ← credentialsEncrypted is intentionally excluded
      }
    });

    const connectionMap = new Map(connections.map((c) => [c.providerKey, c]));

    const catalog = INTEGRATION_PROVIDERS.map((provider) => ({
      ...provider,
      supportsScheduledSync: supportsIntegrationProviderSyncAdapter(provider.key),
      connection: connectionMap.get(provider.key) ?? null
    }));

    return NextResponse.json({ data: catalog });
  } catch (error) {
    logApiError("GET integrations error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── POST ──────────────────────────────────────────────────────────────────────

const connectSchema = z.object({
  providerKey: z.string().min(1).max(80),
  mode: z
    .enum(["NATIVE_API", "EMBEDDED", "MANUAL_BRIDGE", "ENTERPRISE_CUSTOM"])
    .optional(),
  config: z.record(z.unknown()).optional()
});

export async function POST(req: NextRequest) {
  try {
    const result = await requireTenantSession(req);
    if (!result.ok) return result.response;
    const { tenantId } = result;

    const rateLimit = await checkRateLimit(req, {
      keyPrefix: `integrations:${tenantId}`,
      limit: 30,
      windowMs: 60_000
    });
    if (!rateLimit.allowed) {
      return withRateLimitHeaders(
        NextResponse.json({ error: "طلبات كثيرة، حاول لاحقاً" }, { status: 429 }),
        rateLimit
      );
    }

    // Feature gate: integrations require PROFESSIONAL plan or above
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { plan: true }
    });
    if (!tenant || !hasFeature(tenant.plan, "integrations")) {
      return NextResponse.json(
        {
          error: `التكاملات متاحة ضمن خطة ${requiredPlanAr("integrations")} أو أعلى`,
          code: "PLAN_UPGRADE_REQUIRED"
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = connectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { providerKey, mode, config } = parsed.data;
    let normalizedConfig: IntegrationConnectionConfig | undefined;

    if (config !== undefined) {
      const configValidation = validateIntegrationConnectionConfig(config);
      if (!configValidation.ok) {
        return NextResponse.json({ error: configValidation.error }, { status: 400 });
      }

      normalizedConfig = configValidation.data;
    }

    const provider = getIntegrationProvider(providerKey);
    if (!provider) {
      return NextResponse.json({ error: "Unknown integration provider" }, { status: 404 });
    }

    const connection = await prisma.integrationConnection.upsert({
      where: { tenantId_providerKey: { tenantId, providerKey } },
      create: {
        tenantId,
        providerKey,
        mode: mode ?? provider.defaultMode,
        status: "PENDING",
        ...(normalizedConfig !== undefined ? { config: normalizedConfig } : {})
      },
      update: {
        mode: mode ?? provider.defaultMode,
        status: "PENDING",
        ...(normalizedConfig !== undefined ? { config: normalizedConfig } : {}),
        lastError: null
      },
      select: {
        id: true,
        providerKey: true,
        mode: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return withRateLimitHeaders(
      NextResponse.json({ data: connection }, { status: 201 }),
      rateLimit
    );
  } catch (error) {
    logApiError("POST integrations error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
