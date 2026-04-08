import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/marketing/site";
import prisma from "@/lib/db";

type EntrySpec = {
  path: string;
  changeFrequency?: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority?: number;
};

const marketingPages: EntrySpec[] = [
  { path: "/", changeFrequency: "daily", priority: 1 },
  { path: "/features", changeFrequency: "weekly", priority: 0.8 },
  { path: "/careers", changeFrequency: "daily", priority: 0.8 },
  { path: "/pricing", changeFrequency: "weekly", priority: 0.8 },
  { path: "/plans", changeFrequency: "weekly", priority: 0.7 },
  { path: "/faq", changeFrequency: "monthly", priority: 0.6 },
  { path: "/help-center", changeFrequency: "monthly", priority: 0.6 },
  { path: "/support", changeFrequency: "monthly", priority: 0.6 },
  { path: "/request-demo", changeFrequency: "monthly", priority: 0.6 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
];

function normalizePath(pathname: string): string {
  if (!pathname.startsWith("/")) return `/${pathname}`;
  return pathname;
}

function localizedPath(locale: "ar" | "en", pathname: string): string {
  const p = normalizePath(pathname);
  if (locale === "en") {
    if (p === "/") return "/en";
    return `/en${p}`;
  }
  return p;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const lastModified = new Date();

  const entries: MetadataRoute.Sitemap = [];

  for (const page of marketingPages) {
    for (const locale of ["ar", "en"] as const) {
      entries.push({
        url: `${base}${localizedPath(locale, page.path)}`,
        lastModified,
        changeFrequency: page.changeFrequency,
        priority: page.priority,
      });
    }
  }

  const now = new Date();
  const publicJobs = await prisma.jobPosting.findMany({
    where: {
      status: "ACTIVE",
      tenant: {
        status: "ACTIVE",
      },
      OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
    },
    select: {
      id: true,
      updatedAt: true,
      tenant: {
        select: {
          slug: true,
        },
      },
    },
    orderBy: [{ updatedAt: "desc" }],
  });

  const tenantSlugs = Array.from(new Set(publicJobs.map((job) => job.tenant.slug)));

  for (const locale of ["ar", "en"] as const) {
    for (const slug of tenantSlugs) {
      entries.push({
        url: `${base}${localizedPath(locale, `/t/${slug}/careers`)}`,
        lastModified,
        changeFrequency: "daily",
        priority: 0.7,
      });
    }

    for (const job of publicJobs) {
      entries.push({
        url: `${base}${localizedPath(locale, `/careers/${job.id}`)}`,
        lastModified: job.updatedAt,
        changeFrequency: "daily",
        priority: 0.7,
      });
    }
  }

  return entries;
}
