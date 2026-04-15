import type { Metadata, MetadataRoute } from "next";
import { cookies, headers } from "next/headers";

import { getMarketingLocaleFromCookie, getSiteUrl } from "@/lib/marketing/site";
import { getPlatformSiteContent } from "@/lib/marketing/site-content";

type SitemapChangeFrequency = MetadataRoute.Sitemap[number]["changeFrequency"];

export type MarketingSeoRoute = {
  path: string;
  changeFrequency?: SitemapChangeFrequency;
  priority?: number;
  sectionAr: string;
  sectionEn: string;
  keywordsAr: string[];
  keywordsEn: string[];
  includeInSitemap?: boolean;
};

const marketingSeoRoutes: MarketingSeoRoute[] = [
  {
    path: "/",
    changeFrequency: "daily",
    priority: 1,
    sectionAr: "الصفحة الرئيسية",
    sectionEn: "Home",
    keywordsAr: ["منصة موارد بشرية", "برنامج رواتب", "الحضور والانصراف", "إدارة الموظفين"],
    keywordsEn: ["HR software", "payroll software", "attendance system", "employee management"]
  },
  {
    path: "/features",
    changeFrequency: "weekly",
    priority: 0.8,
    sectionAr: "المميزات",
    sectionEn: "Features",
    keywordsAr: ["مميزات الموارد البشرية", "إدارة الرواتب", "إدارة الحضور", "التوظيف"],
    keywordsEn: ["HR features", "payroll features", "attendance tracking", "recruitment platform"]
  },
  {
    path: "/pricing",
    changeFrequency: "weekly",
    priority: 0.8,
    sectionAr: "الأسعار",
    sectionEn: "Pricing",
    keywordsAr: [
      "أسعار طاقم",
      "باقات الموارد البشرية",
      "باقات الرواتب",
      "تكلفة نظام الموارد البشرية"
    ],
    keywordsEn: ["Taqam pricing", "HR pricing", "payroll plans", "HR software cost"]
  },
  {
    path: "/plans",
    changeFrequency: "weekly",
    priority: 0.7,
    sectionAr: "الباقات",
    sectionEn: "Plans",
    keywordsAr: ["باقات طاقم", "خطة الموارد البشرية", "خطة الرواتب"],
    keywordsEn: ["Taqam plans", "HR plans", "payroll plans"]
  },
  {
    path: "/careers",
    changeFrequency: "daily",
    priority: 0.8,
    sectionAr: "الوظائف",
    sectionEn: "Careers",
    keywordsAr: ["وظائف", "فرص عمل", "بوابة التوظيف", "وظائف السعودية"],
    keywordsEn: ["careers", "job opportunities", "jobs portal", "Saudi jobs"]
  },
  {
    path: "/faq",
    changeFrequency: "monthly",
    priority: 0.6,
    sectionAr: "الأسئلة الشائعة",
    sectionEn: "FAQ",
    keywordsAr: ["الأسئلة الشائعة", "أسئلة طاقم", "معلومات المنصة"],
    keywordsEn: ["FAQ", "Taqam FAQ", "platform questions"]
  },
  {
    path: "/help-center",
    changeFrequency: "monthly",
    priority: 0.6,
    sectionAr: "مركز المساعدة",
    sectionEn: "Help Center",
    keywordsAr: ["مركز المساعدة", "دليل الاستخدام", "شرح النظام"],
    keywordsEn: ["help center", "user guide", "product documentation"]
  },
  {
    path: "/support",
    changeFrequency: "monthly",
    priority: 0.6,
    sectionAr: "الدعم",
    sectionEn: "Support",
    keywordsAr: ["الدعم الفني", "مساعدة العملاء", "التواصل مع الدعم"],
    keywordsEn: ["technical support", "customer support", "contact support"]
  },
  {
    path: "/request-demo",
    changeFrequency: "monthly",
    priority: 0.7,
    sectionAr: "حجز جلسة تعريف",
    sectionEn: "Schedule a walkthrough",
    keywordsAr: ["حجز جلسة تعريف", "جولة تعريف", "تجربة نظام الموارد البشرية"],
    keywordsEn: ["schedule walkthrough", "book a walkthrough", "HR walkthrough"]
  },
  {
    path: "/privacy",
    changeFrequency: "yearly",
    priority: 0.3,
    sectionAr: "سياسة الخصوصية",
    sectionEn: "Privacy Policy",
    keywordsAr: ["سياسة الخصوصية", "خصوصية البيانات", "حماية البيانات"],
    keywordsEn: ["privacy policy", "data privacy", "data protection"]
  },
  {
    path: "/terms",
    changeFrequency: "yearly",
    priority: 0.3,
    sectionAr: "الشروط والأحكام",
    sectionEn: "Terms and Conditions",
    keywordsAr: ["الشروط والأحكام", "اتفاقية الاستخدام", "شروط الخدمة"],
    keywordsEn: ["terms and conditions", "terms of service", "usage agreement"]
  },
  {
    path: "/select-tenant",
    sectionAr: "اختيار الشركة",
    sectionEn: "Select Tenant",
    keywordsAr: ["اختيار الشركة"],
    keywordsEn: ["select tenant"],
    includeInSitemap: false
  },
  {
    path: "/forgot-password",
    sectionAr: "استعادة الحساب",
    sectionEn: "Recover Account",
    keywordsAr: ["استعادة الحساب"],
    keywordsEn: ["recover account"],
    includeInSitemap: false
  },
  {
    path: "/reset-password",
    sectionAr: "إعادة تعيين كلمة المرور",
    sectionEn: "Reset Password",
    keywordsAr: ["إعادة تعيين كلمة المرور"],
    keywordsEn: ["reset password"],
    includeInSitemap: false
  }
];

const marketingSeoRouteMap = new Map(
  marketingSeoRoutes.map((route) => [normalizeMarketingPath(route.path), route] as const)
);

const marketingCoreKeywords = {
  ar: ["طاقم", "الموارد البشرية", "الرواتب", "الحضور والانصراف", "السعودية", "GOSI", "WPS"],
  en: ["Taqam", "HR", "Payroll", "Attendance", "Saudi Arabia", "GOSI", "WPS"]
} satisfies Record<"ar" | "en", string[]>;

export function normalizeMarketingPath(pathname: string): string {
  if (!pathname.startsWith("/")) {
    return `/${pathname}`;
  }

  return pathname;
}

export function localizeMarketingPath(locale: "ar" | "en", pathname: string): string {
  const normalized = normalizeMarketingPath(pathname);

  if (locale !== "en") {
    return normalized;
  }

  return normalized === "/" ? "/en" : `/en${normalized}`;
}

export function getMarketingSeoDefaults(pathname: string): MarketingSeoRoute | undefined {
  return marketingSeoRouteMap.get(normalizeMarketingPath(pathname));
}

export function getIndexableMarketingRoutes(): MarketingSeoRoute[] {
  return marketingSeoRoutes.filter((route) => route.includeInSitemap !== false);
}

export function buildMarketingLanguageAlternates(pathname: string, base = getSiteUrl()) {
  const normalized = normalizeMarketingPath(pathname);
  const arUrl = `${base}${localizeMarketingPath("ar", normalized)}`;
  const enUrl = `${base}${localizeMarketingPath("en", normalized)}`;

  return {
    arUrl,
    enUrl,
    languages: {
      "ar-SA": arUrl,
      "en-US": enUrl,
      "x-default": arUrl
    }
  };
}

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
  const [headerStore, cookieStore, siteContent] = await Promise.all([
    headers(),
    cookies(),
    getPlatformSiteContent()
  ]);
  const headerLocale = headerStore.get("x-taqam-locale");
  const localeFromCookie = getMarketingLocaleFromCookie(cookieStore.get("taqam_locale")?.value);
  const locale = headerLocale === "en" || headerLocale === "ar" ? headerLocale : localeFromCookie;
  const seoDefaults = getMarketingSeoDefaults(copy.path);
  const title = locale === "ar" ? copy.titleAr : copy.titleEn;
  const description = locale === "ar" ? copy.descriptionAr : copy.descriptionEn;
  const routeKeywords =
    locale === "ar" ? (seoDefaults?.keywordsAr ?? []) : (seoDefaults?.keywordsEn ?? []);
  const explicitKeywords = locale === "ar" ? (copy.keywordsAr ?? []) : (copy.keywordsEn ?? []);
  const pageKeywords = [...routeKeywords, ...explicitKeywords];
  const section =
    locale === "ar"
      ? (copy.sectionAr ?? seoDefaults?.sectionAr)
      : (copy.sectionEn ?? seoDefaults?.sectionEn);
  const noIndex = copy.noIndex === true;
  const siteName = locale === "ar" ? siteContent.siteNameAr : siteContent.siteNameEn;
  const defaultKeywords =
    locale === "ar" ? siteContent.defaultKeywordsAr : siteContent.defaultKeywordsEn;

  const base = getSiteUrl();
  const path = copy.path.startsWith("/") ? copy.path : `/${copy.path}`;
  const { arUrl: urlAr, enUrl: urlEn, languages } = buildMarketingLanguageAlternates(path, base);
  const url = locale === "en" ? urlEn : urlAr;

  return {
    title,
    description,
    metadataBase: new URL(base),
    alternates: {
      canonical: url,
      languages
    },
    keywords: Array.from(
      new Set([...defaultKeywords, ...pageKeywords, ...marketingCoreKeywords[locale]])
    ),
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
      siteName,
      locale: locale === "ar" ? "ar_SA" : "en_US",
      alternateLocale: locale === "ar" ? ["en_US"] : ["ar_SA"],
      images: [
        {
          url: `${base}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: `${title} | ${siteName}`
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
    authors: [{ name: siteName }],
    creator: siteName,
    publisher: siteName,
    other: {
      "application-name": siteName,
      "apple-mobile-web-app-title": siteName,
      "theme-color": "#ffffff",
      "color-scheme": "light dark"
    }
  };
}
