/**
 * Tenants API Routes - Super Admin Only
 */

import { logApiError } from "@/lib/api/route-helper";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const UNLIMITED_EMPLOYEES = 1_000_000;

type DbTenantPlan = "TRIAL" | "BASIC" | "PROFESSIONAL" | "ENTERPRISE";

function normalizeDbPlan(value: unknown): DbTenantPlan {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return "TRIAL";

  const v = raw.toLowerCase();
  if (v === "trial") return "TRIAL";
  if (v === "starter" || v === "basic") return "BASIC";
  if (v === "business" || v === "professional") return "PROFESSIONAL";
  if (v === "enterprise") return "ENTERPRISE";

  const upper = raw.toUpperCase();
  if (
    upper === "TRIAL" ||
    upper === "BASIC" ||
    upper === "PROFESSIONAL" ||
    upper === "ENTERPRISE"
  ) {
    return upper;
  }

  return "TRIAL";
}

function planToPricingSlug(plan: DbTenantPlan): "starter" | "business" | "enterprise" {
  if (plan === "ENTERPRISE") return "enterprise";
  if (plan === "PROFESSIONAL") return "business";
  return "starter";
}

const createTenantSchema = z.object({
  name: z.string().min(1),
  nameAr: z.string().optional(),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/),
  domain: z.string().optional(),
  logo: z.string().optional(),
  timezone: z.string().optional(),
  currency: z.string().optional(),
  weekStartDay: z.number().int().min(0).max(6).optional(),
  plan: z.string().optional(),
  planExpiresAt: z.string().optional(),
  maxEmployees: z.number().int().positive().optional(),
  settings: z.record(z.unknown()).optional()
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only Super Admin can access this
    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status");

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
        { domain: { contains: search, mode: "insensitive" } }
      ];
    }

    if (status) {
      where.status = status;
    }

    const [tenants, total] = await Promise.all([
      prisma.tenant.findMany({
        where,
        include: {
          _count: {
            select: {
              employees: true,
              departments: true
            }
          }
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.tenant.count({ where })
    ]);

    return NextResponse.json({
      data: tenants,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logApiError("Error fetching tenants", error);
    return NextResponse.json({ error: "Failed to fetch tenants" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const rawBody = await request.json();
    const tenantValidation = createTenantSchema.safeParse(rawBody);
    if (!tenantValidation.success) {
      return NextResponse.json(
        { error: "بيانات غير صالحة", details: tenantValidation.error.flatten() },
        { status: 400 }
      );
    }
    const body = rawBody;

    // Check if slug is unique
    const existingTenant = await prisma.tenant.findFirst({
      where: {
        OR: [{ slug: body.slug }, { domain: body.domain }]
      }
    });

    if (existingTenant) {
      return NextResponse.json({ error: "Slug or domain already exists" }, { status: 400 });
    }

    const plan = normalizeDbPlan(body.plan);

    const platformSettings = await prisma.platformSettings.findFirst({
      select: { trialDays: true, trialMaxEmployees: true }
    });
    const trialDaysRaw = platformSettings?.trialDays ?? 14;
    const trialDays = Number.isFinite(trialDaysRaw) && trialDaysRaw > 0 ? trialDaysRaw : 14;
    const trialMaxEmployeesRaw = platformSettings?.trialMaxEmployees ?? 10;
    const trialMaxEmployees =
      Number.isFinite(trialMaxEmployeesRaw) && trialMaxEmployeesRaw > 0 ? trialMaxEmployeesRaw : 10;

    const pricingSlug = planToPricingSlug(plan);
    const pricingPlan =
      plan === "TRIAL"
        ? null
        : await prisma.pricingPlan.findUnique({
            where: { slug: pricingSlug },
            select: { maxEmployees: true }
          });

    const maxEmployees =
      body.maxEmployees ??
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
        return NextResponse.json({ error: "Invalid planExpiresAt" }, { status: 400 });
      }
      planExpiresAt = d;
    } else {
      return NextResponse.json({ error: "Invalid planExpiresAt" }, { status: 400 });
    }

    const tenant = await prisma.tenant.create({
      data: {
        name: body.name,
        nameAr: body.nameAr,
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
        settings: body.settings || {}
      }
    });

    return NextResponse.json({ data: tenant }, { status: 201 });
  } catch (error) {
    logApiError("Error creating tenant", error);
    return NextResponse.json({ error: "Failed to create tenant" }, { status: 500 });
  }
}
