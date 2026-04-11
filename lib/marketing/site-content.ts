import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type LocalizedText = {
  ar: string;
  en: string;
};

export type HomeContent = {
  badge: LocalizedText;
  title: LocalizedText;
  description: LocalizedText;
  primaryCtaLabel: LocalizedText;
  primaryCtaHref: string;
};

export type SectionContent = {
  badge: LocalizedText;
  title: LocalizedText;
  description: LocalizedText;
};

export type PlatformSiteContent = {
  siteNameAr: string;
  siteNameEn: string;
  defaultDescriptionAr: string;
  defaultDescriptionEn: string;
  defaultKeywordsAr: string[];
  defaultKeywordsEn: string[];
  home: HomeContent;
  pricing: SectionContent;
  careers: SectionContent;
};

const contentFilePath = path.join(process.cwd(), "data", "platform-site-content.json");

const defaultContent: PlatformSiteContent = {
  siteNameAr: "طاقم",
  siteNameEn: "Taqam",
  defaultDescriptionAr:
    "طاقم منصة سحابية متكاملة لإدارة الموارد البشرية والرواتب والحضور، مصممة للسوق السعودي مع تجربة عربية/إنجليزية وامتثال للأنظمة المحلية.",
  defaultDescriptionEn:
    "Taqam is a cloud HR platform for employees, attendance, payroll, and workforce operations with Arabic and English support.",
  defaultKeywordsAr: [
    "طاقم",
    "الموارد البشرية",
    "الرواتب",
    "الحضور والانصراف",
    "نظام موارد بشرية سعودي",
    "إدارة الموظفين"
  ],
  defaultKeywordsEn: [
    "Taqam",
    "HR platform",
    "Payroll",
    "Attendance",
    "Saudi HR",
    "Workforce management"
  ],
  home: {
    badge: {
      ar: "منصة سعودية • متوافقة مع GOSI وWPS ومدد • ثنائية اللغة",
      en: "Saudi-built • GOSI, WPS & Mudad compliant • Bilingual"
    },
    title: {
      ar: "منصة إدارة الموارد البشرية الأكثر تكاملاً",
      en: "HR, Payroll & Attendance Built for Saudi Arabia"
    },
    description: {
      ar: "طاقم منصة سحابية متكاملة لإدارة الموارد البشرية والرواتب والحضور، مصممة للسوق السعودي مع تجربة عربية كاملة وامتثال للأنظمة المحلية.",
      en: "Taqam is a modern cloud platform to manage employees, attendance, and payroll with Saudi compliance and full Arabic/English experience."
    },
    primaryCtaLabel: {
      ar: "طلب عرض تجريبي مجاني",
      en: "Request a free demo"
    },
    primaryCtaHref: "/request-demo"
  },
  pricing: {
    badge: {
      ar: "أسعار واضحة بدون تعقيد",
      en: "Clear pricing without the clutter"
    },
    title: {
      ar: "الأسعار",
      en: "Pricing"
    },
    description: {
      ar: "باقات مرنة للشركات الصغيرة والمتوسطة والمؤسسات، مع انتقال واضح بين المستويات بدل قوائم أسعار معقدة.",
      en: "Flexible plans for small teams, growing businesses, and enterprises, with a clear path between tiers instead of noisy pricing tables."
    }
  },
  careers: {
    badge: {
      ar: "بوابة وظائف مجمعة لكل الشركات على طاقم",
      en: "Unified careers portal across Taqam companies"
    },
    title: {
      ar: "اكتشف فرصك التالية من بوابة توظيف واحدة",
      en: "Discover your next move from one careers portal"
    },
    description: {
      ar: "كل الوظائف المفتوحة لدى الشركات العاملة على طاقم في مكان واحد، مع صفحات مستقلة لكل شركة وتقديم مباشر من نفس البوابة.",
      en: "Browse active roles across companies running on Taqam, with dedicated portals for each company and direct applications from the same hub."
    }
  }
};

function normalizeLocalizedText(value: unknown, fallback: LocalizedText): LocalizedText {
  if (!value || typeof value !== "object") {
    return fallback;
  }

  const source = value as Partial<LocalizedText>;
  return {
    ar: typeof source.ar === "string" && source.ar.trim() ? source.ar : fallback.ar,
    en: typeof source.en === "string" && source.en.trim() ? source.en : fallback.en
  };
}

function normalizeStringArray(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const cleaned = value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);

  return cleaned.length > 0 ? cleaned : fallback;
}

function normalizeSection(value: unknown, fallback: SectionContent): SectionContent {
  if (!value || typeof value !== "object") {
    return fallback;
  }

  const section = value as Partial<SectionContent>;
  return {
    badge: normalizeLocalizedText(section.badge, fallback.badge),
    title: normalizeLocalizedText(section.title, fallback.title),
    description: normalizeLocalizedText(section.description, fallback.description)
  };
}

function normalizeContent(value: unknown): PlatformSiteContent {
  if (!value || typeof value !== "object") {
    return defaultContent;
  }

  const source = value as Partial<PlatformSiteContent>;
  const homeSource = source.home as Partial<HomeContent> | undefined;

  return {
    siteNameAr:
      typeof source.siteNameAr === "string" && source.siteNameAr.trim()
        ? source.siteNameAr
        : defaultContent.siteNameAr,
    siteNameEn:
      typeof source.siteNameEn === "string" && source.siteNameEn.trim()
        ? source.siteNameEn
        : defaultContent.siteNameEn,
    defaultDescriptionAr:
      typeof source.defaultDescriptionAr === "string" && source.defaultDescriptionAr.trim()
        ? source.defaultDescriptionAr
        : defaultContent.defaultDescriptionAr,
    defaultDescriptionEn:
      typeof source.defaultDescriptionEn === "string" && source.defaultDescriptionEn.trim()
        ? source.defaultDescriptionEn
        : defaultContent.defaultDescriptionEn,
    defaultKeywordsAr: normalizeStringArray(source.defaultKeywordsAr, defaultContent.defaultKeywordsAr),
    defaultKeywordsEn: normalizeStringArray(source.defaultKeywordsEn, defaultContent.defaultKeywordsEn),
    home: {
      badge: normalizeLocalizedText(homeSource?.badge, defaultContent.home.badge),
      title: normalizeLocalizedText(homeSource?.title, defaultContent.home.title),
      description: normalizeLocalizedText(homeSource?.description, defaultContent.home.description),
      primaryCtaLabel: normalizeLocalizedText(homeSource?.primaryCtaLabel, defaultContent.home.primaryCtaLabel),
      primaryCtaHref:
        typeof homeSource?.primaryCtaHref === "string" && homeSource.primaryCtaHref.trim()
          ? homeSource.primaryCtaHref
          : defaultContent.home.primaryCtaHref
    },
    pricing: normalizeSection(source.pricing, defaultContent.pricing),
    careers: normalizeSection(source.careers, defaultContent.careers)
  };
}

export async function getPlatformSiteContent(): Promise<PlatformSiteContent> {
  try {
    const raw = await readFile(contentFilePath, "utf8");
    return normalizeContent(JSON.parse(raw));
  } catch {
    return defaultContent;
  }
}

export async function savePlatformSiteContent(content: PlatformSiteContent): Promise<PlatformSiteContent> {
  const normalized = normalizeContent(content);
  await mkdir(path.dirname(contentFilePath), { recursive: true });
  await writeFile(contentFilePath, `${JSON.stringify(normalized, null, 2)}\n`, "utf8");
  return normalized;
}