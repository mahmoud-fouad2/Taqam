import type { Metadata } from "next";
import Link from "next/link";

import { CheckCircle2, CircleDollarSign, Minus, ShieldCheck, Sparkles } from "lucide-react";

import { MarketingPageCta } from "@/components/marketing/page-cta";
import { MarketingPageHero } from "@/components/marketing/page-hero";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/ui/fade-in";
import { marketingMetadata } from "@/lib/marketing/seo";
import { getPlatformSiteContent } from "@/lib/marketing/site-content";
import { getPricingData, getPricingMarketingContent } from "@/lib/marketing/pricing";
import { getAppLocale } from "@/lib/i18n/locale";

export async function generateMetadata(): Promise<Metadata> {
  const siteContent = await getPlatformSiteContent();

  return marketingMetadata({
    path: "/pricing",
    titleAr: `${siteContent.pricing.title.ar} | ${siteContent.siteNameAr}`,
    titleEn: `${siteContent.pricing.title.en} | ${siteContent.siteNameEn} Plans`,
    descriptionAr: siteContent.pricing.description.ar,
    descriptionEn: siteContent.pricing.description.en
  });
}

export default async function PricingPage() {
  const locale = await getAppLocale();
  const isAr = locale === "ar";
  const siteContent = await getPlatformSiteContent();
  const p = locale === "en" ? "/en" : "";
  const pricingMarketing = getPricingMarketingContent();

  const { plans, comparison } = await getPricingData();
  const startingPrice = plans.reduce<number | null>((min, plan) => {
    const price = plan.priceMonthly != null ? Number(plan.priceMonthly) : null;
    if (price == null || Number.isNaN(price)) {
      return min;
    }

    return min == null ? price : Math.min(min, price);
  }, null);

  return (
    <main className="bg-background">
      <FadeIn>
        <MarketingPageHero
          icon={CircleDollarSign}
          badge={isAr ? siteContent.pricing.badge.ar : siteContent.pricing.badge.en}
          title={isAr ? siteContent.pricing.title.ar : siteContent.pricing.title.en}
          description={isAr ? siteContent.pricing.description.ar : siteContent.pricing.description.en}
          actions={[
            {
              href: `${p}/plans`,
              label: isAr ? "تفاصيل الباقات" : "Plan details",
              variant: "outline"
            },
            {
              href: `${p}/request-demo`,
              label: isAr ? "احجز عرضًا تجريبيًا" : "Book a demo",
              variant: "brand"
            }
          ]}
          stats={[
            { value: `${plans.length}`, label: isAr ? "خطط متاحة" : "Available plans" },
            {
              value: startingPrice != null ? `${startingPrice}` : isAr ? "حسب الطلب" : "Custom",
              label: isAr ? "سعر البداية الشهري" : "Starting monthly price"
            },
            { value: `${comparison.length}+`, label: isAr ? "عنصر مقارنة" : "Comparison points" }
          ]}
        />
      </FadeIn>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <FadeIn>
            <div className="mb-8 max-w-2xl">
              <h2 className="text-2xl font-bold">
                {isAr
                  ? pricingMarketing.pricingPage.plansSectionTitle.ar
                  : pricingMarketing.pricingPage.plansSectionTitle.en}
              </h2>
              <p className="text-muted-foreground mt-2">
                {isAr
                  ? pricingMarketing.pricingPage.plansSectionDescription.ar
                  : pricingMarketing.pricingPage.plansSectionDescription.en}
              </p>
            </div>
          </FadeIn>

          <StaggerContainer className="grid gap-6 lg:grid-cols-3">
            {plans.map((plan) => {
              const price = plan.priceMonthly != null ? Number(plan.priceMonthly) : null;
              const priceText = price != null ? String(price) : isAr ? "تواصل معنا" : "Contact us";
              const employeesText = isAr ? plan.employeesLabel : plan.employeesLabelEn;
              const features = (isAr ? plan.featuresAr : plan.featuresEn) as string[];
              const PlanIcon = plan.isPopular
                ? Sparkles
                : price == null
                  ? ShieldCheck
                  : CircleDollarSign;

              return (
                <StaggerItem key={plan.name}>
                  <Card
                    className={
                      plan.isPopular
                        ? "border-primary/40 shadow-primary/10 relative flex h-full flex-col overflow-hidden shadow-lg"
                        : "border-border/80 relative flex h-full flex-col overflow-hidden shadow-sm"
                    }>
                    {plan.isPopular ? (
                      <div className="bg-primary text-primary-foreground absolute end-5 top-5 rounded-full px-3 py-1 text-xs font-semibold">
                        {isAr ? "الأكثر طلبًا" : "Most popular"}
                      </div>
                    ) : null}
                    <CardHeader className="pb-4">
                      <div className="bg-primary/10 mb-4 flex h-12 w-12 items-center justify-center rounded-2xl">
                        <PlanIcon className="text-primary h-6 w-6" />
                      </div>
                      <CardTitle className="text-2xl">{isAr ? plan.nameAr : plan.name}</CardTitle>
                      <CardDescription>{isAr ? plan.name : plan.nameAr}</CardDescription>
                      <div className="mt-4 flex items-end justify-between gap-3">
                        <div>
                          <div className="text-4xl font-bold tracking-tight">{priceText}</div>
                          <div className="text-muted-foreground text-sm">
                            {price != null
                              ? isAr
                                ? `ريال / شهر`
                                : `${plan.currency} / month`
                              : employeesText}
                          </div>
                        </div>
                        {price != null ? (
                          <div className="bg-muted/50 text-muted-foreground rounded-full border px-3 py-1 text-xs">
                            {employeesText}
                          </div>
                        ) : null}
                      </div>
                    </CardHeader>
                    <CardContent className="flex flex-1 flex-col justify-between">
                      <ul className="space-y-3">
                        {features.map((feature) => (
                          <li key={feature} className="flex items-start gap-3">
                            <CheckCircle2 className="text-primary mt-0.5 h-4 w-4 shrink-0" />
                            <span className="text-sm leading-6">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Link href={`${p}/request-demo?plan=${plan.slug}`} className="mt-8 block">
                        <Button
                          className="w-full"
                          variant={plan.isPopular ? "brand" : "brandOutline"}>
                          {isAr ? "طلب اشتراك" : "Request subscription"}
                        </Button>
                      </Link>
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
            <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <h2 className="text-2xl font-bold">
                  {isAr
                    ? pricingMarketing.pricingPage.comparisonSectionTitle.ar
                    : pricingMarketing.pricingPage.comparisonSectionTitle.en}
                </h2>
                <p className="text-muted-foreground mt-2">
                  {isAr
                    ? pricingMarketing.pricingPage.comparisonSectionDescription.ar
                    : pricingMarketing.pricingPage.comparisonSectionDescription.en}
                </p>
              </div>
              <div className="bg-background text-muted-foreground rounded-full border px-4 py-2 text-sm">
                {isAr
                  ? pricingMarketing.pricingPage.comparisonFootnote.ar
                  : pricingMarketing.pricingPage.comparisonFootnote.en}
              </div>
            </div>
          </FadeIn>

          <FadeIn>
            <div className="bg-background overflow-hidden rounded-3xl border shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isAr ? "الميزة" : "Feature"}</TableHead>
                    <TableHead className="text-center">Starter</TableHead>
                    <TableHead className="text-center">Business</TableHead>
                    <TableHead className="text-center">Enterprise</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comparison.map((row) => (
                    <TableRow key={row.featureEn}>
                      <TableCell className="font-medium">
                        {isAr ? row.featureAr : row.featureEn}
                      </TableCell>
                      <TableCell className="text-center">
                        {row.inStarter ? (
                          <CheckCircle2 className="text-primary mx-auto h-4 w-4" />
                        ) : (
                          <Minus className="text-muted-foreground/40 mx-auto h-4 w-4" />
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {row.inBusiness ? (
                          <CheckCircle2 className="text-primary mx-auto h-4 w-4" />
                        ) : (
                          <Minus className="text-muted-foreground/40 mx-auto h-4 w-4" />
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {row.inEnterprise ? (
                          <CheckCircle2 className="text-primary mx-auto h-4 w-4" />
                        ) : (
                          <Minus className="text-muted-foreground/40 mx-auto h-4 w-4" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </FadeIn>
        </div>
      </section>

      <FadeIn>
        <MarketingPageCta
          title={
            isAr
              ? pricingMarketing.pricingPage.customCtaTitle.ar
              : pricingMarketing.pricingPage.customCtaTitle.en
          }
          description={
            isAr
              ? pricingMarketing.pricingPage.customCtaDescription.ar
              : pricingMarketing.pricingPage.customCtaDescription.en
          }
          primaryAction={{
            href: `${p}/request-demo`,
            label: isAr
              ? pricingMarketing.pricingPage.customCtaPrimaryLabel.ar
              : pricingMarketing.pricingPage.customCtaPrimaryLabel.en
          }}
          secondaryAction={{
            href: `${p}/plans`,
            label: isAr
              ? pricingMarketing.pricingPage.customCtaSecondaryLabel.ar
              : pricingMarketing.pricingPage.customCtaSecondaryLabel.en
          }}
        />
      </FadeIn>
    </main>
  );
}
