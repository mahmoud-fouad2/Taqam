/**
 * Reports Definitions API
 *
 * Stores report definitions in Tenant.settings JSON (tenant-scoped).
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
  scheduled?: unknown[];
};

type TenantSettings = {
  reports?: ReportsSettings;
  [key: string]: unknown;
};

function coerceTenantSettings(value: unknown): TenantSettings {
  return (value && typeof value === "object" ? (value as TenantSettings) : {}) as TenantSettings;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, REPORTS_ALLOWED_ROLES);
    if (!auth.ok) return auth.response;
    const { tenantId } = auth;

    const tenant = await prisma.tenant.findFirst({
      where: { id: tenantId },
      select: { settings: true }
    });

    const settings = coerceTenantSettings(tenant?.settings);
    const definitions = (settings.reports?.definitions || []) as ReportDefinition[];

    return NextResponse.json({ data: definitions });
  } catch (error) {
    logger.error("Error fetching report definitions", undefined, error);
    return NextResponse.json({ error: "Failed to fetch report definitions" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, REPORTS_ALLOWED_ROLES);
    if (!auth.ok) return auth.response;
    const { tenantId, session } = auth;

    const body = (await request.json().catch(() => null)) as Partial<ReportDefinition> | null;
    if (!body?.name || !body.category || !body.format) {
      return NextResponse.json({ error: "name, category, format are required" }, { status: 400 });
    }

    const nowIso = new Date().toISOString();
    const id = `rpt_${Date.now()}_${Math.random().toString(16).slice(2)}`;

    const definition: ReportDefinition = {
      id,
      name: body.name,
      nameEn: body.nameEn,
      description: body.description,
      category: body.category,
      format: body.format,
      icon: body.icon,
      parameters: body.parameters,
      columns: body.columns,
      isFavorite: false,
      isScheduled: false,
      lastRun: undefined,
      createdBy: session.user.id,
      createdAt: nowIso
    };

    const tenant = await prisma.tenant.findFirst({
      where: { id: tenantId },
      select: { settings: true }
    });

    const settings = coerceTenantSettings(tenant?.settings);
    const existing = (settings.reports?.definitions || []) as ReportDefinition[];

    const nextSettings: TenantSettings = {
      ...settings,
      reports: {
        ...(settings.reports || {}),
        definitions: [definition, ...existing]
      }
    };

    await prisma.tenant.update({
      where: { id: tenantId },
      data: { settings: nextSettings as unknown as Prisma.InputJsonValue }
    });

    return NextResponse.json({ data: definition }, { status: 201 });
  } catch (error) {
    logger.error("Error creating report definition", undefined, error);
    return NextResponse.json({ error: "Failed to create report" }, { status: 500 });
  }
}
