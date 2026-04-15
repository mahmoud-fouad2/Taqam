/**
 * Admin Tenants API Routes - Super Admin Only
 * /api/admin/tenants
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import type { TenantStatus } from "@/lib/types/tenant";
import { hash } from "bcryptjs";
import { randomBytes, randomUUID } from "node:crypto";

import { logApiError } from "@/lib/api/route-helper";
import { createActionToken } from "@/lib/security/action-tokens";
import { getAppBaseUrl, sendEmail } from "@/lib/email";
import { mapTenantFromDb, readString } from "@/lib/admin/tenant-mapping";

const UNLIMITED_EMPLOYEES = 1_000_000;
type PricingSlug = "starter" | "business" | "enterprise";

const VALID_TENANT_STATUSES = new Set(["PENDING", "ACTIVE", "SUSPENDED", "CANCELLED"]);

function normalizeTenantStatus(
  input: unknown
): "PENDING" | "ACTIVE" | "SUSPENDED" | "CANCELLED" | undefined {
  const v = String(input ?? "").trim();
  if (!v) return undefined;
  const upper = v.toUpperCase();
  if (VALID_TENANT_STATUSES.has(upper))
    return upper as "PENDING" | "ACTIVE" | "SUSPENDED" | "CANCELLED";
  return undefined;
}

function mapPlanToDb(plan: unknown): "TRIAL" | "BASIC" | "PROFESSIONAL" | "ENTERPRISE" {
  const v = String(plan ?? "").toLowerCase();
  if (v === "starter" || v === "basic") return "BASIC";
  if (v === "business" || v === "professional") return "PROFESSIONAL";
  if (v === "enterprise") return "ENTERPRISE";
  if (v === "trial") return "TRIAL";
  return "TRIAL";
}

function planToPricingSlug(plan: ReturnType<typeof mapPlanToDb>): PricingSlug {
  if (plan === "ENTERPRISE") return "enterprise";
  if (plan === "PROFESSIONAL") return "business";
  return "starter";
}

function isPricingSlug(value: string): value is PricingSlug {
  return value === "starter" || value === "business" || value === "enterprise";
}

function readBoolean(v: unknown): boolean | undefined {
  if (typeof v === "boolean") return v;
  return undefined;
}

function splitName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) {
    return {
      firstName: parts[0] ?? "Tenant",
      lastName: "Admin"
    };
  }

  return {
    firstName: parts[0]!,
    lastName: parts.slice(1).join(" ")
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

    const where: Prisma.TenantWhereInput = {
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
      data: tenants.map(mapTenantFromDb),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    logApiError("Error fetching tenants", error);
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
    const adminName = readString(body.adminName) ?? readString(incomingSettings.adminName);
    const adminEmailRaw =
      readString(body.adminEmail) ?? readString(incomingSettings.adminEmail) ?? undefined;
    const adminEmail = adminEmailRaw?.toLowerCase();
    const sendInvite =
      readBoolean(body.sendInvite) ?? readBoolean(incomingSettings.sendInvite) ?? true;

    if (!adminName || !adminEmail) {
      return NextResponse.json(
        { success: false, error: "Admin name and email are required" },
        { status: 400 }
      );
    }

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

    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail },
      select: { id: true }
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "Admin email already belongs to an existing user" },
        { status: 409 }
      );
    }

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
    const pricingSlug: PricingSlug = isPricingSlug(planSlugFromBody)
      ? planSlugFromBody
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

    const { firstName, lastName } = splitName(adminName);
    const randomPassword = randomBytes(24).toString("hex");
    const passwordHash = await hash(randomPassword, 12);

    const { tenant, adminUser } = await prisma.$transaction(async (tx) => {
      const createdTenant = await tx.tenant.create({
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
          status: "PENDING",
          settings: normalizedSettings
        }
      });

      await tx.organizationProfile.create({
        data: {
          tenantId: createdTenant.id,
          name: body.name,
          nameAr: body.nameAr ?? body.name,
          commercialRegister:
            readString(body.commercialRegister) ??
            readString(incomingSettings.commercialRegister) ??
            null,
          phone: readString(body.phone) ?? null,
          email: readString(body.email) ?? null,
          country: readString(body.country) ?? "SA",
          logo: readString(body.logo) ?? null
        }
      });

      const adminUserId = randomUUID();
      const adminRows = await tx.$queryRaw<
        Array<{
          id: string;
          email: string;
          firstName: string;
          lastName: string;
          passwordChangedAt: Date | null;
        }>
      >(Prisma.sql`
          INSERT INTO "User" (
            "id",
            "tenantId",
            "email",
            "password",
            "firstName",
            "lastName",
            "role",
            "status",
            "permissions",
            "failedLoginAttempts",
            "lockedUntil",
            "createdAt",
            "updatedAt"
          )
          VALUES (
            ${adminUserId},
            ${createdTenant.id},
            ${adminEmail},
            ${passwordHash},
            ${firstName},
            ${lastName},
            ${"TENANT_ADMIN"},
            ${"PENDING_VERIFICATION"},
            ARRAY[]::text[],
            0,
            NULL,
            NOW(),
            NOW()
          )
          RETURNING "id", "email", "firstName", "lastName", "passwordChangedAt"
        `);

      const createdAdmin = adminRows[0]!;

      await tx.auditLog.create({
        data: {
          tenantId: createdTenant.id,
          userId: session.user.id ?? null,
          action: "SUPER_ADMIN_CREATE_TENANT",
          entity: "Tenant",
          entityId: createdTenant.id,
          newData: {
            slug: createdTenant.slug,
            adminEmail,
            sendInvite
          }
        }
      });

      const tenantWithCounts = await tx.tenant.findUnique({
        where: { id: createdTenant.id },
        include: {
          _count: {
            select: {
              employees: true,
              users: true
            }
          }
        }
      });

      return { tenant: tenantWithCounts!, adminUser: createdAdmin };
    });

    const activationToken = await createActionToken(
      {
        type: "tenant-admin-activation",
        userId: adminUser.id,
        email: adminUser.email,
        tenantId: tenant.id,
        passwordChangedAt: adminUser.passwordChangedAt?.toISOString() ?? null
      },
      "72h"
    );

    const activationUrl = `${getAppBaseUrl()}/reset-password?token=${encodeURIComponent(activationToken)}`;

    let activationEmailSent = false;
    if (sendInvite) {
      try {
        const emailResult = await sendEmail({
          to: adminUser.email,
          subject: `تفعيل حساب مدير الشركة | ${tenant.nameAr ?? tenant.name}`,
          text: [
            `مرحبًا ${adminName}`,
            `تم تجهيز مساحة شركتك ${tenant.nameAr ?? tenant.name} على طاقم وهي بانتظار تفعيل حساب مدير الشركة.`,
            "فعّل حسابك من الرابط التالي لتشغيل مساحة الشركة:",
            activationUrl
          ].join("\n\n"),
          html: `
            <div style="font-family:Arial,sans-serif;line-height:1.8;color:#111827">
              <h2 style="margin:0 0 16px">تم إنشاء الشركة بنجاح</h2>
              <p>مرحبًا ${adminName}،</p>
              <p>تم تجهيز مساحة شركتك <strong>${tenant.nameAr ?? tenant.name}</strong> على طاقم وهي الآن بانتظار تفعيل حساب مدير الشركة.</p>
              <p>لتفعيل حساب مدير الشركة وتحديد كلمة المرور وتشغيل مساحة الشركة، استخدم الزر التالي:</p>
              <p style="margin:24px 0">
                <a href="${activationUrl}" style="display:inline-block;padding:12px 20px;border-radius:12px;background:#0ea5e9;color:#fff;text-decoration:none;font-weight:700">تفعيل الحساب</a>
              </p>
              <p>إذا لم يعمل الزر، استخدم هذا الرابط مباشرة:</p>
              <p><a href="${activationUrl}">${activationUrl}</a></p>
            </div>
          `,
          replyTo: process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? undefined
        });
        activationEmailSent = emailResult.sent;
      } catch {
        activationEmailSent = false;
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: mapTenantFromDb(tenant),
        activation: {
          email: adminUser.email,
          sent: activationEmailSent,
          skipped: !sendInvite,
          activationUrl
        }
      },
      { status: 201 }
    );
  } catch (error) {
    logApiError("Error creating tenant", error);
    return NextResponse.json({ success: false, error: "Failed to create tenant" }, { status: 500 });
  }
}
