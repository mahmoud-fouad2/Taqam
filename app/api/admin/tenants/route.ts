/**
 * Admin Tenants API Routes - Super Admin Only
 * /api/admin/tenants
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { Tenant, TenantStatus } from "@/lib/types/tenant";
import type { Prisma } from "@prisma/client";

const UNLIMITED_EMPLOYEES = 1_000_000;

const VALID_TENANT_STATUSES = new Set(["PENDING", "ACTIVE", "SUSPENDED", "CANCELLED"]);

function normalizeTenantStatus(
  input: unknown
): "PENDING" | "ACTIVE" | "SUSPENDED" | "CANCELLED" | undefined {
  const v = String(input ?? "").trim();
  if (!v) return undefined;
  const upper = v.toUpperCase();
  if (VALID_TENANT_STATUSES.has(upper)) return upper as any;
  return undefined;
}

function mapPlanFromDb(plan: unknown): Tenant["plan"] {
  const v = String(plan ?? "").toUpperCase();
  if (v === "ENTERPRISE") return "enterprise";
  if (v === "PROFESSIONAL" || v === "BUSINESS") return "business";
  if (v === "BASIC" || v === "STARTER" || v === "TRIAL") return "starter";
  // Also accept already-normalized values.
  const lower = String(plan ?? "").toLowerCase();
  if (lower === "enterprise" || lower === "business" || lower === "starter")
    return lower as Tenant["plan"];
  return "starter";
}

function mapPlanToDb(plan: unknown): "TRIAL" | "BASIC" | "PROFESSIONAL" | "ENTERPRISE" {
  const v = String(plan ?? "").toLowerCase();
  if (v === "starter" || v === "basic") return "BASIC";
  if (v === "business" || v === "professional") return "PROFESSIONAL";
  if (v === "enterprise") return "ENTERPRISE";
  if (v === "trial") return "TRIAL";
  return "TRIAL";
}

function planToPricingSlug(
  plan: ReturnType<typeof mapPlanToDb>
): "starter" | "business" | "enterprise" {
  if (plan === "ENTERPRISE") return "enterprise";
  if (plan === "PROFESSIONAL") return "business";
  return "starter";
}

function readSettings(t: any): Record<string, unknown> {
  return (t?.settings as Record<string, unknown>) ?? {};
}

function readString(v: unknown): string | undefined {
  if (typeof v === "string" && v.trim()) return v;
  return undefined;
}

function pickString(settings: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const v = readString(settings[key]);
    if (v) return v;
  }
  return undefined;
}

// Map DB tenant to client format
function mapTenant(t: any): Tenant {
  const settings = readSettings(t);
  return {
    id: t.id,
    name: t.name,
    nameAr: t.nameAr ?? t.name,
    slug: t.slug,
    status: (t.status?.toLowerCase() ?? "pending") as TenantStatus,
    plan: mapPlanFromDb(t.plan),
    email: pickString(settings, ["contactEmail", "companyEmail"]) ?? "",
    phone: pickString(settings, ["contactPhone", "companyPhone"]),
    address: pickString(settings, ["address"]),
    city: pickString(settings, ["city"]),
    country: pickString(settings, ["country"]) ?? "SA",
    defaultLocale: (pickString(settings, ["defaultLocale"]) as Tenant["defaultLocale"]) ?? "ar",
    defaultTheme: (pickString(settings, ["defaultTheme"]) as Tenant["defaultTheme"]) ?? "shadcn",
    timezone: t.timezone ?? "Asia/Riyadh",
    usersCount: t._count?.users ?? 0,
    employeesCount: t._count?.employees ?? 0,
    createdAt: t.createdAt?.toISOString() ?? new Date().toISOString(),
    updatedAt: t.updatedAt?.toISOString() ?? new Date().toISOString(),
    createdBy: t.createdBy ?? ""
  };
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Only Super Admin can access this
    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ success: false, error: "Access denied" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "50");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status");
    const subscriptionPlan = searchParams.get("subscriptionPlan");

    const where: any = {
      // Default: hide cancelled/deleted tenants unless explicitly requested.
      status: { not: "CANCELLED" }
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { nameAr: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
        { domain: { contains: search, mode: "insensitive" } }
      ];
    }

    if (status) {
      const normalized = normalizeTenantStatus(status);
      if (!normalized) {
        return NextResponse.json(
          { success: false, error: "Invalid status filter" },
          { status: 400 }
        );
      }
      where.status = normalized;
    }

    if (subscriptionPlan) {
      where.plan = mapPlanToDb(subscriptionPlan);
    }

    const [tenants, total] = await Promise.all([
      prisma.tenant.findMany({
        where,
        include: {
          _count: {
            select: {
              employees: true,
              users: true
            }
          }
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      prisma.tenant.count({ where })
    ]);

    return NextResponse.json({
      success: true,
      data: tenants.map(mapTenant),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    console.error("Error fetching tenants:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch tenants" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ success: false, error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();

    const incomingSettings: Record<string, unknown> =
      body.settings && typeof body.settings === "object" ? body.settings : {};

    const normalizedSettings: Prisma.InputJsonObject = {
      ...incomingSettings,
      ...(body.defaultLocale !== undefined && { defaultLocale: body.defaultLocale }),
      ...(body.defaultTheme !== undefined && { defaultTheme: body.defaultTheme }),
      ...(body.email !== undefined && { contactEmail: body.email }),
      ...(body.phone !== undefined && { contactPhone: body.phone }),
      ...(incomingSettings.companyEmail !== undefined && incomingSettings.contactEmail === undefined
        ? { contactEmail: incomingSettings.companyEmail }
        : {}),
      ...(incomingSettings.companyPhone !== undefined && incomingSettings.contactPhone === undefined
        ? { contactPhone: incomingSettings.companyPhone }
        : {})
    } as Prisma.InputJsonObject;

    // Check if slug is unique
    const existingTenant = await prisma.tenant.findFirst({
      where: {
        OR: [{ slug: body.slug }, body.domain ? { domain: body.domain } : {}].filter(
          (c) => Object.keys(c).length > 0
        )
      }
    });

    if (existingTenant) {
      return NextResponse.json(
        { success: false, error: "Slug or domain already exists" },
        { status: 400 }
      );
    }

    const plan = mapPlanToDb(body.plan);

    const platformSettings = await prisma.platformSettings.findFirst({
      select: { trialDays: true, trialMaxEmployees: true }
    });
    const trialDaysRaw = platformSettings?.trialDays ?? 14;
    const trialDays = Number.isFinite(trialDaysRaw) && trialDaysRaw > 0 ? trialDaysRaw : 14;
    const trialMaxEmployeesRaw = platformSettings?.trialMaxEmployees ?? 10;
    const trialMaxEmployees =
      Number.isFinite(trialMaxEmployeesRaw) && trialMaxEmployeesRaw > 0 ? trialMaxEmployeesRaw : 10;

    const planSlugFromBody = typeof body.plan === "string" ? body.plan.trim().toLowerCase() : "";
    const pricingSlug: "starter" | "business" | "enterprise" =
      planSlugFromBody === "starter" ||
      planSlugFromBody === "business" ||
      planSlugFromBody === "enterprise"
        ? (planSlugFromBody as any)
        : planToPricingSlug(plan);

    const pricingPlan =
      plan === "TRIAL"
        ? null
        : await prisma.pricingPlan.findUnique({
            where: { slug: pricingSlug },
            select: { maxEmployees: true }
          });

    const maxEmployeesValueRaw = body.maxEmployees;
    const maxEmployeesValue =
      typeof maxEmployeesValueRaw === "number"
        ? maxEmployeesValueRaw
        : typeof maxEmployeesValueRaw === "string" && maxEmployeesValueRaw.trim()
          ? Number(maxEmployeesValueRaw)
          : undefined;
    const maxEmployeesInput =
      maxEmployeesValue !== undefined && Number.isFinite(maxEmployeesValue) && maxEmployeesValue > 0
        ? Math.trunc(maxEmployeesValue)
        : undefined;
    if (body.maxEmployees !== undefined && maxEmployeesInput === undefined) {
      return NextResponse.json({ success: false, error: "Invalid maxEmployees" }, { status: 400 });
    }

    const maxEmployees =
      maxEmployeesInput ??
      (plan === "TRIAL"
        ? trialMaxEmployees
        : pricingPlan
          ? pricingPlan.maxEmployees === null
            ? UNLIMITED_EMPLOYEES
            : pricingPlan.maxEmployees
          : plan === "BASIC"
            ? 25
            : plan === "PROFESSIONAL"
              ? 100
              : UNLIMITED_EMPLOYEES);

    const hasPlanExpiresAt = Object.prototype.hasOwnProperty.call(body, "planExpiresAt");
    const planExpiresAtRaw = body.planExpiresAt;
    let planExpiresAt: Date | null;
    if (!hasPlanExpiresAt) {
      planExpiresAt =
        plan === "TRIAL" ? new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000) : null;
    } else if (planExpiresAtRaw === null || planExpiresAtRaw === "") {
      planExpiresAt = null;
    } else if (typeof planExpiresAtRaw === "string") {
      const d = new Date(planExpiresAtRaw);
      if (Number.isNaN(d.getTime())) {
        return NextResponse.json(
          { success: false, error: "Invalid planExpiresAt" },
          { status: 400 }
        );
      }
      planExpiresAt = d;
    } else {
      return NextResponse.json({ success: false, error: "Invalid planExpiresAt" }, { status: 400 });
    }

    const tenant = await prisma.tenant.create({
      data: {
        name: body.name,
        nameAr: body.nameAr ?? body.name,
        slug: body.slug,
        domain: body.domain,
        logo: body.logo,
        timezone: body.timezone || "Asia/Riyadh",
        currency: body.currency || "SAR",
        weekStartDay: body.weekStartDay || 0,
        plan,
        planExpiresAt,
        maxEmployees,
        status: "ACTIVE",
        settings: normalizedSettings
      },
      include: {
        _count: {
          select: {
            employees: true,
            users: true
          }
        }
      }
    });

    return NextResponse.json({ success: true, data: mapTenant(tenant) }, { status: 201 });
  } catch (error) {
    console.error("Error creating tenant:", error);
    return NextResponse.json({ success: false, error: "Failed to create tenant" }, { status: 500 });
  }
}
