import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import prisma from "@/lib/db";
import { requireTenantSession } from "@/lib/api/route-helper";
import type { GOSISettings } from "@/lib/types/payroll";

const DEFAULT_GOSI_SETTINGS: Omit<GOSISettings, "tenantId"> = {
  employeePercentage: 9.75,
  employerPercentage: 11.75,
  maxSalary: 45000,
  isEnabled: true
};

function normalizeGosiSettings(tenantId: string, value: unknown): GOSISettings {
  if (!value || typeof value !== "object") {
    return { tenantId, ...DEFAULT_GOSI_SETTINGS };
  }

  const input = value as Partial<GOSISettings>;
  return {
    tenantId,
    employeePercentage:
      typeof input.employeePercentage === "number"
        ? input.employeePercentage
        : DEFAULT_GOSI_SETTINGS.employeePercentage,
    employerPercentage:
      typeof input.employerPercentage === "number"
        ? input.employerPercentage
        : DEFAULT_GOSI_SETTINGS.employerPercentage,
    maxSalary:
      typeof input.maxSalary === "number" ? input.maxSalary : DEFAULT_GOSI_SETTINGS.maxSalary,
    isEnabled:
      typeof input.isEnabled === "boolean" ? input.isEnabled : DEFAULT_GOSI_SETTINGS.isEnabled
  };
}

function getStoredGosiSettings(settings: unknown) {
  if (!settings || typeof settings !== "object") {
    return undefined;
  }

  const settingsObject = settings as Record<string, unknown>;
  const payroll = settingsObject.payroll;
  if (payroll && typeof payroll === "object") {
    const payrollObject = payroll as Record<string, unknown>;
    if (payrollObject.gosiSettings) {
      return payrollObject.gosiSettings;
    }
  }

  if (settingsObject.gosiSettings) {
    return settingsObject.gosiSettings;
  }

  return undefined;
}

function mergeGosiSettings(settings: unknown, gosiSettings: GOSISettings) {
  const settingsObject =
    settings && typeof settings === "object" ? { ...(settings as Record<string, unknown>) } : {};
  const payrollObject =
    settingsObject.payroll && typeof settingsObject.payroll === "object"
      ? { ...(settingsObject.payroll as Record<string, unknown>) }
      : {};

  payrollObject.gosiSettings = gosiSettings;
  settingsObject.payroll = payrollObject;
  settingsObject.gosiSettings = gosiSettings;

  return settingsObject;
}

function validateGosiPayload(input: Partial<GOSISettings>) {
  if (
    input.employeePercentage !== undefined &&
    (!Number.isFinite(input.employeePercentage) ||
      input.employeePercentage < 0 ||
      input.employeePercentage > 100)
  ) {
    return "employeePercentage must be between 0 and 100";
  }

  if (
    input.employerPercentage !== undefined &&
    (!Number.isFinite(input.employerPercentage) ||
      input.employerPercentage < 0 ||
      input.employerPercentage > 100)
  ) {
    return "employerPercentage must be between 0 and 100";
  }

  if (input.maxSalary !== undefined && (!Number.isFinite(input.maxSalary) || input.maxSalary < 0)) {
    return "maxSalary must be greater than or equal to 0";
  }

  return null;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireTenantSession(request);
    if (!auth.ok) return auth.response;
    const { tenantId } = auth;

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true }
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const gosiSettings = normalizeGosiSettings(tenantId, getStoredGosiSettings(tenant.settings));

    if (!getStoredGosiSettings(tenant.settings)) {
      const merged = mergeGosiSettings(tenant.settings, gosiSettings);
      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          settings: merged as Prisma.InputJsonValue
        }
      });
    }

    return NextResponse.json({ data: gosiSettings });
  } catch (error) {
    console.error("Error loading GOSI settings:", error);
    return NextResponse.json({ error: "Failed to load GOSI settings" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireTenantSession(request);
    if (!auth.ok) return auth.response;
    const { tenantId } = auth;

    const body = (await request.json().catch(() => null)) as Partial<GOSISettings> | null;
    if (!body) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const validationError = validateGosiPayload(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true }
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const current = normalizeGosiSettings(tenantId, getStoredGosiSettings(tenant.settings));
    const next = normalizeGosiSettings(tenantId, {
      ...current,
      ...body,
      tenantId
    });

    const merged = mergeGosiSettings(tenant.settings, next);
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        settings: merged as Prisma.InputJsonValue
      }
    });

    return NextResponse.json({ data: next });
  } catch (error) {
    console.error("Error saving GOSI settings:", error);
    return NextResponse.json({ error: "Failed to save GOSI settings" }, { status: 500 });
  }
}
