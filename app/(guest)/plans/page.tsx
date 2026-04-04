import type { Metadata } from "next";
import Link from "next/link";

import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { marketingMetadata } from "@/lib/marketing/seo";
import { getAppLocale } from "@/lib/i18n/locale";

export async function generateMetadata(): Promise<Metadata> {
  return marketingMetadata({
    path: "/plans",
    titleAr: "تفاصيل الباقات | طاقم",
    titleEn: "Plan Details | Taqam",
    descriptionAr:
      "تفاصيل باقات طاقم: ما الذي ستحصل عليه في كل باقة، وما الإضافات المتاحة، وخيارات التوسع للشركات.",
    descriptionEn:
      "Taqam plan details: what you get in each plan, available add-ons, and scaling options.",
  });
}

const planDetails = [
  {
    nameAr: "الأساسية",
    nameEn: "Starter",
    highlightsAr: [
      "إعداد سريع خلال يوم واحد",
      "موظفين + أقسام + مسميات",
      "حضور وانصراف + إجازات",
      "تقارير أساسية",
    ],
    highlightsEn: [
      "Fast setup in one day",
      "Employees, departments, and job titles",
      "Time & attendance + leave",
      "Basic reports",
    ],
  },
  {
    nameAr: "الأعمال",
    nameEn: "Business",
    highlightsAr: [
      "كل مميزات الأساسية",
      "تشغيل الرواتب",
      "تصدير ملفات WPS",
      "صلاحيات متقدمة + سجلات",
    ],
    highlightsEn: [
      "Everything in Starter",
      "Payroll run",
      "WPS file export",
      "Advanced roles + audit logs",
    ],
    popular: true,
  },
  {
    nameAr: "المؤسسات",
    nameEn: "Enterprise",
    highlightsAr: [
      "تكاملات مخصصة (GOSI/WPS/…)",
      "SLA مخصص",
      "مدير حساب",
      "تخصيصات واجهة وتقارير",
    ],
    highlightsEn: [
      "Custom integrations (GOSI/WPS/…)",
      "Custom SLA",
      "Dedicated account manager",
      "Custom UI and reporting",
    ],
  },
];

const addons = [
  {
    ar: "استيراد بيانات من Excel / CSV",
    en: "Import data from Excel / CSV",
  },
  {
    ar: "تدريب فريق الموارد البشرية",
    en: "HR team training",
  },
  {
    ar: "تخصيص تقارير ولوحات",
    en: "Custom reports & dashboards",
  },
  {
    ar: "تكاملات خارجية حسب الطلب",
    en: "Third-party integrations on request",
  },
];

export default async function PlansPage() {
  const locale = await getAppLocale();
  const isAr = locale === "ar";
  const prefix = locale === "en" ? "/en" : "";

  return (
    <main className="bg-background">
      <section className="container mx-auto px-4 py-14">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-bold sm:text-4xl">{isAr ? "تفاصيل الباقات" : "Plan details"}</h1>
          <p className="mt-3 text-muted-foreground">
            {isAr
              ? "هنا التفاصيل بشكل واضح—ولو محتاج تخصيصات على شركتك، بنرتبها معاك."
              : "Clear details for each plan—if you need customization, we’ll tailor it to you."}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href={`${prefix}/pricing`}>
              <Button variant="outline">{isAr ? "رجوع للأسعار" : "Back to pricing"}</Button>
            </Link>
            <Link href={`${prefix}/request-demo`}>
              <Button variant="brand">{isAr ? "طلب عرض" : "Request a demo"}</Button>
            </Link>
          </div>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {planDetails.map((plan) => (
            <Card key={plan.nameEn} className={plan.popular ? "border-primary shadow-lg" : ""}>
              <CardHeader>
                <CardTitle className="text-xl">{isAr ? plan.nameAr : plan.nameEn}</CardTitle>
                <p className="text-sm text-muted-foreground">{isAr ? plan.nameEn : plan.nameAr}</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {(isAr ? plan.highlightsAr : plan.highlightsEn).map((h) => (
                    <li key={h} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span className="text-sm">{h}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  <Link href={`${prefix}/request-demo`}>
                    <Button className="w-full" variant={plan.popular ? "brand" : "brandOutline"}>
                      {isAr ? "تواصل معنا" : "Contact us"}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-t bg-muted/30 py-14">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <h2 className="text-2xl font-bold">{isAr ? "إضافات اختيارية" : "Optional add-ons"}</h2>
            <p className="text-sm text-muted-foreground">
              {isAr ? "خدمات تساعدك في الإطلاق السريع والتوسع." : "Services to help you launch faster and scale."}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {addons.map((a) => (
              <div key={a.en} className="rounded-lg border bg-background p-4">
                <p className="text-sm">{isAr ? a.ar : a.en}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
