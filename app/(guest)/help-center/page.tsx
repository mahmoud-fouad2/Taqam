import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  Clock3,
  HelpCircle,
  LifeBuoy,
  MessageSquare,
  PlugZap,
  Rocket,
  Search,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";

import { FadeIn } from "@/components/ui/fade-in";
import { Button } from "@/components/ui/button";
import { getAppLocale } from "@/lib/i18n/locale";
import { marketingMetadata } from "@/lib/marketing/seo";

export async function generateMetadata(): Promise<Metadata> {
  return marketingMetadata({
    titleAr: "مركز المساعدة | طاقم",
    titleEn: "Help Center | Taqam",
    descriptionAr:
      "بوابة مساعدة مرتبة: أدلة الاستخدام، الأسئلة الشائعة، وصفحة دعم مستقلة للتواصل المباشر.",
    descriptionEn:
      "An organized help portal with usage guides, a dedicated FAQ page, and a separate support page.",
    path: "/help-center",
  });
}

const helpTopics = [
  {
    icon: Rocket,
    color: "from-indigo-500/20 to-indigo-500/5 text-indigo-600 dark:text-indigo-400",
    titleAr: "البدء والإعداد",
    titleEn: "Getting Started",
    descAr: "تهيئة الشركة، إضافة الموظفين، وضبط الأقسام والورديات في مسار واضح.",
    descEn: "Set up the company, add employees, and configure departments and shifts in a clear path.",
  },
  {
    icon: Clock3,
    color: "from-emerald-500/20 to-emerald-500/5 text-emerald-600 dark:text-emerald-400",
    titleAr: "الحضور والإجازات",
    titleEn: "Attendance & Leave",
    descAr: "تشغيل الحضور اليومي، سياسات التأخير، وطلبات الإجازة والموافقات.",
    descEn: "Handle daily attendance, tardiness policies, leave requests, and approvals.",
  },
  {
    icon: Wallet,
    color: "from-purple-500/20 to-purple-500/5 text-purple-600 dark:text-purple-400",
    titleAr: "الرواتب",
    titleEn: "Payroll",
    descAr: "تهيئة الرواتب، تشغيل المسير، وقسائم الرواتب وتصدير WPS.",
    descEn: "Configure payroll, run payroll periods, manage payslips, and export WPS.",
  },
  {
    icon: Users,
    color: "from-blue-500/20 to-blue-500/5 text-blue-600 dark:text-blue-400",
    titleAr: "بيانات الموظفين",
    titleEn: "Employee Records",
    descAr: "الملفات الوظيفية، الاستيراد، والتحديثات اليومية للموظفين.",
    descEn: "Employee records, imports, and day-to-day updates.",
  },
  {
    icon: ShieldCheck,
    color: "from-amber-500/20 to-amber-500/5 text-amber-600 dark:text-amber-400",
    titleAr: "الأدوار والحماية",
    titleEn: "Roles & Security",
    descAr: "الأدوار الحالية داخل النظام وكيفية ضبط الوصول التشغيلي داخل الشركة.",
    descEn: "Current role model and how to manage operational access inside the company.",
  },
  {
    icon: BarChart3,
    color: "from-rose-500/20 to-rose-500/5 text-rose-600 dark:text-rose-400",
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

const quickLinks = [
  {
    icon: BookOpen,
    href: "#guides",
    titleAr: "أدلة الاستخدام",
    titleEn: "Usage guides",
    descAr: "المدخل الصحيح لفهم المنصة والإعداد الأولي اليومي بدون تشتيت.",
    descEn: "The right starting point to understand the platform and get daily operations configured.",
  },
  {
    icon: MessageSquare,
    href: "/faq",
    titleAr: "الأسئلة الشائعة",
    titleEn: "FAQ",
    descAr: "صفحة منفصلة للأسئلة المتكررة والإجابات العملية.",
    descEn: "A dedicated page for common questions and concise answers.",
  },
  {
    icon: LifeBuoy,
    href: "/support",
    titleAr: "الدعم الفني",
    titleEn: "Support",
    descAr: "صفحة مستقلة لإرسال الأعطال أو أي استفسار تشغيلي مباشر.",
    descEn: "A separate page for incidents and direct operational questions.",
  },
];

export default async function PublicHelpCenterPage() {
  const locale = await getAppLocale();
  const isAr = locale === "ar";
  const p = locale === "en" ? "/en" : "";

  return (
    <FadeIn direction="up">
      <main className="bg-background">
      {/* ── HERO ── */}
      <section className="relative overflow-hidden border-b pb-20 pt-20 sm:pt-28">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-x-0 top-0 h-[32rem] bg-[radial-gradient(ellipse_60%_45%_at_50%_0%,rgba(99,102,241,0.14),transparent_65%)] dark:bg-[radial-gradient(ellipse_60%_45%_at_50%_0%,rgba(99,102,241,0.22),transparent_65%)]" />
          <div className="absolute start-0 top-20 h-64 w-64 rounded-full bg-indigo-500/[0.06] blur-[100px]" />
          <div className="absolute end-0 top-32 h-56 w-56 rounded-full bg-sky-500/[0.06] blur-[80px]" />
        </div>

        <div className="container mx-auto px-4">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="text-center lg:text-start">
              <div className="mb-5 flex justify-center lg:justify-start">
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.07] px-4 py-1.5 text-xs font-semibold text-primary">
                  <HelpCircle className="h-3.5 w-3.5" />
                  {isAr ? "بوابة مساعدة منظمة وواضحة" : "An organized and focused help portal"}
                </span>
              </div>

              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
                {isAr ? "مركز المساعدة" : "Help Center"}
              </h1>
              <p className="mx-auto mt-5 max-w-lg text-lg leading-relaxed text-muted-foreground/80 lg:mx-0">
                {isAr
                  ? "ابدأ من الأدلة الأساسية، ثم انتقل إلى صفحة الأسئلة الشائعة أو صفحة الدعم المستقلة حسب نوع احتياجك."
                  : "Start with the core guides, then move to the dedicated FAQ page or the separate support page depending on what you need."}
              </p>

              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
                <Link href={`${p}/faq`}>
                  <Button size="lg" variant="outline" className="h-12 gap-2 rounded-xl px-6">
                    <Search className="h-4 w-4" />
                    {isAr ? "الأسئلة الشائعة" : "FAQ"}
                  </Button>
                </Link>
                <Link href={`${p}/support`}>
                  <Button size="lg" variant="brand" className="h-12 gap-2 rounded-xl px-6">
                    <LifeBuoy className="h-4 w-4" />
                    {isAr ? "الدعم الفني" : "Support"}
                  </Button>
                </Link>
              </div>
            </div>

            {/* Visual */}
            <div className="relative mx-auto hidden w-full max-w-md lg:block">
              {/* Decorative background shapes */}
              <div className="pointer-events-none absolute -inset-6 -z-10 rounded-full bg-gradient-to-tr from-indigo-200 to-sky-200 blur-2xl dark:from-indigo-900/50 dark:to-sky-900/50" />
              <div className="pointer-events-none absolute -bottom-10 -end-10 -z-10 h-40 w-40 rounded-full bg-blue-400/20 blur-3xl" />
              
              <div className="relative overflow-hidden rounded-tl-[4rem] rounded-br-[4rem] rounded-tr-3xl rounded-bl-3xl border-8 border-white/50 bg-white/90 shadow-2xl dark:border-white/10 dark:bg-card/90">
                <div className="relative aspect-[4/5] w-full">
                  <Image
                    src="https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=800&q=80"
                    alt={isAr ? "فريق الدعم والمساعدة" : "Support team"}
                    fill
                    sizes="420px"
                    className="object-cover transition-transform duration-700 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/40 via-transparent to-transparent" />
                </div>
              </div>

              {/* Floating badge */}
              <div className="absolute -start-6 bottom-16 rounded-2xl border border-white/60 bg-white/95 p-3.5 shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-card/95">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-inner">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{isAr ? "مكتبة شاملة" : "Comprehensive Library"}</p>
                    <p className="text-xs font-medium text-muted-foreground">{isAr ? "أدلة في جميع المجالات" : "Guides in all areas"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── QUICK LINKS ── */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="grid gap-6 lg:grid-cols-3">
            {quickLinks.map((link) => {
              const LinkIcon = link.icon;
              const isExternal = !link.href.startsWith("#");
              const resolvedHref = isExternal ? `${p}${link.href}` : link.href; 
              return (
                <Link
                  key={link.titleEn}
                  href={resolvedHref}
                  className="group relative flex flex-col gap-5 overflow-hidden rounded-[2.5rem] border border-transparent bg-white p-8 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.05)] transition-all duration-500 hover:-translate-y-1.5 hover:border-indigo-100 hover:shadow-[0_24px_48px_-12px_rgba(79,70,229,0.15)] dark:bg-slate-900 dark:hover:border-indigo-900/50"
                >
                  <div className="absolute -end-8 -top-8 -z-10 h-32 w-32 rounded-full bg-primary/5 transition-transform duration-500 group-hover:scale-[2.5] group-hover:bg-primary/10" />
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 shadow-sm ring-1 ring-black/5 dark:from-indigo-950/40 dark:to-blue-950/40 dark:ring-white/10">
                    <LinkIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{isAr ? link.titleAr : link.titleEn}</h3>
                    <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{isAr ? link.descAr : link.descEn}</p>
                  </div>
                  <span className="mt-auto flex items-center gap-2 text-sm font-bold text-indigo-600 opacity-80 transition-all duration-300 group-hover:opacity-100 dark:text-indigo-400">    
                    {isAr ? "استكشف" : "Explore"}
                    <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1.5 rtl:rotate-180 rtl:group-hover:translate-x-1.5" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── GUIDES GRID ── */}
      <section id="guides" className="relative border-t py-28">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(248,250,252,0.3),rgba(255,255,255,1)_60%)] dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.2),rgba(2,6,23,0.5)_60%)]" />
        <div className="container mx-auto px-4">
          <div className="mb-16 max-w-2xl">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.07] px-4 py-1.5 text-xs font-semibold text-primary">
              <BookOpen className="h-3.5 w-3.5" />
              {isAr ? "أدلة الاستخدام" : "Usage guides"}
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl"> 
              {isAr ? "دليل شامل لكل جزء" : "Comprehensive guides for every part"}
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              {isAr
                ? "ابدأ من المسار الأقرب لمهمتك الحالية ثم أكمل الإعداد خطوة بخطوة بطريقة صحيحة وموثقة."
                : "Start with the path closest to your current task, then continue the setup step by step accurately."}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {helpTopics.map((topic) => {
              const TopicIcon = topic.icon;
              return (
                <div
                  key={topic.titleEn}
                  className="group relative flex cursor-default flex-col gap-4 overflow-hidden rounded-[2.5rem] border border-border/40 bg-card/60 p-8 shadow-sm backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:border-border/80 hover:bg-card/95 hover:shadow-xl"
                >
                  <div className={`flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-gradient-to-br shadow-inner ${topic.color}`}>
                    <TopicIcon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold tracking-tight">{isAr ? topic.titleAr : topic.titleEn}</h3>
                  <p className="text-[15px] leading-relaxed text-muted-foreground">{isAr ? topic.descAr : topic.descEn}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-16 overflow-hidden rounded-[2.5rem] border border-border/50 bg-card/90 shadow-sm backdrop-blur-sm">
            <div className="border-b px-8 py-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/[0.07]">
                  <PlugZap className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">{isAr ? "مسار الإعداد السريع" : "Quick setup path"}</h3>
                  <p className="text-sm text-muted-foreground">
                    {isAr ? "الخطوات الأساسية من تفعيل الحساب حتى بدء التشغيل اليومي." : "The core steps from account activation to daily operations."}
                  </p>
                </div>
              </div>
            </div>
            <ol className="divide-y divide-border/50">
              {setupSteps.map((step, index) => (
                <li key={index} className="flex items-start gap-5 px-8 py-5 text-sm transition-colors hover:bg-muted/30">
                  <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {index + 1}
                  </span>
                  <span className="leading-7 text-foreground/80">{isAr ? step.ar : step.en}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="border-t py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl rounded-[2.5rem] border border-border/50 bg-card/90 p-10 text-center shadow-sm backdrop-blur-sm sm:p-14">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/[0.07]">
              <HelpCircle className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              {isAr ? "هل تحتاج مسارًا مختلفًا؟" : "Need a different path?"}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              {isAr
                ? "استخدم صفحة FAQ للأسئلة المتكررة، أو صفحة الدعم إذا كانت لديك مشكلة فعلية أو طلب تشغيل يحتاج متابعة مباشرة."
                : "Use the FAQ for common questions, or move to Support if you have a real incident or an operational request that needs follow-up."}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href={`${p}/support`}>
                <Button size="lg" variant="brand" className="h-12 rounded-xl px-6">
                  {isAr ? "فتح الدعم الفني" : "Open support"}
                </Button>
              </Link>
              <Link href={`${p}/faq`}>
                <Button size="lg" variant="outline" className="h-12 rounded-xl px-6">
                  {isAr ? "فتح FAQ" : "Open FAQ"}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
    </FadeIn>
  );
}
