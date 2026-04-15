import path from "node:path";

import {
  readCommercialContent,
  readCommercialContentTimestamp,
  writeCommercialContent
} from "@/lib/marketing/commercial-content-storage";

export interface MarketingPricingPlan {
  slug: string;
  name: string;
  nameAr: string;
  priceMonthly: number | null;
  currency: string;
  employeesLabel: string | null;
  employeesLabelEn: string | null;
  featuresAr: string[];
  featuresEn: string[];
  isPopular: boolean;
  planType: "TRIAL" | "BASIC" | "PROFESSIONAL" | "ENTERPRISE";
  sortOrder: number;
}

export interface MarketingPricingComparisonRow {
  featureAr: string;
  featureEn: string;
  inStarter: boolean;
  inBusiness: boolean;
  inEnterprise: boolean;
  sortOrder: number;
}

export interface LocalizedMarketingText {
  ar: string;
  en: string;
}

const RECRUITMENT_DIFFERENTIATOR_PATTERN =
  /(بوابة التوظيف|التوظيف|المتقدمين|careers portal|applicant|recruitment)/i;

export interface PricingMarketingContent {
  pricingPage: {
    heroPrimaryCtaLabel: LocalizedMarketingText;
    heroSecondaryCtaLabel: LocalizedMarketingText;
    plansSectionTitle: LocalizedMarketingText;
    plansSectionDescription: LocalizedMarketingText;
    comparisonSectionTitle: LocalizedMarketingText;
    comparisonSectionDescription: LocalizedMarketingText;
    comparisonFootnote: LocalizedMarketingText;
    customCtaTitle: LocalizedMarketingText;
    customCtaDescription: LocalizedMarketingText;
    customCtaPrimaryLabel: LocalizedMarketingText;
    customCtaSecondaryLabel: LocalizedMarketingText;
    popularBadge: LocalizedMarketingText;
    planCardPrimaryCtaLabel: LocalizedMarketingText;
  };
  plansPage: {
    heroBadge: LocalizedMarketingText;
    heroTitle: LocalizedMarketingText;
    heroDescription: LocalizedMarketingText;
    heroPrimaryCtaLabel: LocalizedMarketingText;
    heroSecondaryCtaLabel: LocalizedMarketingText;
    breakdownSectionTitle: LocalizedMarketingText;
    breakdownSectionDescription: LocalizedMarketingText;
    addonsSectionTitle: LocalizedMarketingText;
    addonsSectionDescription: LocalizedMarketingText;
    recommendationCtaTitle: LocalizedMarketingText;
    recommendationCtaDescription: LocalizedMarketingText;
    recommendationCtaPrimaryLabel: LocalizedMarketingText;
    recommendationCtaSecondaryLabel: LocalizedMarketingText;
    popularBadge: LocalizedMarketingText;
    planCardPrimaryCtaLabel: LocalizedMarketingText;
    taglines: {
      basic: LocalizedMarketingText;
      professional: LocalizedMarketingText;
      enterprise: LocalizedMarketingText;
      popular: LocalizedMarketingText;
    };
  };
  addons: LocalizedMarketingText[];
}

export type PricingMarketingContentAdminState = {
  draft: PricingMarketingContent;
  published: PricingMarketingContent;
  hasUnpublishedChanges: boolean;
  lastDraftSavedAt: string | null;
  lastPublishedAt: string | null;
};

const publishedPricingMarketingContentFilePath = path.join(
  process.cwd(),
  "data",
  "pricing-marketing-content.json"
);
const draftPricingMarketingContentFilePath = path.join(
  process.cwd(),
  "data",
  "pricing-marketing-content.draft.json"
);
const publishedPricingMarketingContentRemoteKey =
  "commercial-content/pricing-marketing-content.published.json";
const draftPricingMarketingContentRemoteKey =
  "commercial-content/pricing-marketing-content.draft.json";

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function normalizePlanType(value: unknown): MarketingPricingPlan["planType"] {
  if (
    value === "TRIAL" ||
    value === "BASIC" ||
    value === "PROFESSIONAL" ||
    value === "ENTERPRISE"
  ) {
    return value;
  }

  return "BASIC";
}

function normalizeLocalizedMarketingText(
  value: unknown,
  fallback: LocalizedMarketingText
): LocalizedMarketingText {
  if (!value || typeof value !== "object") {
    return fallback;
  }

  const source = value as Partial<LocalizedMarketingText>;

  return {
    ar: typeof source.ar === "string" && source.ar.trim() ? source.ar : fallback.ar,
    en: typeof source.en === "string" && source.en.trim() ? source.en : fallback.en
  };
}

function normalizeLocalizedMarketingList(
  value: unknown,
  fallback: LocalizedMarketingText[]
): LocalizedMarketingText[] {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const normalized = value
    .map((entry, index) =>
      normalizeLocalizedMarketingText(entry, fallback[index] ?? fallback[fallback.length - 1])
    )
    .filter((entry) => entry.ar.trim().length > 0 && entry.en.trim().length > 0);

  return normalized.length > 0 ? normalized : fallback;
}

function normalizePricingPlan(plan: any): MarketingPricingPlan {
  return {
    slug: typeof plan.slug === "string" && plan.slug.trim() ? plan.slug : "starter",
    name: typeof plan.name === "string" ? plan.name : "Starter",
    nameAr: typeof plan.nameAr === "string" ? plan.nameAr : "الأساسية",
    priceMonthly:
      typeof plan.priceMonthly === "number"
        ? plan.priceMonthly
        : plan.priceMonthly == null
          ? null
          : Number(plan.priceMonthly),
    currency: typeof plan.currency === "string" ? plan.currency : "SAR",
    employeesLabel: typeof plan.employeesLabel === "string" ? plan.employeesLabel : null,
    employeesLabelEn: typeof plan.employeesLabelEn === "string" ? plan.employeesLabelEn : null,
    featuresAr: asStringArray(plan.featuresAr),
    featuresEn: asStringArray(plan.featuresEn),
    isPopular: Boolean(plan.isPopular),
    planType: normalizePlanType(plan.planType),
    sortOrder: typeof plan.sortOrder === "number" ? plan.sortOrder : 0
  };
}

function normalizeComparisonRow(row: any): MarketingPricingComparisonRow {
  return {
    featureAr: typeof row.featureAr === "string" ? row.featureAr : "",
    featureEn: typeof row.featureEn === "string" ? row.featureEn : "",
    inStarter: Boolean(row.inStarter),
    inBusiness: Boolean(row.inBusiness),
    inEnterprise: Boolean(row.inEnterprise),
    sortOrder: typeof row.sortOrder === "number" ? row.sortOrder : 0
  };
}

export const fallbackPlans: MarketingPricingPlan[] = [
  {
    slug: "starter",
    name: "Starter",
    nameAr: "الأساسية",
    priceMonthly: 499,
    currency: "SAR",
    employeesLabel: "من 5 إلى 10 موظفين",
    employeesLabelEn: "5–10 employees",
    featuresAr: [
      "ملفات الموظفين والحضور والإجازات",
      "تسجيل الحضور من التطبيق",
      "التقارير الأساسية",
      "واجهة عربية / إنجليزية كاملة"
    ],
    featuresEn: [
      "Employee profiles, attendance & leave",
      "Mobile check-in app",
      "Basic reports (PDF / Excel)",
      "Full Arabic / English interface"
    ],
    isPopular: false,
    planType: "BASIC",
    sortOrder: 1
  },
  {
    slug: "business",
    name: "Business",
    nameAr: "الأعمال",
    priceMonthly: 999,
    currency: "SAR",
    employeesLabel: "من 10 إلى 25 موظفًا",
    employeesLabelEn: "10–25 employees",
    featuresAr: [
      "كل مميزات الأساسية",
      "مسير الرواتب + تصدير WPS",
      "تكامل GOSI والاستحقاقات",
      "بوابة التوظيف وإدارة المتقدمين"
    ],
    featuresEn: [
      "Everything in Starter",
      "Payroll processing + WPS export",
      "GOSI integration & allowances",
      "Careers portal & applicant tracking"
    ],
    isPopular: true,
    planType: "PROFESSIONAL",
    sortOrder: 2
  },
  {
    slug: "enterprise",
    name: "Enterprise",
    nameAr: "المؤسسات",
    priceMonthly: null,
    currency: "SAR",
    employeesLabel: "من 25 إلى 100+ موظف",
    employeesLabelEn: "25–100+ employees",
    featuresAr: [
      "كل مميزات الأعمال",
      "تكاملات مخصصة (مدد / ERP)",
      "مدير حساب + SLA مخصص",
      "وصول API وتقارير مخصصة"
    ],
    featuresEn: [
      "Everything in Business",
      "Custom integrations (Mudad / ERP)",
      "Dedicated account manager + custom SLA",
      "API access & custom reports"
    ],
    isPopular: false,
    planType: "ENTERPRISE",
    sortOrder: 3
  }
].map(normalizePricingPlan);

export const fallbackComparison: MarketingPricingComparisonRow[] = [
  {
    featureAr: "إدارة الموظفين والهيكل التنظيمي",
    featureEn: "Employee management & org chart",
    inStarter: true,
    inBusiness: true,
    inEnterprise: true,
    sortOrder: 1
  },
  {
    featureAr: "الحضور والانصراف والورديات",
    featureEn: "Time & attendance with shifts",
    inStarter: true,
    inBusiness: true,
    inEnterprise: true,
    sortOrder: 2
  },
  {
    featureAr: "إدارة الإجازات والأرصدة",
    featureEn: "Leave management & balances",
    inStarter: true,
    inBusiness: true,
    inEnterprise: true,
    sortOrder: 3
  },
  {
    featureAr: "تطبيق الجوال (iOS & Android)",
    featureEn: "Mobile app (iOS & Android)",
    inStarter: true,
    inBusiness: true,
    inEnterprise: true,
    sortOrder: 4
  },
  {
    featureAr: "مسير الرواتب الشهرية",
    featureEn: "Payroll processing",
    inStarter: false,
    inBusiness: true,
    inEnterprise: true,
    sortOrder: 5
  },
  {
    featureAr: "تصدير WPS + تكامل GOSI",
    featureEn: "WPS export + GOSI integration",
    inStarter: false,
    inBusiness: true,
    inEnterprise: true,
    sortOrder: 6
  },
  {
    featureAr: "تقييم الأداء والتوظيف",
    featureEn: "Performance reviews & recruitment",
    inStarter: false,
    inBusiness: true,
    inEnterprise: true,
    sortOrder: 7
  },
  {
    featureAr: "أدوار متقدمة وسجلات تدقيق",
    featureEn: "Advanced roles & audit logs",
    inStarter: false,
    inBusiness: true,
    inEnterprise: true,
    sortOrder: 8
  },
  {
    featureAr: "تكاملات مدد / ERP",
    featureEn: "Mudad / ERP integrations",
    inStarter: false,
    inBusiness: false,
    inEnterprise: true,
    sortOrder: 9
  },
  {
    featureAr: "مدير حساب مخصص + SLA",
    featureEn: "Dedicated account manager + SLA",
    inStarter: false,
    inBusiness: false,
    inEnterprise: true,
    sortOrder: 10
  },
  {
    featureAr: "وصول API وتقارير مخصصة",
    featureEn: "API access & custom reports",
    inStarter: false,
    inBusiness: false,
    inEnterprise: true,
    sortOrder: 11
  }
].map(normalizeComparisonRow);

export const pricingMarketingContent: PricingMarketingContent = {
  pricingPage: {
    heroPrimaryCtaLabel: {
      ar: "احجز عرضًا تجريبيًا",
      en: "Book a demo"
    },
    heroSecondaryCtaLabel: {
      ar: "تفاصيل الباقات",
      en: "Plan details"
    },
    plansSectionTitle: {
      ar: "الباقات المتاحة",
      en: "Available plans"
    },
    plansSectionDescription: {
      ar: "كل بطاقة توضح مستوى الخدمة والسعة والميزات الأساسية بشكل مباشر.",
      en: "Each card shows the service level, capacity, and core capabilities in a direct way."
    },
    comparisonSectionTitle: {
      ar: "مقارنة سريعة",
      en: "Quick comparison"
    },
    comparisonSectionDescription: {
      ar: "جدول مختصر يعطيك الصورة العامة: ما الذي يدخل في كل خطة، وما الذي يحتاج مستوى أعلى.",
      en: "A compact overview of what is included in each plan and what requires a higher tier."
    },
    comparisonFootnote: {
      ar: "قابل للتخصيص حسب نطاق المشروع",
      en: "Can be tailored to project scope"
    },
    customCtaTitle: {
      ar: "تحتاج عرض سعر مختلف؟",
      en: "Need a custom commercial offer?"
    },
    customCtaDescription: {
      ar: "إذا كان عندك عدد موظفين كبير، أو تحتاج نشر خاص أو تكاملات خارجية، نجهز لك عرضًا يناسب شكل التشغيل الحقيقي عندك.",
      en: "If you have a large workforce, need dedicated deployment, or external integrations, we can shape a commercial offer around your actual operating setup."
    },
    customCtaPrimaryLabel: {
      ar: "اطلب عرض سعر مخصص",
      en: "Request custom pricing"
    },
    customCtaSecondaryLabel: {
      ar: "راجع تفاصيل الباقات",
      en: "Review plan details"
    },
    popularBadge: {
      ar: "الأكثر طلبًا",
      en: "Most popular"
    },
    planCardPrimaryCtaLabel: {
      ar: "طلب اشتراك",
      en: "Request subscription"
    }
  },
  plansPage: {
    heroBadge: {
      ar: "3 باقات واضحة وقابلة للتوسع",
      en: "3 clear plans built to scale"
    },
    heroTitle: {
      ar: "اختَر الباقة المناسبة لحجم شركتك",
      en: "Choose the right plan for your company"
    },
    heroDescription: {
      ar: "كل باقة مبنية على احتياج فعلي: تشغيل سريع، وضوح في المميزات، ومسار توسّع طبيعي كلما كبرت الشركة.",
      en: "Each plan is built around a real operating need: fast launch, clear features, and a natural upgrade path as you grow."
    },
    heroPrimaryCtaLabel: {
      ar: "احجز جلسة تعريف",
      en: "Schedule a walkthrough"
    },
    heroSecondaryCtaLabel: {
      ar: "مقارنة الأسعار",
      en: "Compare pricing"
    },
    breakdownSectionTitle: {
      ar: "تفاصيل كل باقة",
      en: "Plan breakdown"
    },
    breakdownSectionDescription: {
      ar: "المحتوى هنا مكتوب بلغة تشغيلية واضحة، عشان تعرف بالضبط ماذا ستحصل عليه في كل مستوى.",
      en: "Each plan is written in operational terms, so you can quickly see what is included at every level."
    },
    addonsSectionTitle: {
      ar: "إضافات اختيارية حسب الاحتياج",
      en: "Optional add-ons"
    },
    addonsSectionDescription: {
      ar: "خدمات إضافية تساعدك في سرعة الإطلاق أو ربط المنصة بعملياتك الحالية.",
      en: "Additional services to help you launch faster or connect the platform to your current workflows."
    },
    recommendationCtaTitle: {
      ar: "غير متأكد أي باقة تناسبك؟",
      en: "Not sure which plan fits best?"
    },
    recommendationCtaDescription: {
      ar: "شاركنا عدد الموظفين، وهل تحتاج الرواتب فقط أم المنصة كاملة، وسنرشّح لك الباقة الأنسب بدون تعقيد تجاري زائد.",
      en: "Tell us your headcount and whether you need payroll only or the full platform, and we will recommend the right plan without the usual sales noise."
    },
    recommendationCtaPrimaryLabel: {
      ar: "اطلب توصية مخصصة",
      en: "Get a tailored recommendation"
    },
    recommendationCtaSecondaryLabel: {
      ar: "استعرض المميزات",
      en: "Explore features"
    },
    popularBadge: {
      ar: "الأكثر طلبًا",
      en: "Most popular"
    },
    planCardPrimaryCtaLabel: {
      ar: "ناقش هذه الباقة",
      en: "Discuss this plan"
    },
    taglines: {
      basic: {
        ar: "للإطلاق السريع وتشغيل الموارد البشرية الأساسية",
        en: "For fast launch and essential HR operations"
      },
      professional: {
        ar: "للشركات التي تحتاج HR + Payroll بشكل منظم",
        en: "For teams that need structured HR plus payroll"
      },
      enterprise: {
        ar: "للتشغيل المتقدم والتكاملات الخاصة",
        en: "For advanced operations and managed integrations"
      },
      popular: {
        ar: "الأكثر طلباً للشركات النامية",
        en: "Most popular for growing companies"
      }
    }
  },
  addons: [
    {
      ar: "إعداد وهجرة البيانات (متاح لكل الباقات)",
      en: "Data migration and setup (available with any plan)"
    },
    {
      ar: "تدريب فريق HR منفصل عن الباقة",
      en: "Standalone HR team training"
    },
    {
      ar: "دعم تقني ميداني (زيارات مباشرة)",
      en: "On-site technical support visits"
    },
    {
      ar: "تخصيص قوالب الرواتب وهوية الشركة",
      en: "Payslip templates and brand customisation"
    }
  ]
};

function normalizePricingMarketingContent(value: unknown): PricingMarketingContent {
  if (!value || typeof value !== "object") {
    return pricingMarketingContent;
  }

  const source = value as Partial<PricingMarketingContent>;
  const pricingPageSource = source.pricingPage as
    | Partial<PricingMarketingContent["pricingPage"]>
    | undefined;
  const plansPageSource = source.plansPage as
    | Partial<PricingMarketingContent["plansPage"]>
    | undefined;
  const fallback = pricingMarketingContent;

  return {
    pricingPage: {
      heroPrimaryCtaLabel: normalizeLocalizedMarketingText(
        pricingPageSource?.heroPrimaryCtaLabel,
        fallback.pricingPage.heroPrimaryCtaLabel
      ),
      heroSecondaryCtaLabel: normalizeLocalizedMarketingText(
        pricingPageSource?.heroSecondaryCtaLabel,
        fallback.pricingPage.heroSecondaryCtaLabel
      ),
      plansSectionTitle: normalizeLocalizedMarketingText(
        pricingPageSource?.plansSectionTitle,
        fallback.pricingPage.plansSectionTitle
      ),
      plansSectionDescription: normalizeLocalizedMarketingText(
        pricingPageSource?.plansSectionDescription,
        fallback.pricingPage.plansSectionDescription
      ),
      comparisonSectionTitle: normalizeLocalizedMarketingText(
        pricingPageSource?.comparisonSectionTitle,
        fallback.pricingPage.comparisonSectionTitle
      ),
      comparisonSectionDescription: normalizeLocalizedMarketingText(
        pricingPageSource?.comparisonSectionDescription,
        fallback.pricingPage.comparisonSectionDescription
      ),
      comparisonFootnote: normalizeLocalizedMarketingText(
        pricingPageSource?.comparisonFootnote,
        fallback.pricingPage.comparisonFootnote
      ),
      customCtaTitle: normalizeLocalizedMarketingText(
        pricingPageSource?.customCtaTitle,
        fallback.pricingPage.customCtaTitle
      ),
      customCtaDescription: normalizeLocalizedMarketingText(
        pricingPageSource?.customCtaDescription,
        fallback.pricingPage.customCtaDescription
      ),
      customCtaPrimaryLabel: normalizeLocalizedMarketingText(
        pricingPageSource?.customCtaPrimaryLabel,
        fallback.pricingPage.customCtaPrimaryLabel
      ),
      customCtaSecondaryLabel: normalizeLocalizedMarketingText(
        pricingPageSource?.customCtaSecondaryLabel,
        fallback.pricingPage.customCtaSecondaryLabel
      ),
      popularBadge: normalizeLocalizedMarketingText(
        pricingPageSource?.popularBadge,
        fallback.pricingPage.popularBadge
      ),
      planCardPrimaryCtaLabel: normalizeLocalizedMarketingText(
        pricingPageSource?.planCardPrimaryCtaLabel,
        fallback.pricingPage.planCardPrimaryCtaLabel
      )
    },
    plansPage: {
      heroBadge: normalizeLocalizedMarketingText(
        plansPageSource?.heroBadge,
        fallback.plansPage.heroBadge
      ),
      heroTitle: normalizeLocalizedMarketingText(
        plansPageSource?.heroTitle,
        fallback.plansPage.heroTitle
      ),
      heroDescription: normalizeLocalizedMarketingText(
        plansPageSource?.heroDescription,
        fallback.plansPage.heroDescription
      ),
      heroPrimaryCtaLabel: normalizeLocalizedMarketingText(
        plansPageSource?.heroPrimaryCtaLabel,
        fallback.plansPage.heroPrimaryCtaLabel
      ),
      heroSecondaryCtaLabel: normalizeLocalizedMarketingText(
        plansPageSource?.heroSecondaryCtaLabel,
        fallback.plansPage.heroSecondaryCtaLabel
      ),
      breakdownSectionTitle: normalizeLocalizedMarketingText(
        plansPageSource?.breakdownSectionTitle,
        fallback.plansPage.breakdownSectionTitle
      ),
      breakdownSectionDescription: normalizeLocalizedMarketingText(
        plansPageSource?.breakdownSectionDescription,
        fallback.plansPage.breakdownSectionDescription
      ),
      addonsSectionTitle: normalizeLocalizedMarketingText(
        plansPageSource?.addonsSectionTitle,
        fallback.plansPage.addonsSectionTitle
      ),
      addonsSectionDescription: normalizeLocalizedMarketingText(
        plansPageSource?.addonsSectionDescription,
        fallback.plansPage.addonsSectionDescription
      ),
      recommendationCtaTitle: normalizeLocalizedMarketingText(
        plansPageSource?.recommendationCtaTitle,
        fallback.plansPage.recommendationCtaTitle
      ),
      recommendationCtaDescription: normalizeLocalizedMarketingText(
        plansPageSource?.recommendationCtaDescription,
        fallback.plansPage.recommendationCtaDescription
      ),
      recommendationCtaPrimaryLabel: normalizeLocalizedMarketingText(
        plansPageSource?.recommendationCtaPrimaryLabel,
        fallback.plansPage.recommendationCtaPrimaryLabel
      ),
      recommendationCtaSecondaryLabel: normalizeLocalizedMarketingText(
        plansPageSource?.recommendationCtaSecondaryLabel,
        fallback.plansPage.recommendationCtaSecondaryLabel
      ),
      popularBadge: normalizeLocalizedMarketingText(
        plansPageSource?.popularBadge,
        fallback.plansPage.popularBadge
      ),
      planCardPrimaryCtaLabel: normalizeLocalizedMarketingText(
        plansPageSource?.planCardPrimaryCtaLabel,
        fallback.plansPage.planCardPrimaryCtaLabel
      ),
      taglines: {
        basic: normalizeLocalizedMarketingText(
          plansPageSource?.taglines?.basic,
          fallback.plansPage.taglines.basic
        ),
        professional: normalizeLocalizedMarketingText(
          plansPageSource?.taglines?.professional,
          fallback.plansPage.taglines.professional
        ),
        enterprise: normalizeLocalizedMarketingText(
          plansPageSource?.taglines?.enterprise,
          fallback.plansPage.taglines.enterprise
        ),
        popular: normalizeLocalizedMarketingText(
          plansPageSource?.taglines?.popular,
          fallback.plansPage.taglines.popular
        )
      }
    },
    addons: normalizeLocalizedMarketingList(source.addons, fallback.addons)
  };
}

export async function getPricingMarketingContent(
  version: "draft" | "published" = "published"
): Promise<PricingMarketingContent> {
  const published =
    (await readCommercialContent({
      filePath: publishedPricingMarketingContentFilePath,
      remoteKey: publishedPricingMarketingContentRemoteKey,
      normalize: normalizePricingMarketingContent
    })) ?? pricingMarketingContent;

  if (version === "draft") {
    return (
      (await readCommercialContent({
        filePath: draftPricingMarketingContentFilePath,
        remoteKey: draftPricingMarketingContentRemoteKey,
        normalize: normalizePricingMarketingContent
      })) ?? published
    );
  }

  return published;
}

export async function getPricingMarketingContentAdminState(): Promise<PricingMarketingContentAdminState> {
  const [draft, published, lastDraftSavedAt, lastPublishedAt] = await Promise.all([
    getPricingMarketingContent("draft"),
    getPricingMarketingContent("published"),
    readCommercialContentTimestamp({
      filePath: draftPricingMarketingContentFilePath,
      remoteKey: draftPricingMarketingContentRemoteKey
    }),
    readCommercialContentTimestamp({
      filePath: publishedPricingMarketingContentFilePath,
      remoteKey: publishedPricingMarketingContentRemoteKey
    })
  ]);

  return {
    draft,
    published,
    hasUnpublishedChanges: JSON.stringify(draft) !== JSON.stringify(published),
    lastDraftSavedAt,
    lastPublishedAt
  };
}

export async function savePricingMarketingContentDraft(
  content: PricingMarketingContent
): Promise<PricingMarketingContent> {
  const normalized = normalizePricingMarketingContent(content);
  await writeCommercialContent({
    filePath: draftPricingMarketingContentFilePath,
    remoteKey: draftPricingMarketingContentRemoteKey,
    value: normalized
  });

  return normalized;
}

export async function publishPricingMarketingContent(): Promise<PricingMarketingContent> {
  const draft = await getPricingMarketingContent("draft");
  await writeCommercialContent({
    filePath: publishedPricingMarketingContentFilePath,
    remoteKey: publishedPricingMarketingContentRemoteKey,
    value: draft
  });

  return draft;
}

export async function savePricingMarketingContent(
  content: PricingMarketingContent
): Promise<PricingMarketingContent> {
  return savePricingMarketingContentDraft(content);
}

export function getPricingPlanTagline(
  plan: Pick<MarketingPricingPlan, "isPopular" | "planType">,
  content?: PricingMarketingContent
): LocalizedMarketingText {
  const taglines = content?.plansPage.taglines ?? pricingMarketingContent.plansPage.taglines;

  if (plan.isPopular) {
    return taglines.popular;
  }

  if (plan.planType === "ENTERPRISE") {
    return taglines.enterprise;
  }

  if (plan.planType === "PROFESSIONAL") {
    return taglines.professional;
  }

  return taglines.basic;
}

function isComparisonCapabilityIncludedInPlan(
  plan: Pick<MarketingPricingPlan, "planType">,
  row: Pick<MarketingPricingComparisonRow, "inStarter" | "inBusiness" | "inEnterprise">
) {
  if (plan.planType === "ENTERPRISE") {
    return row.inEnterprise;
  }

  if (plan.planType === "PROFESSIONAL") {
    return row.inBusiness;
  }

  return row.inStarter;
}

export function getPlanCommercialDifferentiator(
  plan: Pick<MarketingPricingPlan, "planType" | "featuresAr" | "featuresEn">,
  comparison: MarketingPricingComparisonRow[]
): LocalizedMarketingText | null {
  const hasRecruitmentFeature = [...plan.featuresAr, ...plan.featuresEn].some((feature) =>
    RECRUITMENT_DIFFERENTIATOR_PATTERN.test(feature)
  );

  const hasRecruitmentComparisonCapability = comparison.some(
    (row) =>
      isComparisonCapabilityIncludedInPlan(plan, row) &&
      (RECRUITMENT_DIFFERENTIATOR_PATTERN.test(row.featureAr) ||
        RECRUITMENT_DIFFERENTIATOR_PATTERN.test(row.featureEn))
  );

  if (!hasRecruitmentFeature && !hasRecruitmentComparisonCapability) {
    return null;
  }

  return {
    ar: "ميزة تفاضلية: بوابة التوظيف وبورتال الوظائف",
    en: "Differentiator: careers portal and recruiting surface"
  };
}

export async function getPricingData() {
  try {
    const { prisma } = await import("@/lib/db");
    const [dbPlans, dbComparison] = await Promise.all([
      prisma.pricingPlan.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" }
      }),
      prisma.planFeatureComparison.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" }
      })
    ]);

    return {
      plans: dbPlans.length > 0 ? dbPlans.map(normalizePricingPlan) : fallbackPlans,
      comparison:
        dbComparison.length > 0 ? dbComparison.map(normalizeComparisonRow) : fallbackComparison
    };
  } catch {
    return {
      plans: fallbackPlans,
      comparison: fallbackComparison
    };
  }
}
