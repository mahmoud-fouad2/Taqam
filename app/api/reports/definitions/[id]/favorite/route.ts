/**
 * Toggle report favorite flag.
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { logger } from "@/lib/logger";
import type { ReportDefinition } from "@/lib/types/reports";
import { Prisma } from "@prisma/client";
import { requireRole } from "@/lib/api/route-helper";

const REPORTS_ALLOWED_ROLES = ["TENANT_ADMIN", "HR_MANAGER"];

type ReportsSettings = {
  definitions?: ReportDefinition[];
};

type TenantSettings = {
  reports?: ReportsSettings;
  [key: string]: unknown;
};

function coerceTenantSettings(value: unknown): TenantSettings {
  return (value && typeof value === "object" ? (value as TenantSettings) : {}) as TenantSettings;
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireRole(request, REPORTS_ALLOWED_ROLES);
    if (!auth.ok) return auth.response;
    const { tenantId } = auth;

    const { id } = await context.params;

    const tenant = await prisma.tenant.findFirst({
      where: { id: tenantId },
      select: { settings: true }
    });

    const settings = coerceTenantSettings(tenant?.settings);
    const defs = (settings.reports?.definitions || []) as ReportDefinition[];

    const idx = defs.findIndex((d) => d.id === id);
    if (idx === -1) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const updated: ReportDefinition = {
      ...defs[idx],
      isFavorite: !defs[idx].isFavorite
    };

    const nextDefs = [...defs];
    nextDefs[idx] = updated;

    const nextSettings: TenantSettings = {
      ...settings,
      reports: {
        ...(settings.reports || {}),
        definitions: nextDefs
      }
    };

    await prisma.tenant.update({
      where: { id: tenantId },
      data: { settings: nextSettings as unknown as Prisma.InputJsonValue }
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    logger.error("Error toggling report favorite", undefined, error);
    return NextResponse.json({ error: "Failed to update report" }, { status: 500 });
  }
}
