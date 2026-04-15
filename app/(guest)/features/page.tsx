import type { Metadata } from "next";
import type { LucideIcon } from "lucide-react";

import {
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Building2,
  CheckCircle2,
  Clock,
  CreditCard,
  FileDown,
  FileSpreadsheet,
  Globe,
  GraduationCap,
  LayoutDashboard,
  MessageSquare,
  Shield,
  Smartphone,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Users,
  Wallet,
  Zap
} from "lucide-react";

import { MarketingPageCta } from "@/components/marketing/page-cta";
import { MarketingPageHero } from "@/components/marketing/page-hero";
import { JsonLd } from "@/components/marketing/json-ld";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/ui/fade-in";
import type { MarketingFeatureSuiteIconKey } from "@/lib/marketing/commercial-registry";
import {
  getCommercialClaimsBySurface,
  getMarketingFeatureSuites
} from "@/lib/marketing/commercial-registry";
import { cn } from "@/lib/utils";
import { getSiteUrl } from "@/lib/marketing/site";
import { itemListSchema, pageSchema } from "@/lib/marketing/schema";
import { marketingMetadata } from "@/lib/marketing/seo";
import { getAppLocale } from "@/lib/i18n/locale";

export async function generateMetadata(): Promise<Metadata> {
  return marketingMetadata({
    path: "/features",
    titleAr: "مميزات طاقم | منصة موارد بشرية ورواتب وحضور",
    titleEn: "Taqam Features | HR, Payroll & Attendance",
    descriptionAr:
      "استكشف مميزات طاقم: إدارة موظفين، حضور وانصراف، رواتب، إجازات، تقييم أداء، تدريب، توظيف، وتقارير — كل ما تحتاجه في مكان واحد.",
    descriptionEn:
      "Explore Taqam features: employees, attendance, payroll, leave, performance, training, recruitment, and reports — everything in one place."
  });
}

type FeatureCopy = {
  ar: string;
  en: string;
};

type FeatureItem = {
  icon: LucideIcon;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
};

type FeatureSection = {
  titleAr: string;
  titleEn: string;
  eyebrowAr: string;
  eyebrowEn: string;
  summaryAr: string;
  summaryEn: string;
  outcomes: FeatureCopy[];
  items: FeatureItem[];
};

const featuresHeroClaims = getCommercialClaimsBySurface("features.hero");
const featuresHeroBadgeClaim = featuresHeroClaims.find((claim) => claim.slot === "badge");
const featuresHeroPrimaryClaim = featuresHeroClaims.find((claim) => claim.slot === "primary");
const featuresPlatformAnatomyClaim = getCommercialClaimsBySurface("features.platform-anatomy").find(
  (claim) => claim.slot === "primary"
);

const featuresPlatformHighlightAppearance = {
  "faster-operations": { icon: Zap },
  "clear-compliance": { icon: Shield },
  "bilingual-ux": { icon: Globe },
  "executive-ux": { icon: Star }
} as const;

type FeaturesPlatformHighlightSlot = keyof typeof featuresPlatformHighlightAppearance;

const platformHighlights = getCommercialClaimsBySurface("features.platform-highlights")
  .map((claim) => {
    const appearance =
      featuresPlatformHighlightAppearance[claim.slot as FeaturesPlatformHighlightSlot];

    if (!appearance) {
      return null;
    }

    return {
      icon: appearance.icon,
      titleAr: claim.title.ar,
      titleEn: claim.title.en,
      descAr: claim.description.ar,
      descEn: claim.description.en
    };
  })
  .filter((highlight): highlight is NonNullable<typeof highlight> => highlight !== null);

const suiteIconMap: Record<MarketingFeatureSuiteIconKey, LucideIcon> = {
  users: Users,
  building2: Building2,
  layoutDashboard: LayoutDashboard,
  clock: Clock,
  smartphone: Smartphone,
  messageSquare: MessageSquare,
  creditCard: CreditCard,
  fileDown: FileDown,
  wallet: Wallet,
  star: Star,
  target: Target,
  graduationCap: GraduationCap,
  bookOpen: BookOpen,
  barChart3: BarChart3,
  trendingUp: TrendingUp,
  shield: Shield,
  fileSpreadsheet: FileSpreadsheet,
  globe: Globe
};

const featureSections: FeatureSection[] = getMarketingFeatureSuites()
  .slice()
  .sort((a, b) => a.sortOrder - b.sortOrder)
  .map((suite) => ({
    titleAr: suite.title.ar,
    titleEn: suite.title.en,
    eyebrowAr: suite.eyebrow.ar,
    eyebrowEn: suite.eyebrow.en,
    summaryAr: suite.summary.ar,
    summaryEn: suite.summary.en,
    outcomes: suite.outcomes.map((outcome) => ({ ar: outcome.ar, en: outcome.en })),
    items: suite.items
      .filter((item) => item.visibility === "public" && item.statusGate === "live-only")
      .map((item) => ({
        icon: suiteIconMap[item.icon],
        titleAr: item.title.ar,
        titleEn: item.title.en,
        descAr: item.description.ar,
        descEn: item.description.en
      }))
  }));

const suiteThemes = [
  {
    panel:
      "bg-gradient-to-br from-indigo-100 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/70",
    badge:
      "border-indigo-200 bg-white/80 text-indigo-700 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-200",
    iconWrap: "bg-indigo-600 text-white",
    itemIcon:
      "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-200",
    ribbon: "bg-indigo-500",
    index: "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-200"
  },
  {
    panel:
      "bg-gradient-to-br from-blue-100 via-white to-cyan-50 dark:from-slate-950 dark:via-slate-900 dark:to-cyan-950/70",
    badge:
      "border-blue-200 bg-white/80 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-200",
    iconWrap: "bg-blue-600 text-white",
    itemIcon:
      "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-200",
    ribbon: "bg-blue-500",
    index: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-200"
  },
  {
    panel:
      "bg-gradient-to-br from-violet-100 via-white to-fuchsia-50 dark:from-slate-950 dark:via-slate-900 dark:to-violet-950/70",
    badge:
      "border-violet-200 bg-white/80 text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-200",
    iconWrap: "bg-violet-600 text-white",
    itemIcon:
      "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-200",
    ribbon: "bg-violet-500",
    index: "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-200"
  },
  {
    panel:
      "bg-gradient-to-br from-emerald-100 via-white to-teal-50 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/70",
    badge:
      "border-emerald-200 bg-white/80 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200",
    iconWrap: "bg-emerald-600 text-white",
    itemIcon:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200",
    ribbon: "bg-emerald-500",
    index: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200"
  },
  {
    panel:
      "bg-gradient-to-br from-amber-100 via-white to-orange-50 dark:from-slate-950 dark:via-slate-900 dark:to-amber-950/70",
    badge:
      "border-amber-200 bg-white/80 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200",
    iconWrap: "bg-amber-500 text-white",
    itemIcon:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200",
    ribbon: "bg-amber-500",
    index: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-200"
  },
  {
    panel:
      "bg-gradient-to-br from-slate-200 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800",
    badge:
      "border-slate-300 bg-white/80 text-slate-700 dark:border-white/15 dark:bg-white/5 dark:text-slate-200",
    iconWrap: "bg-slate-900 text-white",
    itemIcon:
      "border-slate-200 bg-slate-50 text-slate-700 dark:border-white/15 dark:bg-white/5 dark:text-slate-200",
    ribbon: "bg-slate-500",
    index: "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200"
  }
];

export default async function FeaturesPage() {
  const locale = await getAppLocale();
  const isAr = locale === "ar";
  const p = locale === "en" ? "/en" : "";
  const base = getSiteUrl();
  const pageUrl = `${base}${p}/features`;
  const pageTitle = isAr ? "مميزات طاقم" : "Taqam Features";
  const pageDescription = isAr
    ? (featuresHeroPrimaryClaim?.description.ar ??
      "استكشف وحدات طاقم الأساسية للموارد البشرية والرواتب والحضور والتوظيف — بشكل منظّم وواضح.")
    : (featuresHeroPrimaryClaim?.description.en ??
      "Explore Taqam's core modules for HR, payroll, attendance, and recruitment — organized and easy to scan.");

  const totalFeatures = featureSections.reduce((sum, section) => sum + section.items.length, 0);

  return (
    <main className="bg-background">
      <JsonLd
        data={[
          pageSchema({
            url: pageUrl,
            locale,
            title: pageTitle,
            description: pageDescription,
            type: "CollectionPage",
            about: isAr ? "مميزات إدارة الموارد البشرية" : "HR software features"
          }),
          itemListSchema({
            url: pageUrl,
            locale,
            name: isAr ? "مسارات المميزات" : "Feature suites",
            description: pageDescription,
            items: featureSections.map((section) => ({
              name: isAr ? section.titleAr : section.titleEn,
              description: isAr ? section.summaryAr : section.summaryEn
            }))
          })
        ]}
      />
      <StaggerContainer>
        <MarketingPageHero
          icon={Sparkles}
          badge={
            isAr
              ? (featuresHeroBadgeClaim?.title.ar ?? "وحدات الموارد البشرية الأساسية")
              : (featuresHeroBadgeClaim?.title.en ?? "Core HR modules")
          }
          title={
            isAr
              ? (featuresHeroPrimaryClaim?.title.ar ?? "نظام تشغيل فعلي للموارد البشرية")
              : (featuresHeroPrimaryClaim?.title.en ?? "A real operating system for HR")
          }
          description={
            isAr
              ? (featuresHeroPrimaryClaim?.description.ar ??
                "نعرض هنا وحدات طاقم الأساسية وكيف تُقسم حسب مسارات العمل — من بيانات الموظفين والحضور إلى الرواتب والتقارير والتوظيف.")
              : (featuresHeroPrimaryClaim?.description.en ??
                "This page lists Taqam's main modules and groups them by workflow — from people data and attendance to payroll, reporting, and recruitment.")
          }
          actions={[
            {
              href: `${p}/request-demo`,
              label: isAr ? "احجز جلسة تعريف" : "Schedule a walkthrough",
              variant: "brand"
            },
            {
              href: `${p}/screenshots`,
              label: isAr ? "استعرض الواجهات" : "Browse screenshots",
              variant: "outline"
            }
          ]}
          stats={[
            { value: `${totalFeatures}+`, label: isAr ? "ميزة مترابطة" : "Connected capabilities" },
            {
              value: `${featureSections.length}`,
              label: isAr ? "مسارات تشغيل" : "Operational suites"
            },
            {
              value: isAr ? "عربي + إنجليزي" : "Arabic + English",
              label: isAr ? "واجهة ثنائية اللغة" : "Bilingual experience"
            }
          ]}
          tone="indigo"
        />

        <section className="from-background to-muted/30 border-b bg-gradient-to-b py-14 sm:py-18">
          <div className="container mx-auto px-4">
            <StaggerItem
              direction="up"
              className="border-border/70 bg-background/80 rounded-[32px] border p-6 shadow-[0_28px_80px_-40px_rgba(79,70,229,0.18)] backdrop-blur-sm sm:p-8 lg:p-10">
              <div className="grid gap-6 lg:grid-cols-[1.1fr_1.35fr] lg:items-start">
                <div className="rounded-[28px] bg-[radial-gradient(circle_at_top_left,rgba(79,70,229,0.16),transparent_42%),linear-gradient(135deg,rgba(255,255,255,0.98),rgba(238,242,255,0.95))] p-6 sm:p-8 dark:bg-[radial-gradient(circle_at_top_left,rgba(79,70,229,0.16),transparent_42%),linear-gradient(135deg,rgba(15,23,42,0.98),rgba(2,6,23,0.95))]">
                  <p className="text-xs font-bold tracking-[0.18em] text-indigo-700/70 uppercase dark:text-indigo-300/80">
                    {isAr ? "بنية المنصة" : "Platform anatomy"}
                  </p>
                  <h2 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">
                    {isAr
                      ? (featuresPlatformAnatomyClaim?.title.ar ??
                        "منصة واحدة لمسارات تشغيل أساسية")
                      : (featuresPlatformAnatomyClaim?.title.en ??
                        "One platform for essential workflows")}
                  </h2>
                  <p className="mt-4 max-w-xl leading-8 text-slate-600 dark:text-slate-400">
                    {isAr
                      ? (featuresPlatformAnatomyClaim?.description.ar ??
                        "نرتّب المميزات حسب مسارات العمل حتى تعرف بسرعة ماذا يغطي النظام وكيف تُقسم الوحدات.")
                      : (featuresPlatformAnatomyClaim?.description.en ??
                        "Features are grouped by workflow so you can quickly see what's covered and how modules are organized.")}
                  </p>
                  <div className="mt-8 grid gap-3 sm:grid-cols-2">
                    {platformHighlights.map((highlight) => (
                      <div
                        key={highlight.titleEn}
                        className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-[0_18px_36px_-28px_rgba(15,23,42,0.26)] dark:border-white/10 dark:bg-slate-950/80 dark:backdrop-blur-md">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-sm">
                          <highlight.icon className="h-4 w-4" />
                        </div>
                        <h3 className="mt-4 text-sm font-bold text-slate-950 dark:text-zinc-100">
                          {isAr ? highlight.titleAr : highlight.titleEn}
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-zinc-400">
                          {isAr ? highlight.descAr : highlight.descEn}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {featureSections.map((section, idx) => {
                    const theme = suiteThemes[idx % suiteThemes.length];

                    return (
                      <StaggerItem
                        direction="up"
                        key={section.titleEn}
                        className="group border-border/70 bg-background/85 rounded-[28px] border p-5 shadow-[0_22px_60px_-34px_rgba(15,23,42,0.18)] transition-transform duration-300 hover:-translate-y-1">
                        <div
                          className={cn(
                            "inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold",
                            theme.badge
                          )}>
                          {String(idx + 1).padStart(2, "0")}
                        </div>
                        <h3 className="mt-4 text-lg font-bold tracking-tight">
                          {isAr ? section.titleAr : section.titleEn}
                        </h3>
                        <p className="text-muted-foreground mt-2 text-sm leading-6">
                          {isAr ? section.summaryAr : section.summaryEn}
                        </p>
                        <div className="text-foreground/70 mt-4 flex items-center gap-2 text-xs font-semibold">
                          <CheckCircle2 className="text-primary h-3.5 w-3.5" />
                          {isAr
                            ? `${section.items.length} مكونات داخل هذا المسار`
                            : `${section.items.length} capabilities in this suite`}
                        </div>
                      </StaggerItem>
                    );
                  })}
                </div>
              </div>
            </StaggerItem>
          </div>
        </section>

        {featureSections.map((section, sectionIndex) => {
          const theme = suiteThemes[sectionIndex % suiteThemes.length];
          const SectionIcon = section.items[0]?.icon ?? Sparkles;
          const reverse = sectionIndex % 2 === 1;

          return (
            <section
              key={section.titleEn}
              className={cn(
                "border-b py-14 sm:py-18",
                sectionIndex % 2 === 0 ? "bg-background" : "bg-muted/20"
              )}>
              <div className="container mx-auto px-4">
                <div
                  className={cn(
                    "grid gap-6 lg:grid-cols-[0.92fr_1.35fr] lg:items-stretch",
                    reverse && "lg:[&>*:first-child]:order-2"
                  )}>
                  <div
                    className={cn(
                      "border-border/60 rounded-[32px] border p-6 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.14)] sm:p-8",
                      theme.panel
                    )}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span
                          className={cn(
                            "inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
                            theme.badge
                          )}>
                          {isAr ? section.eyebrowAr : section.eyebrowEn}
                        </span>
                        <h2 className="mt-5 text-2xl font-black tracking-tight sm:text-3xl">
                          {isAr ? section.titleAr : section.titleEn}
                        </h2>
                      </div>
                      <div
                        className={cn(
                          "hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-sm sm:flex",
                          theme.iconWrap
                        )}>
                        <SectionIcon className="h-7 w-7" />
                      </div>
                    </div>

                    <p className="mt-5 leading-8 text-slate-700 dark:text-slate-300">
                      {isAr ? section.summaryAr : section.summaryEn}
                    </p>

                    <div className="mt-8 rounded-[28px] border border-white/70 bg-white/75 p-5 shadow-[0_22px_44px_-34px_rgba(15,23,42,0.24)] backdrop-blur dark:border-white/10 dark:bg-slate-950/80">
                      <div className="flex items-baseline gap-3">
                        <span className="text-3xl font-black text-slate-950 dark:text-white">
                          {section.items.length}
                        </span>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {isAr
                            ? "عناصر تشغيل داخل هذا المسار"
                            : "operational building blocks in this suite"}
                        </p>
                      </div>
                      <div className="mt-5 space-y-3">
                        {section.outcomes.map((outcome) => (
                          <div key={outcome.en} className="flex items-start gap-3">
                            <div
                              className={cn(
                                "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                                theme.index
                              )}>
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            </div>
                            <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">
                              {isAr ? outcome.ar : outcome.en}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-2">
                      {section.items.map((item) => (
                        <span
                          key={item.titleEn}
                          className="rounded-full border border-white/70 bg-white/70 px-3 py-1.5 text-xs font-medium text-slate-700 dark:border-white/10 dark:bg-slate-950/80 dark:text-slate-300 dark:backdrop-blur-md">
                          {isAr ? item.titleAr : item.titleEn}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {section.items.map((item, itemIndex) => (
                      <StaggerItem
                        direction="up"
                        key={item.titleEn}
                        className="group border-border/70 bg-background/90 relative overflow-hidden rounded-[28px] border p-5 shadow-[0_22px_56px_-36px_rgba(15,23,42,0.16)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_28px_72px_-38px_rgba(79,70,229,0.18)] sm:p-6">
                        <div className={cn("absolute inset-y-0 start-0 w-1", theme.ribbon)} />
                        <div className="flex gap-4 sm:gap-5">
                          <div
                            className={cn(
                              "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border shadow-sm",
                              theme.itemIcon
                            )}>
                            <item.icon className="h-5 w-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="mb-3 flex flex-wrap items-center gap-2">
                              <span
                                className={cn(
                                  "rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-[0.12em] uppercase",
                                  theme.index
                                )}>
                                {String(itemIndex + 1).padStart(2, "0")}
                              </span>
                              <h3 className="text-base font-bold tracking-tight sm:text-lg">
                                {isAr ? item.titleAr : item.titleEn}
                              </h3>
                            </div>
                            <p className="text-muted-foreground text-sm leading-7 sm:text-[15px]">
                              {isAr ? item.descAr : item.descEn}
                            </p>
                          </div>
                          <ArrowUpRight className="text-muted-foreground/50 group-hover:text-foreground mt-1 hidden h-4 w-4 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 sm:block" />
                        </div>
                      </StaggerItem>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          );
        })}

        <MarketingPageCta
          title={
            isAr
              ? "هل تريد رؤية المسار المناسب لفريقك؟"
              : "Want to see the right flow for your team?"
          }
          description={
            isAr
              ? "نرتّب جلسة قصيرة تركز على المسارات التي تهمك فعلاً: الموارد البشرية أو الرواتب أو الحضور أو التوظيف."
              : "We can run a short session focused on what you need first—Core HR, payroll, attendance, or recruitment."
          }
          primaryAction={{
            href: `${p}/request-demo`,
            label: isAr ? "احجز جلسة" : "Book a session"
          }}
          secondaryAction={{ href: `${p}/plans`, label: isAr ? "راجع الباقات" : "Review plans" }}
          tone="muted"
        />
      </StaggerContainer>
    </main>
  );
}
