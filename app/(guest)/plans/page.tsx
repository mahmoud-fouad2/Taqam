import type { Metadata } from "next";
import Link from "next/link";

import { CheckCircle2, Layers3, Rocket, ShieldCheck, Sparkles } from "lucide-react";

import { MarketingPageCta } from "@/components/marketing/page-cta";
import { MarketingPageHero } from "@/components/marketing/page-hero";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/ui/fade-in";
import { marketingMetadata } from "@/lib/marketing/seo";
import { getAppLocale } from "@/lib/i18n/locale";
import {
  getPricingData,
  getPricingMarketingContent,
  getPricingPlanTagline
} from "@/lib/marketing/pricing";

export async function generateMetadata(): Promise<Metadata> {
  return marketingMetadata({
    path: "/plans",
    titleAr: "تفاصيل الباقات | طاقم",
    titleEn: "Plan Details | Taqam",
    descriptionAr:
      "تفاصيل باقات طاقم: ما الذي ستحصل عليه في كل باقة، وما الإضافات المتاحة، وخيارات التوسع للشركات.",
    descriptionEn:
      "Taqam plan details: what you get in each plan, available add-ons, and scaling options."
  });
}

export default async function PlansPage() {
  const locale = await getAppLocale();
  const isAr = locale === "ar";
  const prefix = locale === "en" ? "/en" : "";
  const { plans, comparison } = await getPricingData();
  const pricingMarketing = getPricingMarketingContent();
  const planDetails = plans.map((plan) => ({
    slug: plan.slug,
    nameAr: plan.nameAr,
    nameEn: plan.name,
    sizeAr: plan.employeesLabel || "حسب نطاق الشركة",
    sizeEn: plan.employeesLabelEn || "Based on company scope",
    tagAr: getPricingPlanTagline(plan).ar,
    tagEn: getPricingPlanTagline(plan).en,
    highlightsAr: plan.featuresAr || [],
    highlightsEn: plan.featuresEn || [],
    popular: plan.isPopular,
    priceMonthly: plan.priceMonthly,
    currency: plan.currency,
    planType: plan.planType
  }));
  const totalHighlights = planDetails.reduce((sum, plan) => sum + plan.highlightsAr.length, 0);

  return (
    <main className="bg-background">
      <FadeIn>
        <MarketingPageHero
          icon={Layers3}
          badge={isAr ? pricingMarketing.plansPage.heroBadge.ar : pricingMarketing.plansPage.heroBadge.en}
          title={isAr ? pricingMarketing.plansPage.heroTitle.ar : pricingMarketing.plansPage.heroTitle.en}
          description={
            isAr
              ? pricingMarketing.plansPage.heroDescription.ar
              : pricingMarketing.plansPage.heroDescription.en
          }
          actions={[
            {
              href: `${prefix}/pricing`,
              label: isAr
                ? pricingMarketing.plansPage.heroSecondaryCtaLabel.ar
                : pricingMarketing.plansPage.heroSecondaryCtaLabel.en,
              variant: "outline"
            },
            {
              href: `${prefix}/request-demo`,
              label: isAr
                ? pricingMarketing.plansPage.heroPrimaryCtaLabel.ar
                : pricingMarketing.plansPage.heroPrimaryCtaLabel.en,
              variant: "brand"
            }
          ]}
          stats={[
            { value: `${plans.length}`, label: isAr ? "باقات أساسية" : "Core plans" },
            {
              value: `${comparison.length}+`,
              label: isAr ? "عنصر مقارنة" : "Comparison points"
            },
            { value: `${totalHighlights}+`, label: isAr ? "ميزة موضحة" : "Listed capabilities" }
          ]}
        />
      </FadeIn>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <FadeIn>
            <div className="mb-8 max-w-2xl">
              <h2 className="text-2xl font-bold">
                {isAr
                  ? pricingMarketing.plansPage.breakdownSectionTitle.ar
                  : pricingMarketing.plansPage.breakdownSectionTitle.en}
              </h2>
              <p className="text-muted-foreground mt-2">
                {isAr
                  ? pricingMarketing.plansPage.breakdownSectionDescription.ar
                  : pricingMarketing.plansPage.breakdownSectionDescription.en}
              </p>
            </div>
          </FadeIn>

          <StaggerContainer className="grid gap-6 lg:grid-cols-3">
            {planDetails.map((plan) => {
              const PlanIcon =
                plan.planType === "BASIC"
                  ? Rocket
                  : plan.planType === "PROFESSIONAL"
                    ? Sparkles
                    : ShieldCheck;
              const price = plan.priceMonthly != null ? Number(plan.priceMonthly) : null;

              return (
                <StaggerItem key={plan.nameEn}>
                  <Card
                    className={
                      plan.popular
                        ? "border-primary/40 shadow-primary/10 relative h-full overflow-hidden shadow-lg"
                        : "border-border/80 relative h-full overflow-hidden shadow-sm"
                    }>
                    {plan.popular ? (
                      <div className="bg-primary text-primary-foreground absolute end-5 top-5 rounded-full px-3 py-1 text-xs font-semibold">
                        {isAr ? "الأكثر طلبًا" : "Most popular"}
                      </div>
                    ) : null}
                    <CardHeader className="pb-4">
                      <div className="bg-primary/10 mb-4 flex h-12 w-12 items-center justify-center rounded-2xl">
                        <PlanIcon className="text-primary h-6 w-6" />
                      </div>
                      <CardTitle className="text-2xl">{isAr ? plan.nameAr : plan.nameEn}</CardTitle>
                      <p className="border-border/60 bg-muted/50 text-muted-foreground mt-1 inline-flex w-fit items-center rounded-full border px-2.5 py-0.5 text-xs font-medium">
                        {isAr ? plan.sizeAr : plan.sizeEn}
                      </p>
                      <p className="text-primary mt-1 text-sm font-medium">
                        {isAr ? plan.tagAr : plan.tagEn}
                      </p>
                      <p className="text-muted-foreground mt-3 text-sm font-medium">
                        {price != null
                          ? isAr
                            ? `${price} ${plan.currency} / شهر`
                            : `${price} ${plan.currency} / month`
                          : isAr
                            ? "سعر مخصص حسب نطاق المشروع"
                            : "Custom pricing based on project scope"}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {(isAr ? plan.highlightsAr : plan.highlightsEn).map((highlight) => (
                          <li key={highlight} className="flex items-start gap-3">
                            <CheckCircle2 className="text-primary mt-0.5 h-4 w-4 shrink-0" />
                            <span className="text-foreground/90 text-sm leading-6">
                              {highlight}
                            </span>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-8">
                        <Link href={`${prefix}/request-demo?plan=${plan.slug}`}>
                          <Button
                            className="w-full"
                            variant={plan.popular ? "brand" : "brandOutline"}>
                            {isAr ? "ناقش هذه الباقة" : "Discuss this plan"}
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </div>
      </section>

      <section className="bg-muted/30 border-t py-16">
        <div className="container mx-auto px-4">
          <FadeIn>
            <div className="mb-8 max-w-2xl">
              <h2 className="text-2xl font-bold">
                {isAr
                  ? pricingMarketing.plansPage.addonsSectionTitle.ar
                  : pricingMarketing.plansPage.addonsSectionTitle.en}
              </h2>
              <p className="text-muted-foreground mt-2">
                {isAr
                  ? pricingMarketing.plansPage.addonsSectionDescription.ar
                  : pricingMarketing.plansPage.addonsSectionDescription.en}
              </p>
            </div>
          </FadeIn>

          <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {pricingMarketing.addons.map((addon) => (
              <StaggerItem key={addon.en}>
                <div className="bg-background h-full rounded-2xl border p-5 shadow-sm">
                  <div className="bg-primary/10 mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl">
                    <CheckCircle2 className="text-primary h-5 w-5" />
                  </div>
                  <p className="text-sm leading-6">{isAr ? addon.ar : addon.en}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      <FadeIn>
        <MarketingPageCta
          title={
            isAr
              ? pricingMarketing.plansPage.recommendationCtaTitle.ar
              : pricingMarketing.plansPage.recommendationCtaTitle.en
          }
          description={
            isAr
              ? pricingMarketing.plansPage.recommendationCtaDescription.ar
              : pricingMarketing.plansPage.recommendationCtaDescription.en
          }
          primaryAction={{
            href: `${prefix}/request-demo`,
            label: isAr
              ? pricingMarketing.plansPage.recommendationCtaPrimaryLabel.ar
              : pricingMarketing.plansPage.recommendationCtaPrimaryLabel.en
          }}
          secondaryAction={{
            href: `${prefix}/features`,
            label: isAr
              ? pricingMarketing.plansPage.recommendationCtaSecondaryLabel.ar
              : pricingMarketing.plansPage.recommendationCtaSecondaryLabel.en
          }}
        />
      </FadeIn>
    </main>
  );
}
