import type { Metadata } from "next";
import Link from "next/link";

import { CheckCircle2 } from "lucide-react";

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

  return (
    <main className="bg-background">
      <section className="container mx-auto px-4 py-14">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-bold sm:text-4xl">{isAr ? "الأسعار" : "Pricing"}</h1>
          <p className="mt-3 text-muted-foreground">
            {isAr
              ? "باقات مرنة تناسب حجم شركتك. (الأسعار قابلة للتحديث حسب نطاق التطبيق)"
              : "Flexible plans that fit your company size. (Pricing may vary based on scope)"}
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => {
            const price = plan.priceMonthly ? Number(plan.priceMonthly) : null;
            const priceText = price != null ? String(price) : (isAr ? "تواصل معنا" : "Contact us");
            const employeesText = isAr ? plan.employeesLabel : plan.employeesLabelEn;
            const features = (isAr ? plan.featuresAr : plan.featuresEn) as string[];
            
            return (
              <Card key={plan.name} className={plan.isPopular ? "border-primary shadow-lg" : ""}>
                {plan.isPopular ? (
                  <div className="bg-primary px-4 py-1 text-center text-sm font-medium text-primary-foreground">
                    {isAr ? "الأكثر طلبًا" : "Most popular"}
                  </div>
                ) : null}
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{isAr ? plan.nameAr : plan.name}</CardTitle>
                  <CardDescription>{isAr ? plan.name : plan.nameAr}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{priceText}</span>
                    {price != null ? (
                      <span className="text-muted-foreground">
                        {isAr ? ` ريال/شهر` : ` ${plan.currency} / month`}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm text-muted-foreground">{employeesText}</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {features.map((f) => (
                      <li key={f} className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        <span className="text-sm">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href={`${p}/request-demo`} className="mt-6 block">
                    <Button className="w-full" variant={plan.isPopular ? "brand" : "brandOutline"}>
                      {isAr ? "طلب اشتراك" : "Request subscription"}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="border-t bg-muted/30 py-14">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <h2 className="text-2xl font-bold">{isAr ? "مقارنة سريعة" : "Quick comparison"}</h2>
            <p className="text-sm text-muted-foreground">
              {isAr ? "جدول مختصر لمساعدتك في اختيار الباقة." : "A compact table to help you choose."}
            </p>
          </div>

          <div className="overflow-hidden rounded-lg border bg-background">
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
                    <TableCell className="text-center">{row.inStarter ? "✓" : "—"}</TableCell>
                    <TableCell className="text-center">{row.inBusiness ? "✓" : "—"}</TableCell>
                    <TableCell className="text-center">{row.inEnterprise ? "✓" : "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="mt-8 text-center">
            <Link href={`${p}/plans`}>
              <Button variant="outline">{isAr ? "عرض تفاصيل الباقات" : "View plan details"}</Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
