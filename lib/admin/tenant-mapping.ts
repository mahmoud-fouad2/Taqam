/**
 * Shared tenant mapping utilities for admin API routes.
 * Centralises DB-to-client conversion used by both /api/admin/tenants and /api/admin/tenants/[id].
 */

import type { Tenant, TenantStatus } from "@/lib/types/tenant";

export function mapPlanFromDb(plan: unknown): Tenant["plan"] {
  const v = String(plan ?? "").toUpperCase();
  if (v === "ENTERPRISE") return "enterprise";
  if (v === "PROFESSIONAL" || v === "BUSINESS") return "business";
  if (v === "BASIC" || v === "STARTER" || v === "TRIAL") return "starter";
  const lower = String(plan ?? "").toLowerCase();
  if (lower === "enterprise" || lower === "business" || lower === "starter")
    return lower as Tenant["plan"];
  return "starter";
}

export function readSettings(t: any): Record<string, unknown> {
  return (t?.settings as Record<string, unknown>) ?? {};
}

export function readString(v: unknown): string | undefined {
  if (typeof v === "string" && v.trim()) return v;
  return undefined;
}

export function pickString(settings: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const v = readString(settings[key]);
    if (v) return v;
  }
  return undefined;
}

export function mapTenantFromDb(t: any): Tenant {
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
