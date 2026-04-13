import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { hash } from "bcryptjs";
import { randomBytes } from "node:crypto";

import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { createActionToken } from "@/lib/security/action-tokens";
import { getAppBaseUrl, sendEmail } from "@/lib/email";
import type { Tenant } from "@/lib/types/tenant";
import { mapTenantFromDb } from "@/lib/admin/tenant-mapping";

const UNLIMITED_EMPLOYEES = 1_000_000;

type DbTenantPlan = "TRIAL" | "BASIC" | "PROFESSIONAL" | "ENTERPRISE";

function normalizeDbPlan(value: unknown): DbTenantPlan | undefined {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return undefined;

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

  return undefined;
}

function planToPricingSlug(plan: DbTenantPlan): "starter" | "business" | "enterprise" {
  if (plan === "ENTERPRISE") return "enterprise";
  if (plan === "PROFESSIONAL") return "business";
  return "starter";
}

function parseOptionalPositiveInt(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    const n = Math.trunc(value);
    return n > 0 ? n : undefined;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const n = Math.trunc(Number(trimmed));
    return Number.isFinite(n) && n > 0 ? n : undefined;
  }

  return undefined;
}

function parseOptionalDateInput(
  value: unknown
): { provided: boolean; value: Date | null } | { provided: false } | { error: string } {
  if (value === undefined) return { provided: false };
  if (value === null) return { provided: true, value: null };
  if (typeof value !== "string") return { error: "Invalid planExpiresAt" };

  const trimmed = value.trim();
  if (!trimmed) return { provided: true, value: null };

  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return { error: "Invalid planExpiresAt" };
  return { provided: true, value: d };
}

function isValidSlug(value: string): boolean {
  return /^[a-z0-9-]{3,30}$/.test(value);
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);
}

function splitName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) {
    return { firstName: parts[0] ?? "Tenant", lastName: "Admin" };
  }

  return {
    firstName: parts[0]!,
    lastName: parts.slice(1).join(" ")
  };
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const item = await prisma.tenantRequest.findUnique({ where: { id } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (item.status !== "PENDING") {
    return NextResponse.json({ error: "Request already processed" }, { status: 400 });
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const platformSettings = await prisma.platformSettings.findFirst({
    select: { trialDays: true, trialMaxEmployees: true }
  });
  const trialDaysRaw = platformSettings?.trialDays ?? 14;
  const trialDays = Number.isFinite(trialDaysRaw) && trialDaysRaw > 0 ? trialDaysRaw : 14;
  const trialMaxEmployeesRaw = platformSettings?.trialMaxEmployees ?? 10;
  const trialMaxEmployees =
    Number.isFinite(trialMaxEmployeesRaw) && trialMaxEmployeesRaw > 0 ? trialMaxEmployeesRaw : 10;

  const expiresAtInput = parseOptionalDateInput(body.planExpiresAt);
  if ("error" in expiresAtInput) {
    return NextResponse.json({ error: expiresAtInput.error }, { status: 400 });
  }

  const requestedPlan = normalizeDbPlan(body.plan);
  if (body.plan !== undefined && !requestedPlan) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }
  const plan = (requestedPlan ?? item.plan) as DbTenantPlan;

  const requestedMaxEmployees = parseOptionalPositiveInt(body.maxEmployees);
  if (body.maxEmployees !== undefined && !requestedMaxEmployees) {
    return NextResponse.json({ error: "Invalid maxEmployees" }, { status: 400 });
  }

  const pricingSlug = planToPricingSlug(plan);
  const pricingPlan =
    plan === "TRIAL"
      ? null
      : await prisma.pricingPlan.findUnique({
          where: { slug: pricingSlug },
          select: { maxEmployees: true }
        });

  const pricingMaxEmployees =
    pricingPlan === null
      ? undefined
      : pricingPlan.maxEmployees === null
        ? UNLIMITED_EMPLOYEES
        : pricingPlan.maxEmployees;

  const maxEmployees =
    requestedMaxEmployees ??
    (plan === "TRIAL"
      ? trialMaxEmployees
      : (pricingMaxEmployees ??
        (plan === "BASIC" ? 25 : plan === "PROFESSIONAL" ? 100 : UNLIMITED_EMPLOYEES)));

  const planExpiresAt = expiresAtInput.provided
    ? expiresAtInput.value
    : plan === "TRIAL"
      ? new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000)
      : null;

  const preferredSlug = typeof body.slug === "string" ? body.slug.trim().toLowerCase() : "";
  let baseSlug = preferredSlug || slugify(item.companyNameAr ?? item.companyName);
  if (!isValidSlug(baseSlug)) {
    baseSlug = slugify(item.companyName);
  }
  if (!isValidSlug(baseSlug)) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  let slug = baseSlug;
  for (let i = 2; i <= 25; i++) {
    const exists = await prisma.tenant.findUnique({ where: { slug } });
    if (!exists) break;
    slug = `${baseSlug}-${i}`.slice(0, 30);
  }

  const adminEmail = item.contactEmail.trim().toLowerCase();
  const existingUser = await prisma.user.findUnique({
    where: { email: adminEmail },
    select: { id: true }
  });

  if (existingUser) {
    return NextResponse.json(
      { error: "Contact email already belongs to an existing user" },
      { status: 409 }
    );
  }

  const { firstName, lastName } = splitName(item.contactName);
  const randomPassword = randomBytes(24).toString("hex");
  const passwordHash = await hash(randomPassword, 12);

  const { tenant, adminUser } = await prisma.$transaction(async (tx) => {
    const createdTenant = await tx.tenant.create({
      data: {
        name: body.name ?? item.companyName,
        nameAr: body.nameAr ?? item.companyNameAr ?? item.companyName,
        slug,
        plan,
        status: "PENDING",
        maxEmployees,
        settings: {
          defaultLocale: body.defaultLocale ?? "ar",
          defaultTheme: body.defaultTheme ?? "shadcn"
        },
        planExpiresAt
      }
    });

    await tx.organizationProfile.create({
      data: {
        tenantId: createdTenant.id,
        name: body.name ?? item.companyName,
        nameAr: body.nameAr ?? item.companyNameAr ?? item.companyName,
        email: adminEmail,
        phone: item.contactPhone ?? null,
        country: "SA"
      }
    });

    const createdAdmin = await tx.user.create({
      data: {
        email: adminEmail,
        password: passwordHash,
        firstName,
        lastName,
        role: "TENANT_ADMIN",
        status: "PENDING_VERIFICATION",
        permissions: [],
        tenantId: createdTenant.id
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        passwordChangedAt: true
      }
    });

    await tx.tenantRequest.update({
      where: { id },
      data: {
        status: "APPROVED",
        processedAt: new Date(),
        processedById: session.user.id ?? null,
        tenantId: createdTenant.id,
        rejectionReason: null
      }
    });

    await tx.auditLog.create({
      data: {
        tenantId: createdTenant.id,
        userId: session.user.id ?? null,
        action: "TENANT_REQUEST_APPROVED",
        entity: "Tenant",
        entityId: createdTenant.id
      }
    });

    const tenantWithCounts = await tx.tenant.findUnique({
      where: { id: createdTenant.id },
      include: {
        _count: { select: { users: true, employees: true } }
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
  try {
    const emailResult = await sendEmail({
      to: adminUser.email,
      subject: `تفعيل حساب مدير الشركة | ${tenant.nameAr ?? tenant.name}`,
      text: [
        `مرحبًا ${item.contactName}`,
        `تمت الموافقة على طلب شركتك ${tenant.nameAr ?? tenant.name}، ومساحة الشركة بانتظار تفعيل حساب مدير الشركة.`,
        `فعّل حسابك من الرابط التالي لتشغيل مساحة الشركة:`,
        activationUrl
      ].join("\n\n"),
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.8;color:#111827">
          <h2 style="margin:0 0 16px">تمت الموافقة على طلب شركتك</h2>
          <p>مرحبًا ${item.contactName}،</p>
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

  return NextResponse.json({
    data: mapTenantFromDb(tenant),
    activation: {
      email: adminUser.email,
      sent: activationEmailSent,
      activationUrl
    }
  });
}
