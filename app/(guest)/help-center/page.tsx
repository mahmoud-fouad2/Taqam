import type { Metadata } from "next";
import Link from "next/link";

import {
  ArrowLeft,
  BarChart3,
  Clock3,
  HelpCircle,
  LifeBuoy,
  PlugZap,
  Rocket,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";

import { MarketingPageCta } from "@/components/marketing/page-cta";
import { MarketingPageHero } from "@/components/marketing/page-hero";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAppLocale } from "@/lib/i18n/locale";
import { marketingMetadata } from "@/lib/marketing/seo";

export async function generateMetadata(): Promise<Metadata> {
  return marketingMetadata({
    titleAr: "مركز المساعدة | طاقم",
    titleEn: "Help Center | Taqam",
    descriptionAr: "بوابة مساعدة مرتبة: أدلة الاستخدام، الأسئلة الشائعة، وصفحة دعم مستقلة للتواصل المباشر.",
    descriptionEn: "An organized help portal with usage guides, a dedicated FAQ page, and a separate support page.",
    path: "/help-center",
  });
}

const helpTopics = [
  {
    icon: Rocket,
    titleAr: "البدء والإعداد",
    titleEn: "Getting Started",
    descAr: "تهيئة الشركة، إضافة الموظفين، وضبط الأقسام والورديات في مسار واضح.",
    descEn: "Set up the company, add employees, and configure departments and shifts in a clear path.",
  },
  {
    icon: Clock3,
    titleAr: "الحضور والإجازات",
    titleEn: "Attendance & Leave",
    descAr: "تشغيل الحضور اليومي، سياسات التأخير، وطلبات الإجازة والموافقات.",
    descEn: "Handle daily attendance, tardiness policies, leave requests, and approvals.",
  },
  {
    icon: Wallet,
    titleAr: "الرواتب",
    titleEn: "Payroll",
    descAr: "تهيئة الرواتب، تشغيل المسير، وقسائم الرواتب وتصدير WPS.",
    descEn: "Configure payroll, run payroll periods, manage payslips, and export WPS.",
  },
  {
    icon: Users,
    titleAr: "بيانات الموظفين",
    titleEn: "Employee Records",
    descAr: "الملفات الوظيفية، الاستيراد، والتحديثات اليومية للموظفين.",
    descEn: "Employee records, imports, and day-to-day updates.",
  },
  {
    icon: ShieldCheck,
    titleAr: "الأدوار والحماية",
    titleEn: "Roles & Security",
    descAr: "الأدوار الحالية داخل النظام وكيفية ضبط الوصول التشغيلي داخل الشركة.",
    descEn: "Current role model and how to manage operational access inside the company.",
  },
  {
    icon: BarChart3,
    titleAr: "التقارير والتصدير",
    titleEn: "Reports & Export",
    descAr: "لوحات المتابعة، التقارير الجاهزة، وتصدير البيانات بشكل عملي.",
    descEn: "Operational dashboards, ready-made reports, and practical export flows.",
  },
];

const setupSteps = [
  { ar: "أنشئ الشركة أو انتظر تفعيلها من فريق طاقم.", en: "Create the company or wait for it to be activated by the Taqam team." },
  { ar: "فعّل حساب مدير الشركة من رابط التفعيل المرسل إلى البريد.", en: "Activate the tenant admin account from the email activation link." },
  { ar: "أضف المستخدمين الأساسيين وحدد الأدوار المناسبة لهم.", en: "Invite the core users and assign the right roles." },
  { ar: "أدخل الموظفين، الأقسام، المسميات الوظيفية، والورديات.", en: "Add employees, departments, job titles, and shifts." },
  { ar: "ابدأ التشغيل اليومي ثم راجع التقارير والطلبات من لوحة التحكم.", en: "Start daily operations, then review reports and requests from the dashboard." },
];

export default async function PublicHelpCenterPage() {
  const locale = await getAppLocale();
  const isAr = locale === "ar";
  const p = locale === "en" ? "/en" : "";

  return (
    <main className="bg-background">
      <MarketingPageHero
        icon={HelpCircle}
        badge={isAr ? "بوابة مساعدة منظمة وواضحة" : "An organized and focused help portal"}
        title={isAr ? "مركز المساعدة" : "Help Center"}
        description={
          isAr
            ? "ابدأ من الأدلة الأساسية، ثم انتقل إلى صفحة الأسئلة الشائعة أو صفحة الدعم المستقلة حسب نوع احتياجك."
            : "Start with the core guides, then move to the dedicated FAQ page or the separate support page depending on what you need."
        }
        actions={[
          { href: `${p}/faq`, label: isAr ? "الأسئلة الشائعة" : "FAQ", variant: "outline" },
          { href: `${p}/support`, label: isAr ? "الدعم الفني" : "Support", variant: "brand" },
        ]}
        stats={[
          { value: `${helpTopics.length}`, label: isAr ? "مسارات مساعدة" : "Help tracks" },
          { value: `${setupSteps.length}`, label: isAr ? "خطوات إعداد" : "Setup steps" },
          { value: isAr ? "منفصل" : "Dedicated", label: isAr ? "FAQ والدعم" : "FAQ & support" },
        ]}
      />

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid gap-5 lg:grid-cols-3">
            <Card className="border-border/80 shadow-sm">
              <CardHeader>
                <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                  <PlugZap className="h-5 w-5 text-primary" />
                </div>
                <CardTitle>{isAr ? "أدلة الاستخدام" : "Usage guides"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  {isAr
                    ? "المدخل الصحيح لفهم المنصة والإعداد الأولي اليومي بدون تشتيت."
                    : "The right starting point to understand the platform and get daily operations configured without noise."}
                </p>
                <a href="#guides" className="inline-flex items-center gap-2 font-medium text-primary hover:underline">
                  {isAr ? "استعرض الأدلة" : "Browse guides"}
                  <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
                </a>
              </CardContent>
            </Card>

            <Card className="border-border/80 shadow-sm">
              <CardHeader>
                <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                  <HelpCircle className="h-5 w-5 text-primary" />
                </div>
                <CardTitle>{isAr ? "الأسئلة الشائعة" : "FAQ"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  {isAr
                    ? "صفحة منفصلة للأسئلة المتكررة والإجابات العملية بدون دمجها مع الدعم."
                    : "A dedicated page for common questions and concise answers, separate from support."}
                </p>
                <Link href={`${p}/faq`} className="inline-flex items-center gap-2 font-medium text-primary hover:underline">
                  {isAr ? "انتقل إلى FAQ" : "Go to FAQ"}
                  <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
                </Link>
              </CardContent>
            </Card>

            <Card className="border-border/80 shadow-sm">
              <CardHeader>
                <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                  <LifeBuoy className="h-5 w-5 text-primary" />
                </div>
                <CardTitle>{isAr ? "الدعم الفني" : "Support"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  {isAr
                    ? "صفحة مستقلة لإرسال الأعطال، طلبات التفعيل، أو أي استفسار تشغيلي مباشر."
                    : "A separate page to submit incidents, activation requests, or direct operational questions."}
                </p>
                <Link href={`${p}/support`} className="inline-flex items-center gap-2 font-medium text-primary hover:underline">
                  {isAr ? "انتقل إلى الدعم" : "Go to support"}
                  <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section id="guides" className="border-t bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <div className="mb-10 max-w-2xl">
            <h2 className="text-2xl font-bold">{isAr ? "أدلة الاستخدام" : "Usage guides"}</h2>
            <p className="mt-2 text-muted-foreground">
              {isAr ? "ابدأ من المسار الأقرب لمهمتك الحالية ثم أكمل الإعداد خطوة بخطوة." : "Start with the path closest to your current task, then continue the setup step by step."}
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {helpTopics.map((topic) => (
              <Card key={topic.titleEn} className="group border-border/80 shadow-sm transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 transition group-hover:bg-primary/20">
                    <topic.icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{isAr ? topic.titleAr : topic.titleEn}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-6 text-muted-foreground">{isAr ? topic.descAr : topic.descEn}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-12 overflow-hidden rounded-3xl border bg-background">
            <div className="border-b px-6 py-5">
              <h3 className="text-lg font-semibold">{isAr ? "مسار الإعداد السريع" : "Quick setup path"}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {isAr ? "الخطوات الأساسية من تفعيل الحساب حتى بدء التشغيل اليومي." : "The core steps from account activation to daily operations."}
              </p>
            </div>
            <ol className="divide-y">
              {setupSteps.map((step, index) => (
                <li key={index} className="flex items-start gap-4 px-6 py-4 text-sm">
                  <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {index + 1}
                  </span>
                  <span className="text-foreground/80">{isAr ? step.ar : step.en}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <MarketingPageCta
        title={isAr ? "هل تحتاج مسارًا مختلفًا؟" : "Need a different path?"}
        description={
          isAr
            ? "استخدم صفحة FAQ للأسئلة المتكررة، أو صفحة الدعم إذا كانت لديك مشكلة فعلية أو طلب تشغيل يحتاج متابعة مباشرة."
            : "Use the FAQ for common questions, or move to Support if you have a real incident or an operational request that needs follow-up."
        }
        primaryAction={{ href: `${p}/support`, label: isAr ? "فتح الدعم الفني" : "Open support" }}
        secondaryAction={{ href: `${p}/faq`, label: isAr ? "فتح FAQ" : "Open FAQ" }}
        tone="muted"
      />
    </main>
  );
}