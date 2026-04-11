import type { Metadata } from "next";
import { cookies, headers } from "next/headers";

import { getMarketingLocaleFromCookie, getSiteUrl } from "@/lib/marketing/site";

type SeoCopy = {
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  path: string;
  keywordsAr?: string[];
  keywordsEn?: string[];
  noIndex?: boolean;
  sectionAr?: string;
  sectionEn?: string;
};

export async function marketingMetadata(copy: SeoCopy): Promise<Metadata> {
  const headerStore = await headers();
  const headerLocale = headerStore.get("x-taqam-locale");

  const cookieStore = await cookies();
  const localeFromCookie = getMarketingLocaleFromCookie(cookieStore.get("taqam_locale")?.value);
  const locale = headerLocale === "en" || headerLocale === "ar" ? headerLocale : localeFromCookie;
  const title = locale === "ar" ? copy.titleAr : copy.titleEn;
  const description = locale === "ar" ? copy.descriptionAr : copy.descriptionEn;
  const pageKeywords = locale === "ar" ? (copy.keywordsAr ?? []) : (copy.keywordsEn ?? []);
  const section = locale === "ar" ? copy.sectionAr : copy.sectionEn;
  const noIndex = copy.noIndex === true;

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
        "en-US": urlEn
      }
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
      ...pageKeywords
    ],
    category: section ?? (locale === "ar" ? "منصة موارد بشرية سعودية" : "Saudi HR platform"),
    classification:
      locale === "ar"
        ? "إدارة الموارد البشرية والرواتب والحضور"
        : "HR, payroll, and attendance software",
    referrer: "origin-when-cross-origin",
    formatDetection: {
      email: false,
      address: false,
      telephone: false
    },
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
          alt: `${title} | Taqam`
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${base}/twitter-image`]
    },
    robots: {
      index: !noIndex,
      follow: !noIndex,
      nocache: noIndex,
      googleBot: {
        index: !noIndex,
        follow: !noIndex,
        noimageindex: noIndex,
        "max-image-preview": noIndex ? "none" : "large",
        "max-snippet": noIndex ? 0 : -1,
        "max-video-preview": noIndex ? 0 : -1
      }
    },
    authors: [{ name: "Taqam" }],
    creator: "Taqam",
    publisher: "Taqam",
    other: {
      "application-name": "Taqam",
      "apple-mobile-web-app-title": "Taqam",
      "theme-color": "#ffffff",
      "color-scheme": "light dark"
    }
  };
}
