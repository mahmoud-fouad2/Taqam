/**
 * Taqam Landing Page
 * الصفحة الرئيسية للمنصة
 */

import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

import {
  Users,
  Clock,
  CreditCard,
  Shield,
  Globe,
  ArrowLeft,
  BarChart3,
  Building2,
  CheckCircle2,
  Layers,
  Star,
  Zap,
  Lock,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/marketing/json-ld";
import {
  getCommercialClaimsBySurface,
  getMarketingTestimonials,
  getMarketingPersonaShowcase,
  getMarketingIntegrationShowcase
} from "@/lib/marketing/commercial-registry";
import { getPricingData } from "@/lib/marketing/pricing";
import { getSiteUrl } from "@/lib/marketing/site";
import { itemListSchema, pageSchema } from "@/lib/marketing/schema";
import { marketingMetadata } from "@/lib/marketing/seo";
import { getPlatformSiteContent } from "@/lib/marketing/site-content";
import { getAppLocale } from "@/lib/i18n/locale";
import { redirect } from "next/navigation";
import { FeaturesMarquee } from "@/components/marketing/features-marquee";
import { HeroVideo } from "@/components/marketing/hero-video";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/ui/fade-in";

export async function generateMetadata(): Promise<Metadata> {
  const siteContent = await getPlatformSiteContent();

  return marketingMetadata({
    path: "/",
    titleAr: `${siteContent.siteNameAr} | منصة الموارد البشرية والرواتب والحضور`,
    titleEn: `${siteContent.siteNameEn} | HR, Payroll & Attendance Platform`,
    descriptionAr: siteContent.defaultDescriptionAr,
    descriptionEn: siteContent.defaultDescriptionEn
  });
}

const homeFeatureGridAppearance = {
  "employee-management": {
    icon: Users,
    color: "text-blue-600 bg-blue-500/10"
  },
  "time-attendance": {
    icon: Clock,
    color: "text-green-600 bg-green-500/10"
  },
  "payroll-management": {
    icon: CreditCard,
    color: "text-purple-600 bg-purple-500/10"
  },
  "saudi-compliance": {
    icon: Shield,
    color: "text-orange-600 bg-orange-500/10"
  },
  "bilingual-experience": {
    icon: Globe,
    color: "text-teal-600 bg-teal-500/10"
  },
  "multi-tenant": {
    icon: Building2,
    color: "text-indigo-600 bg-indigo-500/10"
  },
  analytics: {
    icon: BarChart3,
    color: "text-rose-600 bg-rose-500/10"
  },
  "leave-management": {
    icon: Layers,
    color: "text-amber-600 bg-amber-500/10"
  }
} as const;

type HomeFeatureGridSlot = keyof typeof homeFeatureGridAppearance;

const features = getCommercialClaimsBySurface("home.feature-grid")
  .map((claim) => {
    const appearance = homeFeatureGridAppearance[claim.slot as HomeFeatureGridSlot];

    if (!appearance) {
      return null;
    }

    return {
      icon: appearance.icon,
      color: appearance.color,
      title: claim.title.ar,
      titleEn: claim.title.en,
      description: claim.description.ar,
      descriptionEn: claim.description.en
    };
  })
  .filter((feature): feature is NonNullable<typeof feature> => feature !== null);

const homeTrustItemAppearance = {
  "guided-activation": { icon: Zap },
  "secure-workspaces": { icon: Lock },
  "saudi-operations": { icon: Shield }
} as const;

type HomeTrustItemSlot = keyof typeof homeTrustItemAppearance;

const trustItems = getCommercialClaimsBySurface("home.trust-items")
  .map((claim) => {
    const appearance = homeTrustItemAppearance[claim.slot as HomeTrustItemSlot];

    if (!appearance) {
      return null;
    }

    return {
      icon: appearance.icon,
      labelAr: claim.title.ar,
      labelEn: claim.title.en
    };
  })
  .filter((item): item is NonNullable<typeof item> => item !== null);

const homeProofPillAppearance = {
  "bilingual-operations": { dot: "bg-indigo-500" },
  "unified-operations": { dot: "bg-blue-500" },
  "web-mobile": { dot: "bg-emerald-500" }
} as const;

type HomeProofPillSlot = keyof typeof homeProofPillAppearance;

const homeProofPills = getCommercialClaimsBySurface("home.proof-pills")
  .map((claim) => {
    const appearance = homeProofPillAppearance[claim.slot as HomeProofPillSlot];

    if (!appearance) {
      return null;
    }

    return {
      dot: appearance.dot,
      labelAr: claim.title.ar,
      labelEn: claim.title.en
    };
  })
  .filter((item): item is NonNullable<typeof item> => item !== null);

const homeProofStripAppearance = {
  "unified-operations": { icon: Layers },
  "arabic-first": { icon: Globe },
  "faster-adoption": { icon: Zap }
} as const;

type HomeProofStripSlot = keyof typeof homeProofStripAppearance;

const homeProofStripItems = getCommercialClaimsBySurface("home.proof-strip")
  .map((claim) => {
    const appearance = homeProofStripAppearance[claim.slot as HomeProofStripSlot];

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
  .filter((item): item is NonNullable<typeof item> => item !== null);

const homePersonaAppearance = {
  "hr-manager": {
    icon: Users,
    badge: "bg-indigo-600/90",
    surface:
      "from-indigo-500/14 via-white to-sky-500/10 dark:from-indigo-500/18 dark:via-slate-900 dark:to-sky-500/10",
    visuals: {
      primary: {
        src: "/images/marketing/screenshot-employees.svg?v=2",
        labelAr: "ملفات الموظفين",
        labelEn: "Employee records"
      },
      secondary: {
        src: "/images/marketing/screenshot-payroll-new.svg?v=2",
        labelAr: "الرواتب",
        labelEn: "Payroll"
      },
      tertiary: {
        src: "/images/marketing/mobile-employees.svg?v=2",
        labelAr: "تطبيق الموظف",
        labelEn: "Employee app"
      }
    }
  },
  executive: {
    icon: BarChart3,
    badge: "bg-blue-600/90",
    surface:
      "from-blue-500/14 via-white to-indigo-500/10 dark:from-blue-500/18 dark:via-slate-900 dark:to-indigo-500/12",
    visuals: {
      primary: {
        src: "/images/marketing/screenshot-dashboard.svg?v=2",
        labelAr: "لوحة التحكم",
        labelEn: "Dashboard"
      },
      secondary: {
        src: "/images/marketing/screenshot-analytics.svg?v=2",
        labelAr: "التحليلات",
        labelEn: "Analytics"
      },
      tertiary: {
        src: "/images/marketing/screenshot-reports.svg?v=2",
        labelAr: "التقارير",
        labelEn: "Reports"
      }
    }
  },
  employee: {
    icon: Clock,
    badge: "bg-emerald-600/90",
    surface:
      "from-emerald-500/14 via-white to-teal-500/12 dark:from-emerald-500/18 dark:via-slate-900 dark:to-teal-500/12",
    visuals: {
      primary: {
        src: "/images/marketing/mobile-dashboard.svg?v=2",
        labelAr: "الصفحة الرئيسية",
        labelEn: "Mobile home"
      },
      secondary: {
        src: "/images/marketing/mobile-payroll.svg?v=2",
        labelAr: "الرواتب",
        labelEn: "Payslip"
      },
      tertiary: {
        src: "/images/marketing/mobile-employees.svg?v=2",
        labelAr: "طلبات الموظف",
        labelEn: "Employee requests"
      }
    }
  }
} as const;

type HomePersonaSlot = keyof typeof homePersonaAppearance;

const personas = getMarketingPersonaShowcase()
  .map((persona) => {
    const appearance = homePersonaAppearance[persona.id as HomePersonaSlot];

    if (!appearance) {
      return null;
    }

    return {
      roleAr: persona.role.ar,
      roleEn: persona.role.en,
      icon: appearance.icon,
      badge: appearance.badge,
      titleAr: persona.title.ar,
      titleEn: persona.title.en,
      descAr: persona.description.ar,
      descEn: persona.description.en,
      surface: appearance.surface,
      visualCaptionAr: persona.visualCaption.ar,
      visualCaptionEn: persona.visualCaption.en,
      visuals: appearance.visuals,
      features: persona.highlights.map((highlight) => ({
        ar: highlight.ar,
        en: highlight.en
      }))
    };
  })
  .filter((persona): persona is NonNullable<typeof persona> => persona !== null);

type Persona = (typeof personas)[number];

function PersonaVisualPanel({ persona, isAr }: { persona: Persona; isAr: boolean }) {
  const visualCards = [
    {
      ...persona.visuals.primary,
      shellClassName:
        "absolute start-2 top-3 h-[15rem] w-[66%] overflow-hidden rounded-[2.5rem] border border-white/70 bg-white/90 shadow-[0_24px_48px_-28px_rgba(15,23,42,0.4)] ring-1 ring-black/5 dark:border-white/10 dark:bg-slate-950/90",
      imageClassName: "object-cover"
    },
    {
      ...persona.visuals.secondary,
      shellClassName:
        "absolute end-0 top-16 h-[10rem] w-[38%] overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 shadow-[0_20px_40px_-24px_rgba(15,23,42,0.35)] ring-1 ring-black/5 rotate-2 dark:border-white/10 dark:bg-slate-950/90",
      imageClassName: "object-cover"
    },
    {
      ...persona.visuals.tertiary,
      shellClassName:
        "absolute bottom-2 start-10 h-[10rem] w-[44%] overflow-hidden rounded-[999px] border border-white/70 bg-white/95 shadow-[0_18px_38px_-24px_rgba(15,23,42,0.35)] ring-1 ring-black/5 -rotate-3 dark:border-white/10 dark:bg-slate-950/95",
      imageClassName: "object-contain p-3"
    }
  ];

  return (
    <div className="relative min-h-[24rem] overflow-hidden p-6 sm:p-8 lg:min-h-[28rem]">
      <div className={`absolute inset-0 bg-gradient-to-br ${persona.surface}`} />
      <div className="bg-primary/10 absolute start-10 top-6 h-24 w-24 rounded-full blur-3xl" />
      <div className="absolute end-10 bottom-10 h-24 w-24 rounded-full bg-sky-500/10 blur-3xl" />

      <div className="relative h-full min-h-[21rem]">
        {visualCards.map((visual) => (
          <div key={visual.labelEn} className={visual.shellClassName}>
            <div className="bg-muted/30 relative h-full w-full">
              <Image
                src={visual.src}
                alt={isAr ? visual.labelAr : visual.labelEn}
                fill
                sizes="(max-width: 1024px) 100vw, 34vw"
                unoptimized={visual.src.includes(".svg")}
                className={visual.imageClassName}
              />
              <div className="absolute inset-x-3 bottom-3">
                <span className="inline-flex rounded-full border border-white/15 bg-slate-950/65 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
                  {isAr ? visual.labelAr : visual.labelEn}
                </span>
              </div>
            </div>
          </div>
        ))}

        <div className="absolute end-0 bottom-0 max-w-[13rem] rounded-[1.8rem] border border-white/70 bg-white/92 p-4 shadow-[0_20px_44px_-28px_rgba(15,23,42,0.42)] backdrop-blur dark:border-white/10 dark:bg-slate-950/92">
          <p className="text-primary text-xs font-semibold">
            {isAr ? persona.roleAr : persona.roleEn}
          </p>
          <p className="text-foreground mt-1.5 text-sm leading-6">
            {isAr ? persona.visualCaptionAr : persona.visualCaptionEn}
          </p>
        </div>
      </div>
    </div>
  );
}

const testimonials = getMarketingTestimonials();

export default async function LandingPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locale = await getAppLocale();
  const isAr = locale === "ar";
  const siteContent = await getPlatformSiteContent();
  const { plans: pricingPlans } = await getPricingData();
  const p = locale === "en" ? "/en" : "";
  const homeCtaHref = siteContent.home.primaryCtaHref.startsWith("/")
    ? `${p}${siteContent.home.primaryCtaHref === "/" ? "" : siteContent.home.primaryCtaHref}`
    : siteContent.home.primaryCtaHref;
  const marketingIntegrations = getMarketingIntegrationShowcase();
  const liveMarketingIntegrations = marketingIntegrations.filter(
    (item) => item.availability === "live"
  );
  const base = getSiteUrl();
  const pageUrl = `${base}${p}` || base;
  const pageTitle = isAr
    ? `${siteContent.siteNameAr} | منصة الموارد البشرية والرواتب والحضور`
    : `${siteContent.siteNameEn} | HR, Payroll & Attendance Platform`;
  const pageDescription = isAr
    ? siteContent.defaultDescriptionAr
    : siteContent.defaultDescriptionEn;
  const homepagePlans = pricingPlans.map((plan) => ({
    slug: plan.slug,
    name: plan.name,
    nameAr: plan.nameAr,
    priceText:
      plan.priceMonthly != null
        ? String(Number(plan.priceMonthly))
        : isAr
          ? "تواصل معنا"
          : "Contact us",
    priceEn: plan.priceMonthly == null ? "Contact us" : undefined,
    sizeAr: plan.employeesLabel || "حسب نطاق الشركة",
    sizeEn: plan.employeesLabelEn || "Based on company scope",
    features: plan.featuresAr.map((feature, index) => ({
      ar: feature,
      en: plan.featuresEn[index] || feature
    })),
    popular: plan.isPopular
  }));

  const sp = searchParams ? await searchParams : undefined;
  const tenantRequired = sp?.tenantRequired === "1";
  const nextPathRaw = sp?.next;
  const nextPath = typeof nextPathRaw === "string" ? nextPathRaw : undefined;

  if (tenantRequired) {
    const params = new URLSearchParams();
    if (nextPath) params.set("next", nextPath);
    redirect(`/select-tenant${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <main className="bg-background min-h-[calc(100vh-8rem)]">
      <JsonLd
        data={[
          pageSchema({
            url: pageUrl || base,
            locale,
            title: pageTitle,
            description: pageDescription,
            about: isAr ? "إدارة الموارد البشرية والرواتب والحضور" : "HR, payroll and attendance"
          }),
          itemListSchema({
            url: pageUrl || base,
            locale,
            name: isAr ? "أبرز مميزات طاقم" : "Taqam feature highlights",
            description: pageDescription,
            items: features.map((feature) => ({
              name: isAr ? feature.title : feature.titleEn,
              description: isAr ? feature.description : feature.descriptionEn
            }))
          })
        ]}
      />
      <StaggerContainer>
        {/* ── HERO ─────────────────────────────────────────────── */}
        <section className="relative overflow-hidden pt-20 pb-12 sm:pt-28">
          {/* Ambient glow backdrop */}
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute inset-x-0 top-0 h-[36rem] bg-[radial-gradient(ellipse_70%_50%_at_50%_-5%,rgba(99,102,241,0.18),transparent_70%)] dark:bg-[radial-gradient(ellipse_70%_50%_at_50%_-5%,rgba(99,102,241,0.25),transparent_70%)]" />
            <div className="absolute start-0 top-20 h-72 w-72 rounded-full bg-indigo-500/[0.07] blur-[120px]" />
            <div className="absolute end-0 top-32 h-64 w-64 rounded-full bg-sky-500/[0.07] blur-[100px]" />
          </div>
          <div className="container mx-auto px-4">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              {/* Left: copy */}
              <StaggerItem direction="right" className="text-center lg:text-start">
                {/* Badge */}
                <div className="mb-5 flex justify-center lg:justify-start">
                  <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-xs font-semibold text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300">
                    <span className="size-1.5 animate-pulse rounded-full bg-indigo-500" />
                    {isAr ? siteContent.home.badge.ar : siteContent.home.badge.en}
                  </span>
                </div>

                <h1 className="text-5xl leading-[1.08] font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
                  <span className="bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-sky-200 dark:via-cyan-100 dark:to-blue-200">
                    {isAr ? siteContent.home.title.ar : siteContent.home.title.en}
                  </span>
                </h1>

                <p className="text-muted-foreground/80 mx-auto mt-6 max-w-xl text-lg leading-relaxed lg:mx-0">
                  {isAr ? siteContent.home.description.ar : siteContent.home.description.en}
                </p>

                {/* Trust items */}
                <div className="mt-6 flex flex-wrap justify-center gap-4 lg:justify-start">
                  {trustItems.map((t) => (
                    <div
                      key={t.labelEn}
                      className="text-muted-foreground flex items-center gap-1.5 text-sm">
                      <t.icon className="h-4 w-4 text-indigo-500" />
                      <span>{isAr ? t.labelAr : t.labelEn}</span>
                    </div>
                  ))}
                </div>

                {/* CTA buttons */}
                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
                  <Link href={homeCtaHref}>
                    <Button
                      variant="brand"
                      size="lg"
                      className="h-12 gap-2 px-6 text-base font-semibold">
                      {isAr
                        ? siteContent.home.primaryCtaLabel.ar
                        : siteContent.home.primaryCtaLabel.en}
                      <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
                    </Button>
                  </Link>
                </div>

                {/* Trust proof pills */}
                <div className="mt-8 flex flex-wrap justify-center gap-2 border-t pt-6 lg:justify-start">
                  {homeProofPills.map((s) => (
                    <div
                      key={s.labelEn}
                      className="border-border/60 bg-muted/40 flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm">
                      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${s.dot}`} />
                      <span className="text-muted-foreground">{isAr ? s.labelAr : s.labelEn}</span>
                    </div>
                  ))}
                </div>
              </StaggerItem>

              {/* Right: screenshots panel */}
              <StaggerItem direction="left" className="relative mx-auto w-full max-w-xl">
                <div className="pointer-events-none absolute -inset-12 -z-10 rounded-[3rem] bg-gradient-to-br from-indigo-500/20 via-blue-500/12 to-purple-500/12 blur-[100px]" />

                {/* Main browser-frame screenshot */}
                <div className="group bg-card/60 overflow-hidden rounded-[2.5rem] border border-white/60 shadow-[0_40px_100px_-30px_rgba(15,23,42,0.35)] ring-1 ring-black/5 backdrop-blur-xl transition-all duration-700 hover:-translate-y-2 hover:shadow-[0_60px_120px_-30px_rgba(15,23,42,0.45)] dark:border-white/10 dark:bg-slate-950/60 dark:shadow-[0_40px_100px_-30px_rgba(0,0,0,0.6)]">
                  <div className="border-border/40 bg-muted/30 flex items-center gap-2 border-b px-4 py-3 backdrop-blur-md">
                    <div className="flex gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
                      <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/80" />
                      <span className="h-2.5 w-2.5 rounded-full bg-green-400/80" />
                    </div>
                    <div className="bg-background/80 text-muted-foreground ring-border/50 mx-auto flex items-center gap-1.5 rounded-md px-3 py-1 text-xs ring-1">
                      <span className="size-1.5 rounded-full bg-green-500" />
                      app.taqam.net
                    </div>
                  </div>
                  <HeroVideo src="/videos/hero-square.mp4" />
                </div>
              </StaggerItem>
            </div>
          </div>
        </section>
      </StaggerContainer>

      {/* ── COMPLIANCE BAR ──────────────────────────────────── */}
      <div className="border-border/50 bg-muted/20 border-y py-5 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
            <p className="text-muted-foreground shrink-0 text-xs font-medium tracking-widest uppercase">
              {isAr ? "متوافق رسمياً مع" : "Officially compliant with"}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              {[
                { id: "gosi", icon: Shield, color: "text-green-600" },
                { id: "wps", icon: CreditCard, color: "text-blue-600" }
              ].map(({ id, icon: Icon, color }) => {
                const integration = liveMarketingIntegrations.find((item) => item.id === id);

                if (!integration) {
                  return null;
                }

                return (
                <div
                  key={integration.id}
                  className="text-foreground/70 hover:text-foreground flex items-center gap-1.5 text-sm font-medium transition-colors">
                  <Icon className={`h-3.5 w-3.5 ${color}`} />
                  <span>{isAr ? integration.name.ar : integration.name.en}</span>
                </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── FEATURES ─────────────────────────────────────────── */}
      <section id="features" className="relative border-t py-20 sm:py-24 lg:py-28">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(248,250,252,0.5),rgba(255,255,255,1)_40%,rgba(248,250,252,0.3))] dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.4),rgba(2,6,23,0.7)_40%,rgba(15,23,42,0.3))]" />
        <FadeIn direction="up" className="container mx-auto px-4">
          <div className="mb-12 text-center sm:mb-14 lg:mb-16">
            <span className="border-primary/20 bg-primary/[0.07] text-primary mb-4 inline-block rounded-full border px-4 py-1.5 text-xs font-semibold">
              {isAr ? "المميزات" : "Features"}
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
              {isAr ? "كل ما تحتاجه لإدارة فريقك" : "Everything to run your team"}
            </h2>
            <p className="text-muted-foreground/80 mx-auto mt-3 max-w-xl text-base sm:mt-4 sm:text-lg">
              {isAr
                ? "مسار واحد بدل أدوات متعددة"
                : "One hub instead of multiple disconnected tools"}
            </p>
          </div>

          <FeaturesMarquee features={features} isAr={isAr} />

          <div className="mt-8 text-center sm:mt-10">
            <Link href={`${p}/features`}>
              <Button variant="outline" className="gap-2">
                {isAr ? "اكتشف كل المميزات" : "Explore all features"}
                <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
              </Button>
            </Link>
          </div>
        </FadeIn>
      </section>

      {/* ── PERSONAS ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-t py-28">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(248,250,252,0.6),rgba(255,255,255,1)_50%)] dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.5),rgba(2,6,23,0.7)_50%)]" />
        <FadeIn direction="up" className="container mx-auto px-4 text-center">
          <span className="border-primary/20 bg-primary/[0.07] text-primary mb-4 inline-block rounded-full border px-4 py-1.5 text-xs font-semibold">
            {isAr ? "لمن طاقم؟" : "Who is Taqam for?"}
          </span>
          <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            {isAr ? "مصمم لكل دور في فريقك" : "Built for every role in your team"}
          </h2>
          <p className="text-muted-foreground mx-auto mt-3 max-w-2xl">
            {isAr
              ? "بدل صور عامة منفصلة عن المنتج، كل دور هنا مرتبط بلقطات فعلية أقرب لطريقة استخدامه داخل المنصة."
              : "Instead of generic stock imagery, each role is paired with product visuals closer to the way that team actually works inside Taqam."}
          </p>

          <div className="mt-12 space-y-6 text-start">
            {personas.map((persona, i) => (
              <div
                key={persona.roleEn}
                className="group border-border/40 bg-card/60 hover:border-border/80 hover:bg-card/95 relative grid overflow-hidden rounded-[2.75rem] border shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-md transition-all duration-500 hover:shadow-xl lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)]">
                <div
                  className={`${i % 2 === 0 ? "order-1" : "order-1 lg:order-2"} flex flex-1 flex-col justify-center px-6 py-10 lg:px-12 xl:px-16`}>
                  <p className="text-primary/70 mb-3 text-xs font-bold tracking-[0.15em] uppercase">
                    {`0${i + 1} — ${isAr ? persona.roleAr : persona.roleEn}`}
                  </p>
                  <h3 className="text-2xl leading-snug font-bold lg:text-3xl">
                    {isAr ? persona.titleAr : persona.titleEn}
                  </h3>
                  <p className="text-muted-foreground mt-4 leading-relaxed">
                    {isAr ? persona.descAr : persona.descEn}
                  </p>
                  <ul className="mt-7 space-y-3.5">
                    {persona.features.map((f) => (
                      <li key={f.en} className="flex items-start gap-3">
                        <div className="bg-primary/10 mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full">
                          <CheckCircle2 className="text-primary h-3 w-3" />
                        </div>
                        <span className="text-muted-foreground text-sm">{isAr ? f.ar : f.en}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className={i % 2 === 0 ? "order-2" : "order-2 lg:order-1"}>
                  <PersonaVisualPanel persona={persona} isAr={isAr} />
                </div>
              </div>
            ))}
          </div>
        </FadeIn>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────── */}
      <section className="relative bg-slate-950 py-28 text-white dark:bg-black">
        <div className="pointer-events-none absolute inset-0 -z-0 bg-[radial-gradient(ellipse_50%_40%_at_50%_0%,rgba(99,102,241,0.12),transparent_60%)]" />
        <FadeIn direction="up" className="relative container mx-auto px-4">
          {/* Header */}
          <div className="mb-20 text-center">
            <span className="mb-4 inline-block rounded-full border border-white/10 bg-white/[0.06] px-4 py-1.5 text-xs font-semibold tracking-widest text-white/70 uppercase">
              {isAr ? "قصص النجاح" : "Success stories"}
            </span>
            <h2 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
              {isAr ? "لماذا يثق عملاؤنا بطاقم؟" : "Why do customers trust Taqam?"}
            </h2>
          </div>

          {/* Featured hero quote */}
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <svg
              aria-hidden="true"
              className="mx-auto mb-6 h-12 w-12 text-indigo-400 opacity-60"
              fill="currentColor"
              viewBox="0 0 32 32">
              <path d="M10 6C5.6 6 2 9.6 2 14c0 4 2.7 7.4 6.5 8.3L6 26h4l3.5-6c.3-.6.5-1.3.5-2V6H10zm14 0c-4.4 0-8 3.6-8 8 0 4 2.7 7.4 6.5 8.3L20 26h4l3.5-6c.3-.6.5-1.3.5-2V6h-4z" />
            </svg>
            <blockquote className="text-xl leading-relaxed font-light text-white/90 italic sm:text-2xl">
              {isAr ? testimonials[0].quote.ar : testimonials[0].quote.en}
            </blockquote>
            <div className="mt-9 flex items-center justify-center gap-4">
              <Image
                alt={isAr ? testimonials[0].name.ar : testimonials[0].name.en}
                className="rounded-full object-cover ring-2 ring-indigo-500/50"
                height={52}
                src={testimonials[0].avatarSrc}
                unoptimized
                width={52}
              />
              <div className="text-start">
                <p className="font-semibold text-white">
                  {isAr ? testimonials[0].name.ar : testimonials[0].name.en}
                </p>
                <p className="text-sm text-white/60">
                  {isAr ? testimonials[0].role.ar : testimonials[0].role.en}
                </p>
                <div className="mt-1.5 flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="h-3 w-3 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Two compact testimonials */}
          <div className="grid gap-5 border-t border-white/10 pt-12 sm:grid-cols-2">
            {testimonials.slice(1).map((t) => (
              <div
                key={t.id}
                className="group flex gap-5 rounded-[2.5rem] border border-white/5 bg-white/[0.02] p-8 backdrop-blur-xl transition-all duration-500 hover:-translate-y-1.5 hover:border-white/15 hover:bg-white/[0.06] hover:shadow-[0_24px_40px_-15px_rgba(0,0,0,0.5)]">
                <Image
                  alt={isAr ? t.name.ar : t.name.en}
                  className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-white/15"
                  height={48}
                  src={t.avatarSrc}
                  unoptimized
                  width={48}
                />
                <div>
                  <svg
                    aria-hidden="true"
                    className="mb-2 h-5 w-5 text-indigo-400/60"
                    fill="currentColor"
                    viewBox="0 0 32 32">
                    <path d="M10 6C5.6 6 2 9.6 2 14c0 4 2.7 7.4 6.5 8.3L6 26h4l3.5-6c.3-.6.5-1.3.5-2V6H10zm14 0c-4.4 0-8 3.6-8 8 0 4 2.7 7.4 6.5 8.3L20 26h4l3.5-6c.3-.6.5-1.3.5-2V6h-4z" />
                  </svg>
                  <p className="text-sm leading-relaxed text-white/80">
                    {isAr ? t.quote.ar : t.quote.en}
                  </p>
                  <p className="mt-3 text-sm font-semibold text-white">
                    {isAr ? t.name.ar : t.name.en}
                  </p>
                  <p className="text-xs text-white/60">{isAr ? t.role.ar : t.role.en}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Proof strip */}
          <div className="mt-16 grid gap-4 border-t border-white/10 pt-12 sm:grid-cols-3">
            {homeProofStripItems.map((item) => {
              const ItemIcon = item.icon;
              return (
                <div
                  key={item.titleEn}
                  className="rounded-[2rem] border border-white/10 bg-white/5 p-6 text-start backdrop-blur-sm">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-indigo-300">
                    <ItemIcon className="h-5 w-5" />
                  </div>
                  <p className="mt-4 text-lg font-semibold text-white">
                    {isAr ? item.titleAr : item.titleEn}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-white/65">
                    {isAr ? item.descAr : item.descEn}
                  </p>
                </div>
              );
            })}
          </div>
        </FadeIn>
      </section>

      {/* ── PRICING ──────────────────────────────────────────── */}
      <section id="pricing" className="py-28">
        <FadeIn direction="up" className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <span className="border-primary/20 bg-primary/[0.07] text-primary mb-4 inline-block rounded-full border px-4 py-1.5 text-xs font-semibold">
              {isAr ? "الأسعار" : "Pricing"}
            </span>
            <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
              {isAr ? "باقات تناسب كل حجم" : "Plans for every team size"}
            </h2>
            <p className="text-muted-foreground/80 mx-auto mt-4 max-w-lg text-lg">
              {isAr
                ? "اختر الباقة المناسبة الآن ووسّعها لاحقًا حسب نمو فريقك"
                : "Choose the right plan now and scale it as your team grows"}
            </p>
          </div>
          <div className="relative grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {homepagePlans.map((plan) => (
              <div
                key={plan.slug}
                className={`group border-border/40 bg-card/60 hover:border-border/80 relative flex flex-col overflow-hidden rounded-[2.5rem] border shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:shadow-xl ${
                  plan.popular ? "border-primary/40 ring-primary/20 shadow-lg ring-2" : ""
                }`}>
                {plan.popular && (
                  <div className="bg-primary text-primary-foreground px-4 py-1.5 text-center text-xs font-bold tracking-wide uppercase">
                    {isAr ? "الأكثر اختيارًا" : "Popular"}
                  </div>
                )}
                <div className="flex flex-1 flex-col p-6">
                  <div className="mb-5">
                    <h3 className="text-xl font-bold">{isAr ? plan.nameAr : plan.name}</h3>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {isAr ? plan.name : plan.nameAr}
                    </p>
                    <div className="mt-4 flex items-end gap-1">
                      {plan.priceText !== (isAr ? "تواصل معنا" : "Contact us") ? (
                        <>
                          <span className="text-4xl font-extrabold">{plan.priceText}</span>
                          <span className="text-muted-foreground mb-1">
                            {isAr ? " ريال/شهر" : " SAR/mo"}
                          </span>
                        </>
                      ) : (
                        <span className="text-2xl font-bold">
                          {isAr ? plan.priceText : plan.priceEn}
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {isAr ? plan.sizeAr : plan.sizeEn}
                    </p>
                  </div>

                  <ul className="mb-6 flex-1 space-y-2.5">
                    {plan.features.map((f) => (
                      <li key={f.en} className="flex items-start gap-2.5">
                        <CheckCircle2 className="text-primary mt-0.5 h-4 w-4 shrink-0" />
                        <span className="text-sm">{isAr ? f.ar : f.en}</span>
                      </li>
                    ))}
                  </ul>

                  <Link href={`${p}/request-demo?plan=${plan.slug}`}>
                    <Button
                      className="w-full"
                      variant={plan.popular ? "brand" : "brandOutline"}
                      size="lg">
                      {isAr ? "ابدأ الآن" : "Get started"}
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href={`${p}/pricing`}>
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground gap-1">
                {isAr ? "عرض صفحة الأسعار التفصيلية" : "View detailed pricing"}
                <ChevronRight className="h-4 w-4 rtl:rotate-180" />
              </Button>
            </Link>
          </div>
        </FadeIn>
      </section>

      {/* ── INTEGRATIONS ─────────────────────────────────────── */}
      <section id="integrations" className="relative overflow-hidden border-t py-20">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.08),transparent_52%)]" />
        <FadeIn direction="up" className="container mx-auto max-w-6xl px-4">
          <div className="mx-auto mb-8 max-w-2xl text-center">
            <h3 className="text-xl font-bold">
              {isAr
                ? "تكاملات متاحة الآن وتكاملات تُجهّز للمؤسسات"
                : "Available integrations and enterprise connections"}
            </h3>
            <p className="text-muted-foreground mt-2 text-sm">
              {isAr
                ? "نعرض التكاملات المتاحة حالياً. بعض التكاملات تتطلب تهيئة على مستوى المؤسسة حسب الاحتياج."
                : "This list includes what's available today. Some integrations require enterprise-specific setup."}
            </p>
          </div>
          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-3 sm:grid-cols-2 lg:gap-3.5 xl:grid-cols-3">
            {marketingIntegrations.map((item) => (
              <div
                key={item.id}
                className={`group border-border/45 bg-card/78 flex flex-col rounded-[1.85rem] border p-2 shadow-[0_10px_28px_rgba(15,23,42,0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(15,23,42,0.08)] sm:p-2.5 ${
                  item.availability === "live"
                    ? "hover:border-sky-200/80"
                    : "border-amber-200/60 hover:border-amber-300/80"
                }`}>
                <div className="bg-background/85 mx-auto w-full rounded-[1.45rem] p-2">
                  <div
                    className={`relative aspect-[16/10] w-full overflow-hidden rounded-[1.15rem] border border-black/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] ${item.frameClassName}`}>
                    <div className="flex h-full w-full items-center justify-center p-5">
                      <Image
                        src={item.logoSrc}
                        alt={isAr ? item.name.ar : item.name.en}
                        width={480}
                        height={300}
                        sizes="(max-width: 640px) 80vw, (max-width: 1280px) 40vw, 20vw"
                        unoptimized
                        className={`h-full w-full rounded-[0.95rem] object-contain transition-transform duration-300 group-hover:scale-[1.02] ${item.imageClassName}`}
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <p className="text-[13px] font-semibold tracking-tight sm:text-sm">
                      {isAr ? item.name.ar : item.name.en}
                    </p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        item.availability === "live"
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                          : "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                      }`}>
                      {item.availability === "live"
                        ? isAr
                          ? "Live"
                          : "Live"
                        : isAr
                          ? "مخصص"
                          : "Custom"}
                    </span>
                  </div>
                  <p className="text-muted-foreground mt-1 text-[10px] leading-4.5 sm:text-[11px]">
                    {isAr ? item.description.ar : item.description.en}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </FadeIn>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-t py-28">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-sky-50 via-white to-indigo-100/80 dark:from-indigo-600 dark:via-blue-600 dark:to-purple-700" />
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_-20%,rgba(59,130,246,0.14),transparent_60%)] dark:bg-[radial-gradient(ellipse_at_50%_-20%,rgba(255,255,255,0.15),transparent_60%)]" />
        <FadeIn className="container mx-auto px-4 text-center">
          <div className="mx-auto max-w-2xl">
            <p className="mb-3 text-sm font-semibold tracking-widest text-sky-700/80 uppercase dark:text-white/70">
              {isAr ? "ابدأ اليوم" : "Get started today"}
            </p>
            <h2 className="text-3xl font-extrabold text-slate-950 sm:text-4xl dark:text-white">
              {isAr ? "هل تريد تجربة المنصة؟" : "Want to try the platform?"}
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base text-slate-600 dark:text-white/80">
              {isAr
                ? "احجز جلسة تعريف قصيرة لنراجع معك كيف تعمل وحدات الموارد البشرية والحضور والرواتب ضمن سير عمل واحد."
                : "Schedule a short walkthrough to see how HR, attendance, and payroll fit into one workflow."}
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href={`${p}/request-demo`}>
                <Button
                  size="lg"
                  variant="brand"
                  className="h-12 gap-2 px-8 text-base font-semibold shadow-lg">
                  {isAr ? "احجز جلسة تعريف" : "Schedule a walkthrough"}
                  <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
                </Button>
              </Link>
              <Link href={`${p}/pricing`}>
                <Button
                  size="lg"
                  variant="brandOutline"
                  className="h-12 gap-2 px-8 text-base backdrop-blur">
                  {isAr ? "عرض الأسعار" : "View pricing"}
                </Button>
              </Link>
            </div>
            <p className="mt-5 text-xs text-slate-500 dark:text-white/60">
              {isAr
                ? "لا حاجة لبطاقة ائتمانية • إعداد سريع • دعم فني متاح"
                : "No credit card required • Fast setup • Support available"}
            </p>
          </div>
        </FadeIn>
      </section>
    </main>
  );
}
