import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/marketing/site";
import { buildMarketingLanguageAlternates, getIndexableMarketingRoutes } from "@/lib/marketing/seo";
import prisma from "@/lib/db";
import { buildTenantCanonicalUrl } from "@/lib/tenant";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const lastModified = new Date();

  const entries: MetadataRoute.Sitemap = [];

  for (const page of getIndexableMarketingRoutes()) {
    const { arUrl, enUrl, languages } = buildMarketingLanguageAlternates(page.path, base);

    for (const url of [arUrl, enUrl]) {
      entries.push({
        url,
        lastModified,
        changeFrequency: page.changeFrequency,
        priority: page.priority,
        alternates: {
          languages
        }
      });
    }
  }

  const now = new Date();
  const publicJobs = await prisma.jobPosting.findMany({
    where: {
      status: "ACTIVE",
      tenant: {
        status: "ACTIVE"
      },
      OR: [{ expiresAt: null }, { expiresAt: { gte: now } }]
    },
    select: {
      id: true,
      updatedAt: true,
      tenant: {
        select: {
          slug: true,
          domain: true
        }
      }
    },
    orderBy: [{ updatedAt: "desc" }]
  });

  const tenantSlugs = Array.from(new Set(publicJobs.map((job) => job.tenant.slug)));
  const tenantCareerLastModified = new Map<string, Date>();

  for (const job of publicJobs) {
    const currentLastModified = tenantCareerLastModified.get(job.tenant.slug);

    if (!currentLastModified || job.updatedAt > currentLastModified) {
      tenantCareerLastModified.set(job.tenant.slug, job.updatedAt);
    }
  }

  for (const slug of tenantSlugs) {
    const tenant = publicJobs.find((job) => job.tenant.slug === slug)?.tenant;
    if (!tenant) continue;

    const arUrl = buildTenantCanonicalUrl(tenant, "/careers", {
      locale: "ar",
      baseDomain: base.replace(/^https?:\/\//, "")
    });
    const enUrl = buildTenantCanonicalUrl(tenant, "/careers", {
      locale: "en",
      baseDomain: base.replace(/^https?:\/\//, "")
    });
    const languageAlternates = {
      "ar-SA": arUrl,
      "en-US": enUrl,
      "x-default": arUrl
    };

    for (const url of [arUrl, enUrl]) {
      entries.push({
        url,
        lastModified: tenantCareerLastModified.get(slug) ?? lastModified,
        changeFrequency: "daily",
        priority: 0.7,
        alternates: {
          languages: languageAlternates
        }
      });
    }
  }

  for (const job of publicJobs) {
    const { arUrl, enUrl, languages } = buildMarketingLanguageAlternates(
      `/careers/${job.id}`,
      base
    );

    for (const url of [arUrl, enUrl]) {
      entries.push({
        url,
        lastModified: job.updatedAt,
        changeFrequency: "daily",
        priority: 0.7,
        alternates: {
          languages
        }
      });
    }
  }

  return entries;
}
