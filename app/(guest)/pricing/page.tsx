import type { Metadata } from "next";
import Link from "next/link";

import { CheckCircle2, CircleDollarSign, Minus, ShieldCheck, Sparkles } from "lucide-react";

import { MarketingPageCta } from "@/components/marketing/page-cta";
import { MarketingPageHero } from "@/components/marketing/page-hero";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { marketingMetadata } from "@/lib/marketing/seo";
import { getAppLocale } from "@/lib/i18n/locale";
import { prisma } from "@/lib/db";

export async function generateMetadata(): Promise<Metadata> {
  return marketingMetadata({
    path: "/pricing",
    titleAr: "الأسعار | باقات طاقم",
    titleEn: "Pricing | Taqam Plans",
    descriptionAr:
      "اختر الباقة المناسبة لحجم شركتك: Starter, Business, Enterprise. أسعار واضحة ومزايا قابلة للتوسّع.",
    descriptionEn:
      "Choose the right plan for your company: Starter, Business, Enterprise. Clear pricing and scalable features.",
  });
}

// Fallback plans if database is empty
const fallbackPlans = [
  {
    name: "Starter",
    nameAr: "الأساسية",
    priceMonthly: 499,
    currency: "SAR",
    employeesLabel: "حتى 25 موظف",
    employeesLabelEn: "Up to 25 employees",
    featuresAr: ["إدارة الموظفين", "الحضور والانصراف", "الإجازات", "التقارير الأساسية"],
    featuresEn: ["Employee management", "Time & attendance", "Leave management", "Basic reports"],
    isPopular: false,
  },
  {
    name: "Business",
    nameAr: "الأعمال",
    priceMonthly: 999,
    currency: "SAR",
    employeesLabel: "حتى 100 موظف",
    employeesLabelEn: "Up to 100 employees",
    featuresAr: ["كل مميزات الأساسية", "إدارة الرواتب", "تصدير WPS", "دعم فني متقدم"],
    featuresEn: ["Everything in Starter", "Payroll", "WPS export", "Priority support"],
    isPopular: true,
  },
  {
    name: "Enterprise",
    nameAr: "المؤسسات",
    priceMonthly: null,
    currency: "SAR",
    employeesLabel: "غير محدود",
    employeesLabelEn: "Unlimited",
    featuresAr: ["كل مميزات الأعمال", "تكاملات مخصصة", "وصول API", "مدير حساب مخصص"],
    featuresEn: ["Everything in Business", "Custom integrations", "API access", "Dedicated account manager"],
    isPopular: false,
  },
];

const fallbackComparison = [
  { featureAr: "إدارة الموظفين", featureEn: "Employee management", inStarter: true, inBusiness: true, inEnterprise: true },
  { featureAr: "الحضور والانصراف", featureEn: "Time & attendance", inStarter: true, inBusiness: true, inEnterprise: true },
  { featureAr: "الرواتب", featureEn: "Payroll", inStarter: false, inBusiness: true, inEnterprise: true },
  { featureAr: "تصدير WPS", featureEn: "WPS export", inStarter: false, inBusiness: true, inEnterprise: true },
  { featureAr: "صلاحيات وأدوار", featureEn: "Roles & permissions", inStarter: true, inBusiness: true, inEnterprise: true },
  { featureAr: "تكاملات مخصصة", featureEn: "Custom integrations", inStarter: false, inBusiness: false, inEnterprise: true },
];

async function getPricingData() {
  try {
    const [dbPlans, dbComparison] = await Promise.all([
      prisma.pricingPlan.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.planFeatureComparison.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      }),
    ]);

    return {
      plans: dbPlans.length > 0 ? dbPlans : fallbackPlans,
      comparison: dbComparison.length > 0 ? dbComparison : fallbackComparison,
    };
  } catch {
    // Return fallback data if database fails
    return {
      plans: fallbackPlans,
      comparison: fallbackComparison,
    };
  }
}

export default async function PricingPage() {
  const locale = await getAppLocale();
  const isAr = locale === "ar";
  const p = locale === "en" ? "/en" : "";

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
      <MarketingPageHero
        icon={CircleDollarSign}
        badge={isAr ? "أسعار واضحة بدون تعقيد" : "Clear pricing without the clutter"}
        title={isAr ? "الأسعار" : "Pricing"}
        description={
          isAr
            ? "باقات مرنة للشركات الصغيرة والمتوسطة والمؤسسات، مع انتقال واضح بين المستويات بدل قوائم أسعار معقدة."
            : "Flexible plans for small teams, growing businesses, and enterprises, with a clear path between tiers instead of noisy pricing tables."
        }
        actions={[
          { href: `${p}/plans`, label: isAr ? "تفاصيل الباقات" : "Plan details", variant: "outline" },
          { href: `${p}/request-demo`, label: isAr ? "احجز عرضًا تجريبيًا" : "Book a demo", variant: "brand" },
        ]}
        stats={[
          { value: `${plans.length}`, label: isAr ? "خطط متاحة" : "Available plans" },
          { value: startingPrice != null ? `${startingPrice}` : isAr ? "حسب الطلب" : "Custom", label: isAr ? "سعر البداية الشهري" : "Starting monthly price" },
          { value: `${comparison.length}+`, label: isAr ? "عنصر مقارنة" : "Comparison points" },
        ]}
      />

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mb-8 max-w-2xl">
            <h2 className="text-2xl font-bold">{isAr ? "الباقات المتاحة" : "Available plans"}</h2>
            <p className="mt-2 text-muted-foreground">
              {isAr
                ? "كل بطاقة توضح مستوى الخدمة والسعة والميزات الأساسية بشكل مباشر."
                : "Each card shows the service level, capacity, and core capabilities in a direct way."}
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {plans.map((plan) => {
              const price = plan.priceMonthly != null ? Number(plan.priceMonthly) : null;
              const priceText = price != null ? String(price) : isAr ? "تواصل معنا" : "Contact us";
              const employeesText = isAr ? plan.employeesLabel : plan.employeesLabelEn;
              const features = (isAr ? plan.featuresAr : plan.featuresEn) as string[];
              const PlanIcon = plan.isPopular ? Sparkles : price == null ? ShieldCheck : CircleDollarSign;

              return (
                <Card
                  key={plan.name}
                  className={
                    plan.isPopular
                      ? "relative overflow-hidden border-primary/40 shadow-lg shadow-primary/10"
                      : "relative overflow-hidden border-border/80 shadow-sm"
                  }
                >
                  {plan.isPopular ? (
                    <div className="absolute end-5 top-5 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                      {isAr ? "الأكثر طلبًا" : "Most popular"}
                    </div>
                  ) : null}
                  <CardHeader className="pb-4">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                      <PlanIcon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">{isAr ? plan.nameAr : plan.name}</CardTitle>
                    <CardDescription>{isAr ? plan.name : plan.nameAr}</CardDescription>
                    <div className="mt-4 flex items-end justify-between gap-3">
                      <div>
                        <div className="text-4xl font-bold tracking-tight">{priceText}</div>
                        <div className="text-sm text-muted-foreground">
                          {price != null ? (isAr ? `ريال / شهر` : `${plan.currency} / month`) : employeesText}
                        </div>
                      </div>
                      {price != null ? (
                        <div className="rounded-full border bg-muted/50 px-3 py-1 text-xs text-muted-foreground">
                          {employeesText}
                        </div>
                      ) : null}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          <span className="text-sm leading-6">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Link href={`${p}/request-demo`} className="mt-8 block">
                      <Button className="w-full" variant={plan.isPopular ? "brand" : "brandOutline"}>
                        {isAr ? "طلب اشتراك" : "Request subscription"}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-t bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-bold">{isAr ? "مقارنة سريعة" : "Quick comparison"}</h2>
              <p className="mt-2 text-muted-foreground">
                {isAr
                  ? "جدول مختصر يعطيك الصورة العامة: ما الذي يدخل في كل خطة، وما الذي يحتاج مستوى أعلى."
                  : "A compact overview of what is included in each plan and what requires a higher tier."}
              </p>
            </div>
            <div className="rounded-full border bg-background px-4 py-2 text-sm text-muted-foreground">
              {isAr ? "قابل للتخصيص حسب نطاق المشروع" : "Can be tailored to project scope"}
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border bg-background shadow-sm">
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
                    <TableCell className="font-medium">{isAr ? row.featureAr : row.featureEn}</TableCell>
                    <TableCell className="text-center">
                      {row.inStarter ? (
                        <CheckCircle2 className="mx-auto h-4 w-4 text-primary" />
                      ) : (
                        <Minus className="mx-auto h-4 w-4 text-muted-foreground/40" />
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {row.inBusiness ? (
                        <CheckCircle2 className="mx-auto h-4 w-4 text-primary" />
                      ) : (
                        <Minus className="mx-auto h-4 w-4 text-muted-foreground/40" />
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {row.inEnterprise ? (
                        <CheckCircle2 className="mx-auto h-4 w-4 text-primary" />
                      ) : (
                        <Minus className="mx-auto h-4 w-4 text-muted-foreground/40" />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

        </div>
      </section>

      <MarketingPageCta
        title={isAr ? "تحتاج عرض سعر مختلف؟" : "Need a custom commercial offer?"}
        description={
          isAr
            ? "إذا كان عندك عدد موظفين كبير، أو تحتاج نشر خاص أو تكاملات خارجية، نجهز لك عرضًا يناسب شكل التشغيل الحقيقي عندك."
            : "If you have a large workforce, need dedicated deployment, or external integrations, we can shape a commercial offer around your actual operating setup."
        }
        primaryAction={{ href: `${p}/request-demo`, label: isAr ? "اطلب عرض سعر مخصص" : "Request custom pricing" }}
        secondaryAction={{ href: `${p}/plans`, label: isAr ? "راجع تفاصيل الباقات" : "Review plan details" }}
      />
    </main>
  );
}
