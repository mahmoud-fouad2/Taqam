import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { marketingMetadata } from "@/lib/marketing/seo";
import { getAppLocale } from "@/lib/i18n/locale";

export async function generateMetadata(): Promise<Metadata> {
  return marketingMetadata({
    titleAr: "مركز المساعدة | طاقم",
    titleEn: "Help Center | Taqam",
    descriptionAr: "مقالات وإجابات سريعة ودليل استخدام منصة طاقم.",
    descriptionEn: "Quick answers, guides, and articles for Taqam.",
    path: "/help-center",
  });
}

export default async function PublicHelpCenterPage() {
  const locale = await getAppLocale();
  const isAr = locale === "ar";
  const p = locale === "en" ? "/en" : "";

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{isAr ? "مركز المساعدة" : "Help Center"}</h1>
          <p className="mt-2 text-muted-foreground">
            {isAr
              ? "إرشادات ومقالات سريعة لتبدأ بطاقم بشكل احترافي."
              : "Guides and quick articles to get started with Taqam."}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild variant="secondary">
            <Link href={`${p}/support`}>{isAr ? "الدعم الفني" : "Support"}</Link>
          </Button>
          <Button asChild variant="brand">
            <Link href={`${p}/request-demo`}>{isAr ? "اطلب عرضًا" : "Request a demo"}</Link>
          </Button>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{isAr ? "البدء" : "Getting started"}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {isAr
              ? "إعداد الشركة، إضافة الموظفين، وضبط السياسات الأساسية."
              : "Set up your company, add employees, and configure policies."}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{isAr ? "الحضور والانصراف" : "Attendance"}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {isAr
              ? "إعداد الورديات، تسجيل الحضور، والسياسات والتنبيهات."
              : "Shifts, check-in/out, policies, and alerts."}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{isAr ? "الرواتب" : "Payroll"}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {isAr
              ? "إعداد الهياكل، تشغيل المسير، قسائم الرواتب، والملفات."
              : "Structures, payroll runs, payslips, and exports."}
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{isAr ? "الأمان" : "Security"}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {isAr
              ? "عزل الشركات، أدوار وصلاحيات، وتدقيق عمليات حساسة حسب الإعداد."
              : "Tenant isolation, roles/permissions, and auditable sensitive actions."}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{isAr ? "الاستيراد والتصدير" : "Import & export"}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {isAr
              ? "استيراد بيانات أساسية وتصدير تقارير وملفات الرواتب حسب الباقة."
              : "Import core data and export reports/payroll files depending on plan."}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{isAr ? "التكاملات" : "Integrations"}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {isAr
              ? "تكاملات وتخصيصات لباقة المؤسسات (API/SSO/ملفات مخصصة)."
              : "Enterprise integrations and customizations (API/SSO/custom exports)."}
          </CardContent>
        </Card>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-6">
          <h2 className="text-lg font-semibold">{isAr ? "ابدأ خلال 10 دقائق" : "Get started in 10 minutes"}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {isAr
              ? "خطوات سريعة تساعدك تجهز بيئة شركتك وتبدأ التشغيل."
              : "A quick checklist to set up your workspace and go live."}
          </p>
          <ol className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>{isAr ? "1) أنشئ/حدّد الشركة (Tenant)" : "1) Create/select your tenant"}</li>
            <li>{isAr ? "2) أضف المستخدمين وحدد الأدوار" : "2) Invite users and set roles"}</li>
            <li>{isAr ? "3) أضف الموظفين والأقسام" : "3) Add employees and departments"}</li>
            <li>{isAr ? "4) اضبط الورديات وسياسة الحضور" : "4) Configure shifts and attendance policy"}</li>
            <li>{isAr ? "5) جهّز هياكل الرواتب (إن لزم)" : "5) Configure payroll structures (optional)"}</li>
          </ol>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button asChild variant="secondary">
              <Link href={`${p}/screenshots`}>{isAr ? "استعراض النظام" : "Product tour"}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`${p}/faq`}>{isAr ? "الأسئلة الشائعة" : "FAQ"}</Link>
            </Button>
            <Button asChild variant="brand">
              <Link href={`${p}/request-demo`}>{isAr ? "اطلب عرضًا" : "Request a demo"}</Link>
            </Button>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6">
          <h2 className="text-lg font-semibold">{isAr ? "مقالات شائعة" : "Popular articles"}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {isAr
              ? "مواضيع متكررة تساعدك تحل المشاكل بسرعة."
              : "Common topics that help you resolve issues quickly."}
          </p>
          <div className="mt-4 grid gap-3">
            <Link href={`${p}/support`} className="rounded-lg border bg-background p-4 hover:bg-muted/40">
              <div className="font-medium">{isAr ? "كتابة تذكرة دعم احترافية" : "How to write a great support ticket"}</div>
              <div className="mt-1 text-sm text-muted-foreground">
                {isAr
                  ? "المعلومات التي نحتاجها لتسريع الحل (slug، خطوات، لقطة شاشة)."
                  : "What we need to debug faster (slug, steps, screenshots)."}
              </div>
            </Link>
            <Link href={`${p}/faq`} className="rounded-lg border bg-background p-4 hover:bg-muted/40">
              <div className="font-medium">{isAr ? "الأمان وتعدد الشركات" : "Security & multi-tenancy"}</div>
              <div className="mt-1 text-sm text-muted-foreground">
                {isAr
                  ? "كيف يتم عزل البيانات وصلاحيات المستخدمين."
                  : "How data isolation and user roles work."}
              </div>
            </Link>
            <Link href={`${p}/pricing`} className="rounded-lg border bg-background p-4 hover:bg-muted/40">
              <div className="font-medium">{isAr ? "اختيار الباقة المناسبة" : "Choosing the right plan"}</div>
              <div className="mt-1 text-sm text-muted-foreground">
                {isAr
                  ? "إرشادات عملية حسب حجم شركتك والميزات المطلوبة."
                  : "A practical guide based on size and required modules."}
              </div>
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-10 rounded-xl border bg-card p-6">
        <h2 className="text-lg font-semibold">{isAr ? "هل تحتاج مساعدة داخل النظام؟" : "Need help inside the app?"}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {isAr
            ? "إذا كان لديك حساب، يمكنك فتح تذكرة دعم من داخل لوحة التحكم."
            : "If you have an account, you can open a support ticket from the dashboard."}
        </p>
        <div className="mt-4">
          <Button asChild>
            <Link href={`${p}/dashboard/help-center`}>
              {isAr ? "الذهاب إلى مركز المساعدة في الداشبورد" : "Go to dashboard Help Center"}
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
