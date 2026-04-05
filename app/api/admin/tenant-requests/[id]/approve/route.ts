import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { hash } from "bcryptjs";
import { randomBytes } from "node:crypto";

import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { createActionToken } from "@/lib/security/action-tokens";
import { getAppBaseUrl, sendEmail } from "@/lib/email";
import type { Tenant, TenantStatus } from "@/lib/types/tenant";

function mapPlanFromDb(plan: unknown): Tenant["plan"] {
  const v = String(plan ?? "").toUpperCase();
  if (v === "ENTERPRISE") return "enterprise";
  if (v === "PROFESSIONAL" || v === "BUSINESS") return "business";
  if (v === "BASIC" || v === "STARTER" || v === "TRIAL") return "starter";
  const lower = String(plan ?? "").toLowerCase();
  if (lower === "enterprise" || lower === "business" || lower === "starter") return lower as Tenant["plan"];
  return "starter";
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
    lastName: parts.slice(1).join(" "),
  };
}

function mapTenant(t: any): Tenant {
  return {
    id: t.id,
    name: t.name,
    nameAr: t.nameAr ?? t.name,
    slug: t.slug,
    status: (t.status?.toLowerCase() ?? "pending") as TenantStatus,
    plan: mapPlanFromDb(t.plan),
    email: "",
    country: "SA",
    defaultLocale: "ar",
    defaultTheme: "shadcn",
    timezone: t.timezone ?? "Asia/Riyadh",
    usersCount: t._count?.users ?? 0,
    employeesCount: t._count?.employees ?? 0,
    createdAt: t.createdAt?.toISOString?.() ?? new Date().toISOString(),
    updatedAt: t.updatedAt?.toISOString?.() ?? new Date().toISOString(),
    createdBy: "",
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
    select: { id: true },
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
        plan: item.plan,
        status: "ACTIVE",
        settings: {
          defaultLocale: body.defaultLocale ?? "ar",
          defaultTheme: body.defaultTheme ?? "shadcn",
        },
        planExpiresAt: item.plan === "TRIAL" ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) : null,
      },
    });

    await tx.organizationProfile.create({
      data: {
        tenantId: createdTenant.id,
        name: body.name ?? item.companyName,
        nameAr: body.nameAr ?? item.companyNameAr ?? item.companyName,
        email: adminEmail,
        phone: item.contactPhone ?? null,
        country: "SA",
      },
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
        tenantId: createdTenant.id,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        passwordChangedAt: true,
      },
    });

    await tx.tenantRequest.update({
      where: { id },
      data: {
        status: "APPROVED",
        processedAt: new Date(),
        processedById: session.user.id ?? null,
        tenantId: createdTenant.id,
        rejectionReason: null,
      },
    });

    await tx.auditLog.create({
      data: {
        tenantId: createdTenant.id,
        userId: session.user.id ?? null,
        action: "TENANT_REQUEST_APPROVED",
        entity: "Tenant",
        entityId: createdTenant.id,
      },
    });

    const tenantWithCounts = await tx.tenant.findUnique({
      where: { id: createdTenant.id },
      include: {
        _count: { select: { users: true, employees: true } },
      },
    });

    return { tenant: tenantWithCounts!, adminUser: createdAdmin };
  });

  const activationToken = await createActionToken(
    {
      type: "tenant-admin-activation",
      userId: adminUser.id,
      email: adminUser.email,
      tenantId: tenant.id,
      passwordChangedAt: adminUser.passwordChangedAt?.toISOString() ?? null,
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
        `تمت الموافقة على طلب شركتك ${tenant.nameAr ?? tenant.name}.`,
        `فعّل حسابك من الرابط التالي:`,
        activationUrl,
      ].join("\n\n"),
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.8;color:#111827">
          <h2 style="margin:0 0 16px">تمت الموافقة على طلب شركتك</h2>
          <p>مرحبًا ${item.contactName}،</p>
          <p>تم إنشاء مساحة شركتك <strong>${tenant.nameAr ?? tenant.name}</strong> بنجاح على طاقم.</p>
          <p>لتفعيل حساب مدير الشركة وتحديد كلمة المرور، استخدم الزر التالي:</p>
          <p style="margin:24px 0">
            <a href="${activationUrl}" style="display:inline-block;padding:12px 20px;border-radius:12px;background:#0ea5e9;color:#fff;text-decoration:none;font-weight:700">تفعيل الحساب</a>
          </p>
          <p>إذا لم يعمل الزر، استخدم هذا الرابط مباشرة:</p>
          <p><a href="${activationUrl}">${activationUrl}</a></p>
        </div>
      `,
      replyTo: process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? undefined,
    });
    activationEmailSent = emailResult.sent;
  } catch {
    activationEmailSent = false;
  }

  return NextResponse.json({
    data: mapTenant(tenant),
    activation: {
      email: adminUser.email,
      sent: activationEmailSent,
      activationUrl,
    },
  });
}
