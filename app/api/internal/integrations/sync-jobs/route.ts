import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { logger } from "@/lib/logger";
import { runScheduledIntegrationSyncJobs } from "@/lib/integrations/sync-jobs";

function hasValidCronSecret(req: NextRequest) {
  const configuredSecret = process.env.INTEGRATION_SYNC_CRON_SECRET;
  if (!configuredSecret) {
    return { ok: false as const, status: 503, error: "Cron secret is not configured" };
  }

  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { ok: false as const, status: 401, error: "Unauthorized" };
  }

  const providedSecret = authHeader.slice("Bearer ".length);
  if (providedSecret.length !== configuredSecret.length) {
    return { ok: false as const, status: 401, error: "Unauthorized" };
  }

  const matches = timingSafeEqual(Buffer.from(providedSecret), Buffer.from(configuredSecret));

  return matches
    ? { ok: true as const }
    : { ok: false as const, status: 401, error: "Unauthorized" };
}

export async function POST(req: NextRequest) {
  try {
    const auth = hasValidCronSecret(req);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const result = await runScheduledIntegrationSyncJobs();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    logger.error("Internal integration sync job trigger failed", undefined, error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
