/**
 * Taqam Landing Page
 * الصفحة الرئيسية للمنصة
 */

import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

import { 
  Users, 
  Clock, 
  CreditCard, 
  Shield, 
  Globe,
  ArrowLeft,
  BarChart3,
  Building2,
  CheckCircle2,
  Layers,
  Star,
  Zap,
  Lock,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { marketingMetadata } from "@/lib/marketing/seo";
import { getAppLocale } from "@/lib/i18n/locale";
import { redirect } from "next/navigation";
import { FeaturesMarquee } from "@/components/marketing/features-marquee";
import { HeroVideo } from "@/components/marketing/hero-video";

export async function generateMetadata(): Promise<Metadata> {
  return marketingMetadata({
    path: "/",
    titleAr: "طاقم | منصة الموارد البشرية والرواتب والحضور",
    titleEn: "Taqam | HR, Payroll & Attendance Platform",
    descriptionAr:
      "طاقم منصة سحابية متكاملة لإدارة الموارد البشرية والرواتب والحضور، مصممة للسوق السعودي مع تجربة عربية/إنجليزية وامتثال للأنظمة المحلية.",
    descriptionEn:
      "Taqam is a cloud HR platform for employees, attendance and payroll with Arabic/English UX and multi-tenant support.",
  });
}

const features = [
  {
    icon: Users,
    color: "text-blue-600 bg-blue-500/10",
    title: "إدارة الموظفين",
    titleEn: "Employee Management",
    description: "ملفات موظفين شاملة، هياكل تنظيمية، وإدارة مستندات كاملة.",
    descriptionEn: "Full employee profiles, org charts, and document management.",
  },
  {
    icon: Clock,
    color: "text-green-600 bg-green-500/10",
    title: "الحضور والانصراف",
    titleEn: "Time & Attendance",
    description: "تتبع دقيق لأوقات الدوام والشفتات والغياب والتأخير.",
    descriptionEn: "Accurate tracking of work hours, shifts, absences, and late arrivals.",
  },
  {
    icon: CreditCard,
    color: "text-purple-600 bg-purple-500/10",
    title: "إدارة الرواتب",
    titleEn: "Payroll Management",
    description: "احتساب تلقائي للرواتب والبدلات والاستقطاعات مع تصدير WPS.",
    descriptionEn: "Auto-calculate salaries, allowances, deductions with WPS export.",
  },
  {
    icon: Shield,
    color: "text-orange-600 bg-orange-500/10",
    title: "الامتثال السعودي",
    titleEn: "Saudi Compliance",
    description: "تكامل مع GOSI وWPS ومقيم ومدد، متوافق مع نظام العمل السعودي.",
    descriptionEn: "GOSI, WPS, Muqeem & Mudad integration. Saudi labor law compliant.",
  },
  {
    icon: Globe,
    color: "text-teal-600 bg-teal-500/10",
    title: "عربي / إنجليزي",
    titleEn: "Arabic & English",
    description: "واجهة كاملة بالعربية والإنجليزية مع دعم RTL من البداية.",
    descriptionEn: "Full Arabic/English UI with first-class RTL support built-in.",
  },
  {
    icon: Building2,
    color: "text-indigo-600 bg-indigo-500/10",
    title: "متعدد الشركات",
    titleEn: "Multi-Tenant",
    description: "كل شركة في بيئة معزولة وآمنة تمامًا مع صلاحيات مرنة.",
    descriptionEn: "Each company in a fully isolated, secure environment with flexible roles.",
  },
  {
    icon: BarChart3,
    color: "text-rose-600 bg-rose-500/10",
    title: "التقارير والتحليلات",
    titleEn: "Reports & Analytics",
    description: "لوحات بيانات لحظية، تقارير مخصصة، تصدير Excel وPDF.",
    descriptionEn: "Real-time dashboards, custom reports, Excel & PDF export.",
  },
  {
    icon: Layers,
    color: "text-amber-600 bg-amber-500/10",
    title: "إدارة الإجازات",
    titleEn: "Leave Management",
    description: "طلبات إجازة، موافقة مدير، أرصدة تلقائية، وتقويم مريح.",
    descriptionEn: "Leave requests, manager approval, auto balances, and calendar view.",
  },
];

const plans = [
  {
    name: "Starter",
    nameAr: "الأساسية",
    price: "499",
    sizeAr: "من 5 إلى 10 موظفين",
    sizeEn: "5–10 employees",
    features: [
      { ar: "ملفات الموظفين والهيكل التنظيمي", en: "Employee profiles & org chart" },
      { ar: "الحضور والانصراف والورديات", en: "Time & attendance with shifts" },
      { ar: "إدارة الإجازات والأرصدة", en: "Leave management & balances" },
      { ar: "تسجيل الحضور من التطبيق", en: "Mobile app check-in" },
      { ar: "التقارير الأساسية (PDF / Excel)", en: "Basic reports (PDF / Excel)" },
    ],
  },
  {
    name: "Business",
    nameAr: "الأعمال",
    price: "999",
    sizeAr: "من 10 إلى 25 موظفًا",
    sizeEn: "10–25 employees",
    features: [
      { ar: "كل مميزات الأساسية", en: "All Starter features" },
      { ar: "مسير الرواتب + تصدير WPS", en: "Payroll processing + WPS export" },
      { ar: "تكامل GOSI والاستحقاقات", en: "GOSI integration & allowances" },
      { ar: "تقييم الأداء والتوظيف", en: "Performance reviews & recruitment" },
      { ar: "أدوار متقدمة + سجلات تدقيق", en: "Advanced roles + audit logs" },
    ],
    popular: true,
  },
  {
    name: "Enterprise",
    nameAr: "المؤسسات",
    price: "تواصل معنا",
    priceEn: "Contact us",
    sizeAr: "من 25 إلى 100+ موظف",
    sizeEn: "25–100+ employees",
    features: [
      { ar: "كل مميزات الأعمال", en: "All Business features" },
      { ar: "تكاملات مخصصة (مدد / ERP)", en: "Custom integrations (Mudad / ERP)" },
      { ar: "مدير حساب مخصص + SLA", en: "Dedicated account manager + SLA" },
      { ar: "وصول API + تقارير مخصصة", en: "API access + custom reporting" },
    ],
  },
];

const trustItems = [
  { icon: Zap, labelAr: "إعداد سريع خلال 24 ساعة", labelEn: "Setup in under 24 hours" },
  { icon: Lock, labelAr: "بيانات محمية ومشفرة", labelEn: "Encrypted & secure data" },
  { icon: Star, labelAr: "دعم فني على مدار الساعة", labelEn: "24/7 technical support" },
];

const heroMediaItems = [
  { src: "/images/marketing/screenshot-dashboard.svg?v=2", labelAr: "لوحة التحكم", labelEn: "Dashboard" },
  { src: "/images/marketing/screenshot-employees.svg?v=2", labelAr: "الموظفون", labelEn: "Employees" },
  { src: "/images/marketing/screenshot-payroll-new.svg?v=2", labelAr: "الرواتب", labelEn: "Payroll" },
];

export default async function LandingPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locale = await getAppLocale();
  const isAr = locale === "ar";
  const p = locale === "en" ? "/en" : "";

  const sp = searchParams ? await searchParams : undefined;
  const tenantRequired = sp?.tenantRequired === "1";
  const nextPathRaw = sp?.next;
  const nextPath = typeof nextPathRaw === "string" ? nextPathRaw : undefined;

  if (tenantRequired) {
    const params = new URLSearchParams();
    if (nextPath) params.set("next", nextPath);
    redirect(`/select-tenant${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <main className="min-h-[calc(100vh-8rem)] bg-background">
      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="container mx-auto px-4 pb-8 pt-16 sm:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Left: copy */}
          <div className="text-center lg:text-start">
            {/* Badge */}
            <div className="mb-5 flex justify-center lg:justify-start">
              <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-xs font-semibold text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300">
                <span className="size-1.5 animate-pulse rounded-full bg-indigo-500" />
                {isAr ? "منصة سعودية • متوافقة مع GOSI وWPS ومدد • ثنائية اللغة" : "Saudi-built • GOSI, WPS & Mudad compliant • Bilingual"}
              </span>
            </div>

            <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              {isAr ? (
                <>
                  منصة إدارة{" "}
                  <span className="bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                    الموارد البشرية
                  </span>
                  <br />
                  الأكثر تكاملاً
                </>
              ) : (
                <>
                  HR, Payroll &{" "}
                  <span className="bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Attendance
                  </span>
                  <br />
                  Built for Saudi Arabia
                </>
              )}
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground lg:mx-0">
              {isAr
                ? "طاقم منصة سحابية متكاملة لإدارة الموارد البشرية والرواتب والحضور، مصممة للسوق السعودي مع تجربة عربية كاملة وامتثال للأنظمة المحلية."
                : "Taqam is a modern cloud platform to manage employees, attendance, and payroll—optimized for Saudi compliance with full Arabic/English RTL UX."}
            </p>

            {/* Trust items */}
            <div className="mt-6 flex flex-wrap justify-center gap-4 lg:justify-start">
              {trustItems.map((t) => (
                <div key={t.labelEn} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <t.icon className="h-4 w-4 text-indigo-500" />
                  <span>{isAr ? t.labelAr : t.labelEn}</span>
                </div>
              ))}
            </div>

            {/* CTA buttons */}
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
              <Link href={`${p}/request-demo`}>
                <Button variant="brand" size="lg" className="h-12 gap-2 px-6 text-base font-semibold">
                  {isAr ? "طلب عرض تجريبي مجاني" : "Request a free demo"}
                  <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
                </Button>
              </Link>
              <Link href={`${p}/screenshots`}>
                <Button size="lg" variant="brandOutline" className="h-12 gap-2 px-6 text-base">
                  <ChevronRight className="h-4 w-4" />
                  {isAr ? "استعراض المنصة" : "Product tour"}
                </Button>
              </Link>
            </div>

            {/* Social proof stats */}
            <div className="mt-8 flex flex-wrap justify-center gap-2 border-t pt-6 lg:justify-start">
              {[
                { valueAr: "+٤٠", valueEn: "40+", labelAr: "شركة سعودية", labelEn: "Saudi companies", dot: "bg-indigo-500" },
                { valueAr: "+١٢٠٠", valueEn: "1,200+", labelAr: "موظف مُدار", labelEn: "employees managed", dot: "bg-blue-500" },
                { valueAr: "< يوم", valueEn: "< 1 day", labelAr: "للإعداد الكامل", labelEn: "full setup", dot: "bg-emerald-500" },
              ].map((s) => (
                <div
                  key={s.labelEn}
                  className="flex items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-3.5 py-2 text-sm"
                >
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${s.dot}`} />
                  <span className="font-semibold text-foreground">{isAr ? s.valueAr : s.valueEn}</span>
                  <span className="text-muted-foreground">{isAr ? s.labelAr : s.labelEn}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: screenshots panel */}
          <div className="relative mx-auto w-full max-w-xl">
            <div className="pointer-events-none absolute -inset-8 -z-10 rounded-[2.5rem] bg-gradient-to-br from-indigo-500/15 via-blue-500/10 to-purple-500/10 blur-3xl" />

            {/* Main browser-frame screenshot */}
            <div className="overflow-hidden rounded-2xl border bg-card shadow-2xl shadow-black/12 ring-1 ring-black/5">
              <div className="flex items-center gap-2 border-b bg-muted/50 px-4 py-2.5">
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-green-400/80" />
                </div>
                <div className="mx-auto flex items-center gap-1.5 rounded-md bg-background/80 px-3 py-1 text-xs text-muted-foreground ring-1 ring-border/50">
                  <span className="size-1.5 rounded-full bg-green-500" />
                  app.taqam.net
                </div>
              </div>
              <HeroVideo
                src="/videos/hero-square.mp4"
                poster="/images/marketing/screenshot-dashboard.svg"
              />
            </div>

            {/* Mini screenshots row */}
            <div className="mt-3 grid grid-cols-3 gap-3">
              {heroMediaItems.map((item) => (
                <Link
                  key={item.src}
                  href={`${p}/screenshots`}
                  className="group relative aspect-[4/3] overflow-hidden rounded-xl border bg-muted shadow-sm ring-1 ring-black/5 transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <Image
                    src={item.src}
                    alt={isAr ? item.labelAr : item.labelEn}
                    unoptimized={item.src.includes(".svg")}
                    fill
                    sizes="180px"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />
                  <span className="absolute bottom-2 start-2 rounded-full border border-white/15 bg-black/35 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur-sm transition-colors group-hover:bg-black/50">
                    {isAr ? item.labelAr : item.labelEn}
                  </span>
                </Link>
              ))}
            </div>

            {/* "View all" link */}
            <div className="mt-3 text-center">
              <Link href={`${p}/screenshots`} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                {isAr ? "عرض كل اللقطات" : "View all screenshots"}
                <ChevronRight className="h-3 w-3 rtl:rotate-180" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────── */}
      <section id="features" className="border-t bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <span className="mb-3 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {isAr ? "المميزات" : "Features"}
            </span>
            <h2 className="text-3xl font-bold sm:text-4xl">
              {isAr ? "كل ما تحتاجه لإدارة فريقك" : "Everything to run your team"}
            </h2>
            <p className="mt-3 text-muted-foreground">
              {isAr ? "وحدة واحدة متكاملة بدلاً من أدوات متعددة" : "One integrated platform instead of multiple disconnected tools"}
            </p>
          </div>

          <FeaturesMarquee features={features} isAr={isAr} />

          <div className="mt-10 text-center">
            <Link href={`${p}/features`}>
              <Button variant="outline" className="gap-2">
                {isAr ? "اكتشف كل المميزات" : "Explore all features"}
                <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────── */}
      <section id="pricing" className="py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <span className="mb-3 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {isAr ? "الأسعار" : "Pricing"}
            </span>
            <h2 className="text-3xl font-bold sm:text-4xl">
              {isAr ? "باقات تناسب كل حجم" : "Plans for every team size"}
            </h2>
            <p className="mt-3 text-muted-foreground">
              {isAr ? "ابدأ مجانًا، ادفع عند النمو" : "Start free, pay as you grow"}
            </p>
          </div>
          <div className="relative grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-shadow hover:shadow-xl ${
                  plan.popular ? "border-primary ring-2 ring-primary/20 shadow-lg" : ""
                }`}
              >
                {plan.popular && (
                  <div className="bg-primary px-4 py-1.5 text-center text-xs font-bold uppercase tracking-wide text-primary-foreground">
                    ⭐ {isAr ? "الأكثر طلبًا" : "Most popular"}
                  </div>
                )}
                <div className="flex flex-1 flex-col p-6">
                  <div className="mb-5">
                    <h3 className="text-xl font-bold">{isAr ? plan.nameAr : plan.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{isAr ? plan.nameAr : plan.name}</p>
                    <div className="mt-4 flex items-end gap-1">
                      {plan.price !== "تواصل معنا" ? (
                        <>
                          <span className="text-4xl font-extrabold">{plan.price}</span>
                          <span className="mb-1 text-muted-foreground">{isAr ? " ريال/شهر" : " SAR/mo"}</span>
                        </>
                      ) : (
                        <span className="text-2xl font-bold">{isAr ? plan.price : plan.priceEn}</span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {isAr ? plan.sizeAr : plan.sizeEn}
                    </p>
                  </div>

                  <ul className="mb-6 flex-1 space-y-2.5">
                    {plan.features.map((f) => (
                      <li key={f.en} className="flex items-start gap-2.5">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span className="text-sm">{isAr ? f.ar : f.en}</span>
                      </li>
                    ))}
                  </ul>

                  <Link href={`${p}/request-demo`}>
                    <Button
                      className="w-full"
                      variant={plan.popular ? "brand" : "brandOutline"}
                      size="lg"
                    >
                      {isAr ? "ابدأ الآن" : "Get started"}
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href={`${p}/pricing`}>
              <Button variant="ghost" className="gap-1 text-muted-foreground hover:text-foreground">
                {isAr ? "عرض صفحة الأسعار التفصيلية" : "View detailed pricing"}
                <ChevronRight className="h-4 w-4 rtl:rotate-180" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-t py-20">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-sky-50 via-white to-indigo-100/80 dark:from-indigo-600 dark:via-blue-600 dark:to-purple-700" />
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_-20%,rgba(59,130,246,0.14),transparent_60%)] dark:bg-[radial-gradient(ellipse_at_50%_-20%,rgba(255,255,255,0.15),transparent_60%)]" />
        <div className="container mx-auto px-4 text-center">
          <div className="mx-auto max-w-2xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-sky-700/80 dark:text-white/70">
              {isAr ? "ابدأ اليوم" : "Get started today"}
            </p>
            <h2 className="text-3xl font-extrabold text-slate-950 dark:text-white sm:text-4xl">
              {isAr ? "جاهز لتحويل إدارة فريقك؟" : "Ready to transform your HR?"}
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base text-slate-600 dark:text-white/80">
              {isAr
                ? "احصل على عرض تجريبي مجاني وشاهد كيف يمكن لطاقم توفير وقتك وتقليل الأخطاء وزيادة كفاءة فريق الموارد البشرية."
                : "Get a free demo and see how Taqam saves time, reduces errors, and boosts your HR team's efficiency."}
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href={`${p}/request-demo`}>
                <Button size="lg" variant="brand" className="h-12 gap-2 px-8 text-base font-semibold shadow-lg">
                  {isAr ? "طلب عرض تجريبي مجاني" : "Request a free demo"}
                  <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
                </Button>
              </Link>
              <Link href={`${p}/pricing`}>
                <Button size="lg" variant="brandOutline" className="h-12 gap-2 px-8 text-base backdrop-blur">
                  {isAr ? "عرض الأسعار" : "View pricing"}
                </Button>
              </Link>
            </div>
            <p className="mt-5 text-xs text-slate-500 dark:text-white/60">
              {isAr ? "لا حاجة لبطاقة ائتمانية • إعداد في 24 ساعة • دعم فني مجاني" : "No credit card required • Setup in 24h • Free technical support"}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
