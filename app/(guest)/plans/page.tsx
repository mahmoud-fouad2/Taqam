import type { Metadata } from "next";
import Link from "next/link";

import { CheckCircle2, Layers3, Rocket, ShieldCheck, Sparkles } from "lucide-react";

import { MarketingPageCta } from "@/components/marketing/page-cta";
import { MarketingPageHero } from "@/components/marketing/page-hero";
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
    sizeAr: "من 5 إلى 10 موظفين",
    sizeEn: "5–10 employees",
    tagAr: "مثالية للشركات الناشئة",
    tagEn: "Perfect for growing teams",
    highlightsAr: [
      "إعداد كامل خلال يوم عمل",
      "ملفات الموظفين + الأقسام + المسميات الوظيفية",
      "حضور وانصراف مع ورديات مرنة",
      "إدارة الإجازات وأرصدتها تلقائياً",
      "تسجيل حضور من التطبيق",
      "التقارير الأساسية",
      "استيراد بيانات من Excel",
      "واجهة عربية / إنجليزية كاملة",
    ],
    highlightsEn: [
      "Full setup in one business day",
      "Employee profiles, departments & job titles",
      "Attendance with flexible shifts",
      "Leave management with automatic balances",
      "Mobile check-in via the app",
      "Basic reports",
      "Excel data import",
      "Full Arabic / English interface",
    ],
  },
  {
    nameAr: "الأعمال",
    nameEn: "Business",
    sizeAr: "من 10 إلى 25 موظفًا",
    sizeEn: "10–25 employees",
    tagAr: "الأكثر طلباً للشركات المتوسطة",
    tagEn: "Most popular for mid-sized companies",
    highlightsAr: [
      "كل مميزات الأساسية",
      "مسير الرواتب الشهرية والدورية",
      "كشوف رواتب بتنسيق احترافي",
      "تصدير ملفات WPS",
      "هياكل الرواتب + الاستحقاقات والاستقطاعات",
      "صلاحيات وأدوار متقدمة",
      "سجلات التدقيق للعمليات الحساسة",
      "تقييم الأداء وخطط التطوير",
      "إدارة التوظيف والمقابلات",
      "الدعم الفني المتقدم",
    ],
    highlightsEn: [
      "Everything in Starter",
      "Monthly and periodic payroll runs",
      "Professional payslip generation",
      "WPS file export",
      "Salary structures, allowances & deductions",
      "Advanced roles & permissions",
      "Audit logs for sensitive actions",
      "Performance reviews & development plans",
      "Recruitment & interview management",
      "Priority support",
    ],
    popular: true,
  },
  {
    nameAr: "المؤسسات",
    nameEn: "Enterprise",
    sizeAr: "من 25 إلى 100+ موظف",
    sizeEn: "25–100+ employees",
    tagAr: "للشركات الكبيرة والمؤسسات",
    tagEn: "For large companies and enterprises",
    highlightsAr: [
      "كل مميزات الأعمال",
      "تكاملات مخصصة (GOSI / WPS / ERP)",
      "واجهة وتقارير حسب هوية شركتك",
      "SLA مخصص لضمان الاستجابة",
      "مدير حساب مخصص",
      "نشر على بنية تحتية مخصصة",
      "API Access حسب العقد",
      "تدريب فريق HR",
    ],
    highlightsEn: [
      "Everything in Business",
      "Custom integrations (GOSI / WPS / ERP)",
      "Custom UI and reporting to match your brand",
      "Custom SLA guarantee",
      "Dedicated account manager",
      "Custom infrastructure deployment",
      "API access per contract",
      "HR team training",
    ],
  },
];

const addons = [
  {
    ar: "إعداد وهجرة البيانات (متاح لكل الباقات)",
    en: "Data migration & setup (any plan)",
  },
  {
    ar: "تدريب فريق HR منفصل عن الباقة",
    en: "Standalone HR team training",
  },
  {
    ar: "دعم تقني ميداني (زيارات مباشرة)",
    en: "On-site technical support visits",
  },
  {
    ar: "تخصيص قوالب الرواتب وهوية الشركة",
    en: "Payslip templates & brand customisation",
  },
];

export default async function PlansPage() {
  const locale = await getAppLocale();
  const isAr = locale === "ar";
  const prefix = locale === "en" ? "/en" : "";
  const totalHighlights = planDetails.reduce((sum, plan) => sum + plan.highlightsAr.length, 0);

  return (
    <main className="bg-background">
      <MarketingPageHero
        icon={Layers3}
        badge={isAr ? "3 باقات واضحة وقابلة للتوسع" : "3 clear plans built to scale"}
        title={isAr ? "اختَر الباقة المناسبة لحجم شركتك" : "Choose the right plan for your company"}
        description={
          isAr
            ? "كل باقة مبنية على احتياج فعلي: تشغيل سريع، وضوح في المميزات، ومسار توسّع طبيعي كلما كبرت الشركة."
            : "Each plan is built around a real operating need: fast launch, clear features, and a natural upgrade path as you grow."
        }
        actions={[
          { href: `${prefix}/pricing`, label: isAr ? "مقارنة الأسعار" : "Compare pricing", variant: "outline" },
          { href: `${prefix}/request-demo`, label: isAr ? "طلب عرض تجريبي" : "Request a demo", variant: "brand" },
        ]}
        stats={[
          { value: "3", label: isAr ? "باقات أساسية" : "Core plans" },
          { value: "1", label: isAr ? "يوم عمل للإعداد" : "Business day setup" },
          { value: `${totalHighlights}+`, label: isAr ? "ميزة موضحة" : "Listed capabilities" },
        ]}
      />

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mb-8 max-w-2xl">
            <h2 className="text-2xl font-bold">{isAr ? "تفاصيل كل باقة" : "Plan breakdown"}</h2>
            <p className="mt-2 text-muted-foreground">
              {isAr
                ? "المحتوى هنا مكتوب بلغة تشغيلية واضحة، عشان تعرف بالضبط ماذا ستحصل عليه في كل مستوى."
                : "Each plan is written in operational terms, so you can quickly see what is included at every level."}
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {planDetails.map((plan) => {
              const PlanIcon =
                plan.nameEn === "Starter" ? Rocket : plan.nameEn === "Business" ? Sparkles : ShieldCheck;

              return (
                <Card
                  key={plan.nameEn}
                  className={
                    plan.popular
                      ? "relative overflow-hidden border-primary/40 shadow-lg shadow-primary/10"
                      : "relative overflow-hidden border-border/80 shadow-sm"
                  }
                >
                  {plan.popular ? (
                    <div className="absolute end-5 top-5 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                      {isAr ? "الأكثر طلبًا" : "Most popular"}
                    </div>
                  ) : null}
                  <CardHeader className="pb-4">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                      <PlanIcon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">{isAr ? plan.nameAr : plan.nameEn}</CardTitle>
                    <p className="mt-1 inline-flex items-center rounded-full border border-border/60 bg-muted/50 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                      {isAr ? plan.sizeAr : plan.sizeEn}
                    </p>
                    <p className="mt-1 text-sm font-medium text-primary">{isAr ? plan.tagAr : plan.tagEn}</p>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {(isAr ? plan.highlightsAr : plan.highlightsEn).map((highlight) => (
                        <li key={highlight} className="flex items-start gap-3">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          <span className="text-sm leading-6 text-foreground/90">{highlight}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-8">
                      <Link href={`${prefix}/request-demo`}>
                        <Button className="w-full" variant={plan.popular ? "brand" : "brandOutline"}>
                          {isAr ? "ناقش هذه الباقة" : "Discuss this plan"}
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-t bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <div className="mb-8 max-w-2xl">
            <h2 className="text-2xl font-bold">{isAr ? "إضافات اختيارية حسب الاحتياج" : "Optional add-ons"}</h2>
            <p className="mt-2 text-muted-foreground">
              {isAr
                ? "خدمات إضافية تساعدك في سرعة الإطلاق أو ربط المنصة بعملياتك الحالية."
                : "Additional services to help you launch faster or connect the platform to your current workflows."}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {addons.map((addon) => (
              <div key={addon.en} className="rounded-2xl border bg-background p-5 shadow-sm">
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                </div>
                <p className="text-sm leading-6">{isAr ? addon.ar : addon.en}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      <MarketingPageCta
        title={isAr ? "غير متأكد أي باقة تناسبك؟" : "Not sure which plan fits best?"}
        description={
          isAr
            ? "شاركنا عدد الموظفين، وهل تحتاج الرواتب فقط أم المنصة كاملة، وسنرشّح لك الباقة الأنسب بدون تعقيد تجاري زائد."
            : "Tell us your headcount and whether you need payroll only or the full platform, and we will recommend the right plan without the usual sales noise."
        }
        primaryAction={{ href: `${prefix}/request-demo`, label: isAr ? "اطلب توصية مخصصة" : "Get a tailored recommendation" }}
        secondaryAction={{ href: `${prefix}/features`, label: isAr ? "استعرض المميزات" : "Explore features" }}
      />
    </main>
  );
}
