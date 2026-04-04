/**
 * Request Demo / Subscription Request Page
 * صفحة طلب اشتراك / عرض تجريبي
 */

import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Clock3, ShieldCheck } from "lucide-react";

import { LogoMark } from "@/components/logo-mark";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SubscriptionRequestForm } from "./subscription-request-form";
import { marketingMetadata } from "@/lib/marketing/seo";
import { getAppLocale } from "@/lib/i18n/locale";

export async function generateMetadata(): Promise<Metadata> {
  return marketingMetadata({
    path: "/request-demo",
    titleAr: "طلب عرض تجريبي | طاقم",
    titleEn: "Request a Demo | Taqam",
    descriptionAr: "اطلب عرض تجريبي لمنصة طاقم. املأ النموذج وسيتواصل معك فريقنا خلال 24 ساعة.",
    descriptionEn: "Request a demo of Taqam. Fill the form and our team will contact you within 24 hours.",
  });
}

export default async function RequestDemoPage() {
  const locale = await getAppLocale();
  const isAr = locale === "ar";
  const p = locale === "en" ? "/en" : "";
  const highlights = [
    {
      icon: Clock3,
      title: isAr ? "استجابة خلال 24 ساعة" : "Response within 24 hours",
      description: isAr
        ? "فريقنا يراجع الطلب بسرعة ويقترح لك المسار المناسب مباشرة."
        : "Our team reviews your request quickly and recommends the right rollout path.",
    },
    {
      icon: ShieldCheck,
      title: isAr ? "مهيأ للامتثال السعودي" : "Ready for Saudi compliance",
      description: isAr
        ? "رواتب، حضور، ولوائح تشغيل بصياغة تناسب السوق السعودي."
        : "Payroll, attendance, and HR workflows tailored for the Saudi market.",
    },
    {
      icon: CheckCircle2,
      title: isAr ? "تهيئة حسب شركتك" : "Configured for your company",
      description: isAr
        ? "نضبط الصلاحيات، الهيكل، والخطوات حسب حجم فريقك ونشاطك."
        : "We configure roles, structure, and workflows for your team size and operating model.",
    },
  ];

  return (
    <main className="min-h-[calc(100vh-8rem)] bg-background">
      <section className="container mx-auto px-4 py-14 lg:py-20">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,.95fr)]">
          <div className="mx-auto w-full max-w-2xl lg:mx-0">
            <div className="mb-8">
              <LogoMark className="mb-5" frameClassName="rounded-2xl p-0 shadow-md" imageClassName="h-16" />
              <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-200">
                {isAr ? "عرض سريع • تهيئة مخصصة • دعم مباشر" : "Fast demo • Tailored setup • Direct support"}
              </span>
              <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
                {isAr ? "اطلب عرضًا يوضح كيف ستعمل طاقم داخل شركتك" : "Request a demo tailored to how Taqam fits your company"}
              </h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
                {isAr
                  ? "املأ النموذج وسيتواصل معك فريقنا خلال 24 ساعة مع عرض يناسب حجم الشركة، آلية الرواتب، ومتطلبات الحضور والامتثال."
                  : "Fill in the form and our team will contact you within 24 hours with a demo tailored to your company size, payroll workflow, and compliance needs."}
              </p>
            </div>

            <Card className="overflow-hidden rounded-[1.75rem] border-border/70 shadow-xl shadow-black/5">
              <CardHeader className="border-b bg-muted/30 px-6 py-6 sm:px-8">
                <CardTitle className="text-xl">{isAr ? "بيانات الشركة" : "Company details"}</CardTitle>
                <CardDescription>{isAr ? "جميع الحقول المطلوبة معلمة بـ *" : "Required fields are marked with *"}</CardDescription>
              </CardHeader>
              <CardContent className="px-6 py-6 sm:px-8 sm:py-8">
                <SubscriptionRequestForm locale={locale} />
              </CardContent>
            </Card>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                {isAr ? "عندك حساب بالفعل؟ يمكنك الدخول مباشرة." : "Already have an account? You can sign in directly."}
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild variant="brandOutline">
                  <Link href={`${p}/pricing`}>{isAr ? "عرض الأسعار" : "View pricing"}</Link>
                </Button>
                <Button asChild variant="brandOutline">
                  <Link href={`${p}/login`}>{isAr ? "تسجيل الدخول" : "Login"}</Link>
                </Button>
              </div>
            </div>
          </div>

          <aside className="relative hidden overflow-hidden rounded-[2rem] border border-slate-200/70 bg-gradient-to-br from-sky-50 via-white to-indigo-50/70 p-8 text-slate-950 shadow-xl shadow-sky-100/40 lg:block dark:border-white/10 dark:bg-neutral-950 dark:text-white dark:shadow-none">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-sky-200/70 via-white to-indigo-100/70 dark:from-indigo-900/60 dark:via-neutral-950 dark:to-neutral-950" />
            <div className="marketing-grid-pattern absolute inset-0 opacity-[0.04] dark:opacity-[0.05]" />

            <div className="relative">
              <LogoMark className="mb-6" frameClassName="rounded-xl p-0" imageClassName="h-10" />
              <h2 className="text-3xl font-bold leading-tight">
                {isAr ? "Demo عملي يركز على ما يهم فريقك" : "A practical demo focused on what matters to your team"}
              </h2>
              <p className="mt-4 max-w-md text-sm leading-7 text-slate-600 dark:text-white/70">
                {isAr
                  ? "بدلاً من عرض عام، نجهز الجلسة على أساس عدد الموظفين، التعقيد التشغيلي، والخطوات التي تريد أتمتتها أولاً."
                  : "Instead of a generic tour, we shape the session around employee count, operational complexity, and the workflows you want to automate first."}
              </p>

              <div className="mt-8 space-y-4">
                {highlights.map((item) => (
                  <div key={item.title} className="rounded-2xl border border-slate-200/70 bg-white/75 p-4 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/15 text-sky-700 dark:text-sky-300">
                        <item.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{item.title}</h3>
                        <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-white/65">{item.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {isAr ? "هل تريد مراجعة الباقات أولاً؟" : "Prefer to review plans first?"}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-white/65">
                  {isAr
                    ? "اطلع على الباقات والأسعار الحالية، ثم عد لطلب العرض عندما تكون جاهزًا."
                    : "Review the current plans and pricing, then come back for a tailored demo when you're ready."}
                </p>
                <div className="mt-4">
                  <Button asChild variant="brandOutline" className="w-full border-sky-200 bg-sky-50 text-sky-900 hover:bg-sky-100 dark:border-white/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 dark:hover:text-white">
                    <Link href={`${p}/plans`}>{isAr ? "استعراض الباقات" : "Explore plans"}</Link>
                  </Button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
