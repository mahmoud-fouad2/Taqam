import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/marketing/site";

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/dashboard",
          "/dashboard/",
          "/en/dashboard",
          "/en/dashboard/",
          "/login",
          "/en/login",
          "/register",
          "/en/register",
          "/select-tenant",
          "/en/select-tenant",
          "/m/",
          "/en/m/",
          "/404-page",
          "/en/404-page",
          "/500-page",
          "/en/500-page",
          "/_next/"
        ]
      }
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base
  };
}
