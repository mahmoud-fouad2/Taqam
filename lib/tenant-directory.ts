import "server-only";

import prisma from "@/lib/db";
import { extractTenantSlugFromHost, normalizeTenantDomain } from "@/lib/tenant";

const tenantDirectorySelect = {
  id: true,
  slug: true,
  domain: true,
  name: true,
  nameAr: true,
  logo: true,
  settings: true,
  organizationProfile: {
    select: {
      email: true
    }
  }
} as const;

export async function findActiveTenantBySlug(slug: string) {
  return prisma.tenant.findFirst({
    where: {
      slug,
      status: "ACTIVE"
    },
    select: tenantDirectorySelect
  });
}

export async function findActiveTenantByHost(host: string | null | undefined) {
  const normalizedHost = normalizeTenantDomain(host);
  if (!normalizedHost) {
    return null;
  }

  const slugFromHost = extractTenantSlugFromHost(normalizedHost);
  const orWhere = [...(slugFromHost ? [{ slug: slugFromHost }] : []), { domain: normalizedHost }];

  return prisma.tenant.findFirst({
    where: {
      status: "ACTIVE",
      OR: orWhere
    },
    select: tenantDirectorySelect
  });
}

export async function resolveActiveTenantRecord({
  slug,
  host
}: {
  slug?: string | null;
  host?: string | null;
}) {
  if (slug) {
    const tenant = await findActiveTenantBySlug(slug);
    if (tenant) {
      return tenant;
    }
  }

  return findActiveTenantByHost(host);
}
