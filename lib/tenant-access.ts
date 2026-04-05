import prisma from "@/lib/db";

export type TenantAccessIssue = "tenant_not_found" | "tenant_inactive" | "plan_expired";

type TenantSnapshot = {
  id: string;
  name: string;
  slug: string;
  status: string;
  plan: string;
  planExpiresAt: Date | null;
};

export type TenantAccessCheck =
  | { ok: true; tenant: TenantSnapshot }
  | { ok: false; issue: TenantAccessIssue };

export function getTenantAccessIssue(
  tenant: Pick<TenantSnapshot, "status" | "planExpiresAt"> | null | undefined
): TenantAccessIssue | null {
  if (!tenant) return "tenant_not_found";
  if (tenant.status !== "ACTIVE") return "tenant_inactive";
  if (tenant.planExpiresAt && tenant.planExpiresAt.getTime() < Date.now()) {
    return "plan_expired";
  }
  return null;
}

export async function validateTenantAccess(tenantId: string | null | undefined): Promise<TenantAccessCheck> {
  if (!tenantId) {
    return { ok: false, issue: "tenant_not_found" };
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      plan: true,
      planExpiresAt: true,
    },
  });

  const issue = getTenantAccessIssue(tenant);
  if (issue) {
    return { ok: false, issue };
  }

  return { ok: true, tenant: tenant as TenantSnapshot };
}

export function getTenantAccessMessage(issue: TenantAccessIssue, locale: "ar" | "en" = "ar") {
  const copy = {
    tenant_not_found: {
      ar: "تعذر العثور على الشركة المرتبطة بحسابك.",
      en: "We could not find the company linked to your account.",
    },
    tenant_inactive: {
      ar: "حساب الشركة غير نشط حاليًا. تواصل مع الدعم الفني.",
      en: "Your company workspace is not active right now. Please contact support.",
    },
    plan_expired: {
      ar: "انتهت صلاحية اشتراك الشركة. تواصل مع الدعم لتجديد الخدمة.",
      en: "Your company subscription has expired. Please contact support to renew service.",
    },
  } as const;

  return copy[issue][locale];
}

export function getTenantIssueQueryValue(issue: TenantAccessIssue) {
  if (issue === "plan_expired") return "plan-expired";
  if (issue === "tenant_inactive") return "tenant-inactive";
  return "tenant-missing";
}