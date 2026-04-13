import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
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

export type RequestDemoHighlightContent = {
  title: LocalizedText;
  description: LocalizedText;
};

export type RequestDemoContent = {
  badge: LocalizedText;
  title: LocalizedText;
  description: LocalizedText;
  formTitle: LocalizedText;
  formDescription: LocalizedText;
  sideTitle: LocalizedText;
  sideDescription: LocalizedText;
  secondaryCtaTitle: LocalizedText;
  secondaryCtaDescription: LocalizedText;
  secondaryCtaLabel: LocalizedText;
  highlights: RequestDemoHighlightContent[];
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
  requestDemo: RequestDemoContent;
};

export type PlatformSiteContentAdminState = {
  draft: PlatformSiteContent;
  published: PlatformSiteContent;
  hasUnpublishedChanges: boolean;
  lastDraftSavedAt: string | null;
  lastPublishedAt: string | null;
};

const publishedContentFilePath = path.join(process.cwd(), "data", "platform-site-content.json");
const draftContentFilePath = path.join(process.cwd(), "data", "platform-site-content.draft.json");

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
      ar: "منصة سعودية • متوافقة مع GOSI وWPS • ثنائية اللغة",
      en: "Saudi-built • GOSI & WPS ready • Bilingual"
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
  },
  requestDemo: {
    badge: {
      ar: "عرض سريع • تهيئة مخصصة • دعم مباشر",
      en: "Fast demo • Tailored setup • Direct support"
    },
    title: {
      ar: "اطلب عرضًا يوضح كيف ستعمل طاقم داخل شركتك",
      en: "Request a demo tailored to how Taqam fits your company"
    },
    description: {
      ar: "املأ النموذج وسيتواصل معك فريقنا خلال 24 ساعة مع عرض يناسب حجم الشركة، آلية الرواتب، ومتطلبات الحضور والامتثال.",
      en: "Fill in the form and our team will contact you within 24 hours with a demo tailored to your company size, payroll workflow, and compliance needs."
    },
    formTitle: {
      ar: "بيانات الشركة",
      en: "Company details"
    },
    formDescription: {
      ar: "جميع الحقول المطلوبة معلمة بـ *",
      en: "Required fields are marked with *"
    },
    sideTitle: {
      ar: "Demo عملي يركز على ما يهم فريقك",
      en: "A practical demo focused on what matters to your team"
    },
    sideDescription: {
      ar: "بدلاً من عرض عام، نجهز الجلسة على أساس عدد الموظفين، التعقيد التشغيلي، والخطوات التي تريد أتمتتها أولاً.",
      en: "Instead of a generic tour, we shape the session around employee count, operational complexity, and the workflows you want to automate first."
    },
    secondaryCtaTitle: {
      ar: "هل تريد مراجعة الباقات أولاً؟",
      en: "Prefer to review plans first?"
    },
    secondaryCtaDescription: {
      ar: "اطلع على الباقات والأسعار الحالية، ثم عد لطلب العرض عندما تكون جاهزًا.",
      en: "Review the current plans and pricing, then come back for a tailored demo when you're ready."
    },
    secondaryCtaLabel: {
      ar: "استعراض الباقات",
      en: "Explore plans"
    },
    highlights: [
      {
        title: {
          ar: "استجابة خلال 24 ساعة",
          en: "Response within 24 hours"
        },
        description: {
          ar: "فريقنا يراجع الطلب بسرعة ويقترح لك المسار المناسب مباشرة.",
          en: "Our team reviews your request quickly and recommends the right rollout path."
        }
      },
      {
        title: {
          ar: "مهيأ للامتثال السعودي",
          en: "Ready for Saudi compliance"
        },
        description: {
          ar: "رواتب، حضور، ولوائح تشغيل بصياغة تناسب السوق السعودي.",
          en: "Payroll, attendance, and HR workflows tailored for the Saudi market."
        }
      },
      {
        title: {
          ar: "تهيئة حسب شركتك",
          en: "Configured for your company"
        },
        description: {
          ar: "نضبط الصلاحيات، الهيكل، والخطوات حسب حجم فريقك ونشاطك.",
          en: "We configure roles, structure, and workflows for your team size and operating model."
        }
      }
    ]
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

function normalizeRequestDemoHighlight(
  value: unknown,
  fallback: RequestDemoHighlightContent
): RequestDemoHighlightContent {
  if (!value || typeof value !== "object") {
    return fallback;
  }

  const source = value as Partial<RequestDemoHighlightContent>;
  return {
    title: normalizeLocalizedText(source.title, fallback.title),
    description: normalizeLocalizedText(source.description, fallback.description)
  };
}

function normalizeRequestDemo(value: unknown, fallback: RequestDemoContent): RequestDemoContent {
  if (!value || typeof value !== "object") {
    return fallback;
  }

  const source = value as Partial<RequestDemoContent> & { highlights?: unknown };
  const highlights = Array.isArray(source.highlights)
    ? fallback.highlights.map((item, index) =>
        normalizeRequestDemoHighlight(source.highlights?.[index], item)
      )
    : fallback.highlights;

  return {
    badge: normalizeLocalizedText(source.badge, fallback.badge),
    title: normalizeLocalizedText(source.title, fallback.title),
    description: normalizeLocalizedText(source.description, fallback.description),
    formTitle: normalizeLocalizedText(source.formTitle, fallback.formTitle),
    formDescription: normalizeLocalizedText(source.formDescription, fallback.formDescription),
    sideTitle: normalizeLocalizedText(source.sideTitle, fallback.sideTitle),
    sideDescription: normalizeLocalizedText(source.sideDescription, fallback.sideDescription),
    secondaryCtaTitle: normalizeLocalizedText(source.secondaryCtaTitle, fallback.secondaryCtaTitle),
    secondaryCtaDescription: normalizeLocalizedText(
      source.secondaryCtaDescription,
      fallback.secondaryCtaDescription
    ),
    secondaryCtaLabel: normalizeLocalizedText(source.secondaryCtaLabel, fallback.secondaryCtaLabel),
    highlights
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
    careers: normalizeSection(source.careers, defaultContent.careers),
    requestDemo: normalizeRequestDemo(source.requestDemo, defaultContent.requestDemo)
  };
}

export async function getPlatformSiteContent(): Promise<PlatformSiteContent> {
  return getPlatformSiteContentVersion("published");
}

async function readNormalizedContentFile(filePath: string): Promise<PlatformSiteContent | null> {
  try {
    const raw = await readFile(filePath, "utf8");
    return normalizeContent(JSON.parse(raw));
  } catch {
    return null;
  }
}

async function readFileTimestamp(filePath: string): Promise<string | null> {
  try {
    const result = await stat(filePath);
    return result.mtime.toISOString();
  } catch {
    return null;
  }
}

export async function getPlatformSiteContentVersion(
  version: "draft" | "published"
): Promise<PlatformSiteContent> {
  const published = (await readNormalizedContentFile(publishedContentFilePath)) ?? defaultContent;

  if (version === "draft") {
    return (await readNormalizedContentFile(draftContentFilePath)) ?? published;
  }

  return published;
}

export async function getPlatformSiteContentAdminState(): Promise<PlatformSiteContentAdminState> {
  const [draft, published, lastDraftSavedAt, lastPublishedAt] = await Promise.all([
    getPlatformSiteContentVersion("draft"),
    getPlatformSiteContentVersion("published"),
    readFileTimestamp(draftContentFilePath),
    readFileTimestamp(publishedContentFilePath)
  ]);

  return {
    draft,
    published,
    hasUnpublishedChanges: JSON.stringify(draft) !== JSON.stringify(published),
    lastDraftSavedAt,
    lastPublishedAt
  };
}

export async function savePlatformSiteContentDraft(content: PlatformSiteContent): Promise<PlatformSiteContent> {
  const normalized = normalizeContent(content);
  await mkdir(path.dirname(draftContentFilePath), { recursive: true });
  await writeFile(draftContentFilePath, `${JSON.stringify(normalized, null, 2)}\n`, "utf8");
  return normalized;
}

export async function publishPlatformSiteContent(): Promise<PlatformSiteContent> {
  const draft = await getPlatformSiteContentVersion("draft");
  await mkdir(path.dirname(publishedContentFilePath), { recursive: true });
  await writeFile(publishedContentFilePath, `${JSON.stringify(draft, null, 2)}\n`, "utf8");
  return draft;
}

export async function savePlatformSiteContent(content: PlatformSiteContent): Promise<PlatformSiteContent> {
  return savePlatformSiteContentDraft(content);
}