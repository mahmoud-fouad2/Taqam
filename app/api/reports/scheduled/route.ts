/**
 * Scheduled Reports API
 *
 * Stores schedules in Tenant.settings JSON (tenant-scoped).
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { logger } from "@/lib/logger";
import type { ScheduledReport } from "@/lib/types/reports";

type ReportsSettings = {
  scheduled?: ScheduledReport[];
};

type TenantSettings = {
  reports?: ReportsSettings;
  [key: string]: unknown;
};

function coerceTenantSettings(value: unknown): TenantSettings {
  return (value && typeof value === "object" ? (value as TenantSettings) : {}) as TenantSettings;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant required" }, { status: 400 });
    }

    const tenant = await prisma.tenant.findFirst({
      where: { id: tenantId },
      select: { settings: true }
    });

    const settings = coerceTenantSettings(tenant?.settings);
    const scheduled = (settings.reports?.scheduled || []) as ScheduledReport[];

    return NextResponse.json({ data: scheduled });
  } catch (error) {
    logger.error("Error fetching scheduled reports", undefined, error);
    return NextResponse.json({ error: "Failed to fetch scheduled reports" }, { status: 500 });
  }
}
