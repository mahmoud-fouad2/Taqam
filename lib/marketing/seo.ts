import type { Metadata } from "next";
import { cookies, headers } from "next/headers";

import { getMarketingLocaleFromCookie, getSiteUrl } from "@/lib/marketing/site";

type SeoCopy = {
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  path: string;
};

export async function marketingMetadata(copy: SeoCopy): Promise<Metadata> {
  const headerStore = await headers();
  const headerLocale = headerStore.get("x-taqam-locale");

  const cookieStore = await cookies();
  const localeFromCookie = getMarketingLocaleFromCookie(cookieStore.get("taqam_locale")?.value);
  const locale = headerLocale === "en" || headerLocale === "ar" ? headerLocale : localeFromCookie;
  const title = locale === "ar" ? copy.titleAr : copy.titleEn;
  const description = locale === "ar" ? copy.descriptionAr : copy.descriptionEn;

  const base = getSiteUrl();
  const path = copy.path.startsWith("/") ? copy.path : `/${copy.path}`;

  const urlAr = `${base}${path}`;
  const urlEn = path === "/" ? `${base}/en` : `${base}/en${path}`;
  const url = locale === "en" ? urlEn : urlAr;

  return {
    title,
    description,
    metadataBase: new URL(base),
    alternates: {
      canonical: url,
      languages: {
        "ar-SA": urlAr,
        "en-US": urlEn,
      },
    },
    keywords: [
      "HR",
      "Payroll",
      "Attendance",
      "Saudi Arabia",
      "WPS",
      "GOSI",
      "Taqam",
      "طاقم",
      "نظام موارد بشرية",
      "إدارة الموارد البشرية",
      "الرواتب",
      "الحضور والانصراف",
      "نظام HR سعودي",
      "HR software Saudi",
      "حضور وانصراف",
    ],
    openGraph: {
      type: "website",
      url,
      title,
      description,
      siteName: "Taqam",
      locale: locale === "ar" ? "ar_SA" : "en_US",
      alternateLocale: locale === "ar" ? ["en_US"] : ["ar_SA"],
      images: [
        {
          url: `${base}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: "Taqam",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${base}/twitter-image`],
    },
    robots: {
      index: true,
      follow: true,
    },
    creator: "Taqam",
    publisher: "Taqam",
    other: {
      "application-name": "Taqam",
      "apple-mobile-web-app-title": "Taqam",
      "theme-color": "#0b1220",
    },
  };
}
