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
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/ui/fade-in";

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

const personas = [
  {
    roleAr: "مدير الموارد البشرية",
    roleEn: "HR Manager",
    icon: Users,
    badge: "bg-indigo-600/90",
    titleAr: "تحكم كامل في الهيكل التنظيمي والرواتب",
    titleEn: "Full control of org structure & payroll",
    descAr: "أدر ملفات الموظفين ومسير الرواتب والإجازات من لوحة تحكم واحدة متكاملة.",
    descEn: "Manage employee files, payroll, and leaves from one integrated dashboard.",
    surface: "from-indigo-500/14 via-white to-sky-500/10 dark:from-indigo-500/18 dark:via-slate-900 dark:to-sky-500/10",
    visualCaptionAr: "ملفات الموظفين والموافقات والرواتب في مشهد واحد واضح لفريق الموارد البشرية.",
    visualCaptionEn: "Employee records, approvals, and payroll sit together in one clear HR workspace.",
    visuals: {
      primary: {
        src: "/images/marketing/screenshot-employees.svg?v=2",
        labelAr: "ملفات الموظفين",
        labelEn: "Employee records",
      },
      secondary: {
        src: "/images/marketing/screenshot-payroll-new.svg?v=2",
        labelAr: "الرواتب",
        labelEn: "Payroll",
      },
      tertiary: {
        src: "/images/marketing/mobile-employees.svg?v=2",
        labelAr: "تطبيق الموظف",
        labelEn: "Employee app",
      },
    },
    features: [
      { ar: "مسير رواتب تلقائي متوافق مع GOSI", en: "Automated payroll with GOSI compliance" },
      { ar: "موافقة فورية على الإجازات والطلبات", en: "Instant leave and request approvals" },
      { ar: "تقارير HR قابلة للتصدير", en: "Exportable HR reports" },
    ],
  },
  {
    roleAr: "المدير التنفيذي",
    roleEn: "CEO / Finance",
    icon: BarChart3,
    badge: "bg-blue-600/90",
    titleAr: "رؤية تنفيذية شاملة لكل المؤشرات",
    titleEn: "Complete executive visibility of all KPIs",
    descAr: "تابع أداء الفريق ومؤشرات الامتثال والتكاليف من لوحة بيانات تنفيذية لحظية.",
    descEn: "Monitor team performance, compliance and costs from a real-time executive dashboard.",
    surface: "from-blue-500/14 via-white to-indigo-500/10 dark:from-blue-500/18 dark:via-slate-900 dark:to-indigo-500/12",
    visualCaptionAr: "لوحات تنفيذية وتقارير وتحليلات لحظية تساعد الإدارة على اتخاذ القرار بسرعة.",
    visualCaptionEn: "Executive dashboards, reports, and live analytics help leadership make faster decisions.",
    visuals: {
      primary: {
        src: "/images/marketing/screenshot-dashboard.svg?v=2",
        labelAr: "لوحة التحكم",
        labelEn: "Dashboard",
      },
      secondary: {
        src: "/images/marketing/screenshot-analytics.svg?v=2",
        labelAr: "التحليلات",
        labelEn: "Analytics",
      },
      tertiary: {
        src: "/images/marketing/screenshot-reports.svg?v=2",
        labelAr: "التقارير",
        labelEn: "Reports",
      },
    },
    features: [
      { ar: "لوحات بيانات تنفيذية لحظية", en: "Real-time executive dashboards" },
      { ar: "تقارير التكاليف والامتثال للوائح", en: "Cost & regulatory compliance reports" },
      { ar: "تنبيهات ذكية للمواعيد والمستحقات", en: "Smart deadline & entitlement alerts" },
    ],
  },
  {
    roleAr: "الموظف",
    roleEn: "Employee",
    icon: Clock,
    badge: "bg-emerald-600/90",
    titleAr: "كل ما تحتاجه من جوالك مباشرةً",
    titleEn: "Everything you need from your phone",
    descAr: "سجّل حضورك واطلب إجازتك وراجع قسيمة راتبك — كل ذلك من تطبيق طاقم.",
    descEn: "Clock in, request leave, and view your payslip — all from the Taqam mobile app.",
    surface: "from-emerald-500/14 via-white to-teal-500/12 dark:from-emerald-500/18 dark:via-slate-900 dark:to-teal-500/12",
    visualCaptionAr: "مسار يومي واضح للموظف: حضور، طلبات، ورواتب من شاشة جوال واحدة.",
    visualCaptionEn: "A clear daily employee flow: attendance, requests, and payroll from one mobile screen.",
    visuals: {
      primary: {
        src: "/images/marketing/mobile-dashboard.svg?v=2",
        labelAr: "الصفحة الرئيسية",
        labelEn: "Mobile home",
      },
      secondary: {
        src: "/images/marketing/mobile-payroll.svg?v=2",
        labelAr: "الرواتب",
        labelEn: "Payslip",
      },
      tertiary: {
        src: "/images/marketing/mobile-employees.svg?v=2",
        labelAr: "طلبات الموظف",
        labelEn: "Employee requests",
      },
    },
    features: [
      { ar: "تسجيل الحضور والانصراف بسهولة", en: "Easy attendance check-in/out" },
      { ar: "طلبات الإجازة ومتابعة الرصيد", en: "Leave requests with balance tracking" },
      { ar: "قسيمة الراتب والمستحقات", en: "Payslip and entitlements view" },
    ],
  },
];

type Persona = (typeof personas)[number];

function PersonaVisualPanel({ persona, isAr }: { persona: Persona; isAr: boolean }) {
  const visualCards = [
    {
      ...persona.visuals.primary,
      shellClassName: "absolute start-2 top-3 h-[15rem] w-[66%] overflow-hidden rounded-[2.5rem] border border-white/70 bg-white/90 shadow-[0_24px_48px_-28px_rgba(15,23,42,0.4)] ring-1 ring-black/5 dark:border-white/10 dark:bg-slate-950/90",
      imageClassName: "object-cover",
    },
    {
      ...persona.visuals.secondary,
      shellClassName: "absolute end-0 top-16 h-[10rem] w-[38%] overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 shadow-[0_20px_40px_-24px_rgba(15,23,42,0.35)] ring-1 ring-black/5 rotate-2 dark:border-white/10 dark:bg-slate-950/90",
      imageClassName: "object-cover",
    },
    {
      ...persona.visuals.tertiary,
      shellClassName: "absolute bottom-2 start-10 h-[10rem] w-[44%] overflow-hidden rounded-[999px] border border-white/70 bg-white/95 shadow-[0_18px_38px_-24px_rgba(15,23,42,0.35)] ring-1 ring-black/5 -rotate-3 dark:border-white/10 dark:bg-slate-950/95",
      imageClassName: "object-contain p-3",
    },
  ];

  return (
    <div className="relative min-h-[24rem] overflow-hidden p-6 sm:p-8 lg:min-h-[28rem]">
      <div className={`absolute inset-0 bg-gradient-to-br ${persona.surface}`} />
      <div className="absolute start-10 top-6 h-24 w-24 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute end-10 bottom-10 h-24 w-24 rounded-full bg-sky-500/10 blur-3xl" />

      <div className="relative h-full min-h-[21rem]">
        {visualCards.map((visual) => (
          <div key={visual.labelEn} className={visual.shellClassName}>
            <div className="relative h-full w-full bg-muted/30">
              <Image
                src={visual.src}
                alt={isAr ? visual.labelAr : visual.labelEn}
                fill
                sizes="(max-width: 1024px) 100vw, 34vw"
                unoptimized={visual.src.includes(".svg")}
                className={visual.imageClassName}
              />
              <div className="absolute inset-x-3 bottom-3">
                <span className="inline-flex rounded-full border border-white/15 bg-slate-950/65 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
                  {isAr ? visual.labelAr : visual.labelEn}
                </span>
              </div>
            </div>
          </div>
        ))}

        <div className="absolute bottom-0 end-0 max-w-[13rem] rounded-[1.8rem] border border-white/70 bg-white/92 p-4 shadow-[0_20px_44px_-28px_rgba(15,23,42,0.42)] backdrop-blur dark:border-white/10 dark:bg-slate-950/92">
          <p className="text-xs font-semibold text-primary">{isAr ? persona.roleAr : persona.roleEn}</p>
          <p className="mt-1.5 text-sm leading-6 text-foreground">
            {isAr ? persona.visualCaptionAr : persona.visualCaptionEn}
          </p>
        </div>
      </div>
    </div>
  );
}

const testimonials = [
  {
    quoteAr: "طاقم غيّر طريقة إدارة رواتبنا تماماً. مسير الرواتب الذي كان يستغرق ٣ أيام بات يتم في أقل من ساعة.",
    quoteEn: "Taqam completely changed how we manage payroll. What used to take 3 days now takes less than an hour.",
    nameAr: "سارة الشهراني",
    nameEn: "Sarah Al-Shahrani",
    roleAr: "مدير الموارد البشرية — شركة الباحة للمقاولات",
    roleEn: "HR Manager — Al-Baha Contracting Co.",
    avatar: "https://images.pexels.com/photos/8154420/pexels-photo-8154420.jpeg?auto=compress&cs=tinysrgb&w=80&h=80&fit=crop",
  },
  {
    quoteAr: "التكامل مع GOSI ومدد وفّر علينا ساعات من العمل اليدوي شهرياً. الدعم الفني متاح دائماً وباحترافية عالية.",
    quoteEn: "Integration with GOSI and Mudad saved us hours of manual work monthly. Support is always professional.",
    nameAr: "نورة الغامدي",
    nameEn: "Noura Al-Ghamdi",
    roleAr: "مديرة شؤون الموظفين — مجموعة سدير التجارية",
    roleEn: "People Director — Sudair Trading Group",
    avatar: "https://images.pexels.com/photos/9218636/pexels-photo-9218636.jpeg?auto=compress&cs=tinysrgb&w=80&h=80&fit=crop",
  },
  {
    quoteAr: "أقدر أتابع حضور وإجازات فريقي كامل من جوالي في أي وقت. طاقم جعل حياتي كمدير أسهل بكثير.",
    quoteEn: "I can track my whole team's attendance and leaves from my phone at any time. Taqam made my life much easier.",
    nameAr: "خالد العتيبي",
    nameEn: "Khalid Al-Otaibi",
    roleAr: "المدير التنفيذي — مركز الخبر للتقنية",
    roleEn: "CEO — Al-Khobar Tech Center",
    avatar: "https://images.pexels.com/photos/6700380/pexels-photo-6700380.jpeg?auto=compress&cs=tinysrgb&w=80&h=80&fit=crop",
  },
];

const integrations = [
  { id: "gosi",    name: "GOSI",    descAr: "التأمينات الاجتماعية", descEn: "Social Insurance",    fill: "#1B7B4B", fontSize: 12 },
  { id: "wps",     name: "WPS",     descAr: "نظام حماية الأجور",    descEn: "Wage Protection",     fill: "#005BAA", fontSize: 13 },
  { id: "mudad",   name: "مدد",     descAr: "إدارة العمالة الوافدة",descEn: "Expat Labour Mgmt",   fill: "#D4480A", fontSize: 15 },
  { id: "muqeem",  name: "مقيم",    descAr: "خدمات الإقامة",        descEn: "Residency Services",  fill: "#1A3670", fontSize: 13 },
  { id: "mustafid",name: "مستفيد", descAr: "التوظيف والتدريب",     descEn: "Employment Portal",   fill: "#007850", fontSize: 10 },
  { id: "sap",     name: "SAP",     descAr: "تكامل ERP",             descEn: "ERP Integration",     fill: "#0070F2", fontSize: 13 },
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
      <StaggerContainer>
        {/* ── HERO ─────────────────────────────────────────────── */}
        <section className="relative overflow-hidden pb-12 pt-20 sm:pt-28">
          {/* Ambient glow backdrop */}
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute inset-x-0 top-0 h-[36rem] bg-[radial-gradient(ellipse_70%_50%_at_50%_-5%,rgba(99,102,241,0.18),transparent_70%)] dark:bg-[radial-gradient(ellipse_70%_50%_at_50%_-5%,rgba(99,102,241,0.25),transparent_70%)]" />
            <div className="absolute start-0 top-20 h-72 w-72 rounded-full bg-indigo-500/[0.07] blur-[120px]" />
            <div className="absolute end-0 top-32 h-64 w-64 rounded-full bg-sky-500/[0.07] blur-[100px]" />
          </div>
          <div className="container mx-auto px-4">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Left: copy */}
            <StaggerItem direction="right" className="text-center lg:text-start">
              {/* Badge */}
              <div className="mb-5 flex justify-center lg:justify-start">
                <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-xs font-semibold text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300">
                  <span className="size-1.5 animate-pulse rounded-full bg-indigo-500" />
                  {isAr ? "منصة سعودية • متوافقة مع GOSI وWPS ومدد • ثنائية اللغة" : "Saudi-built • GOSI, WPS & Mudad compliant • Bilingual"}
                </span>
              </div>

            <h1 className="text-5xl font-extrabold leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl">
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

            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground/80 lg:mx-0">
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
            </div>

            {/* Trust proof pills */}
            <div className="mt-8 flex flex-wrap justify-center gap-2 border-t pt-6 lg:justify-start">
              {[
                {
                  labelAr: "تشغيل عربي / إنجليزي كامل",
                  labelEn: "Full Arabic / English operations",
                  dot: "bg-indigo-500",
                },
                {
                  labelAr: "الموظفون والحضور والرواتب في مكان واحد",
                  labelEn: "Employees, attendance, and payroll in one place",
                  dot: "bg-blue-500",
                },
                {
                  labelAr: "ويب + جوال للإدارة والموظفين",
                  labelEn: "Web + mobile for admins and employees",
                  dot: "bg-emerald-500",
                },
              ].map((s) => (
                <div
                  key={s.labelEn}
                  className="flex items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-3.5 py-2 text-sm"
                >
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${s.dot}`} />
                  <span className="text-muted-foreground">{isAr ? s.labelAr : s.labelEn}</span>
                </div>
              ))}
            </div>
          </StaggerItem>

          {/* Right: screenshots panel */}
          <StaggerItem direction="left" className="relative mx-auto w-full max-w-xl">
            <div className="pointer-events-none absolute -inset-12 -z-10 rounded-[3rem] bg-gradient-to-br from-indigo-500/20 via-blue-500/12 to-purple-500/12 blur-[100px]" />

            {/* Main browser-frame screenshot */}
            <div className="group overflow-hidden rounded-[2.5rem] border border-white/60 bg-card/60 shadow-[0_40px_100px_-30px_rgba(15,23,42,0.35)] ring-1 ring-black/5 backdrop-blur-xl transition-all duration-700 hover:-translate-y-2 hover:shadow-[0_60px_120px_-30px_rgba(15,23,42,0.45)] dark:border-white/10 dark:bg-slate-950/60 dark:shadow-[0_40px_100px_-30px_rgba(0,0,0,0.6)]">
              <div className="flex items-center gap-2 border-b border-border/40 bg-muted/30 px-4 py-3 backdrop-blur-md">
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
              />
            </div>
          </StaggerItem>
        </div>
        </div>
      </section>
      </StaggerContainer>

      {/* ── COMPLIANCE BAR ──────────────────────────────────── */}
      <div className="border-y border-border/50 bg-muted/20 py-5 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
            <p className="shrink-0 text-xs font-medium uppercase tracking-widest text-muted-foreground">
              {isAr ? "متوافق رسمياً مع" : "Officially compliant with"}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              {[
                { name: "GOSI", icon: Shield, color: "text-green-600" },
                { name: "WPS", icon: CreditCard, color: "text-blue-600" },
                { name: isAr ? "مدد" : "Mudad", icon: Users, color: "text-indigo-600" },
                { name: isAr ? "مقيم" : "Muqeem", icon: Globe, color: "text-purple-600" },
                { name: isAr ? "مستفيد" : "Mustafid", icon: Building2, color: "text-teal-600" },
              ].map(({ name, icon: Icon, color }) => (
                <div
                  key={name}
                  className="flex items-center gap-1.5 text-sm font-medium text-foreground/70 transition-colors hover:text-foreground"
                >
                  <Icon className={`h-3.5 w-3.5 ${color}`} />
                  <span>{name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── FEATURES ─────────────────────────────────────────── */}
      <section id="features" className="relative border-t py-28">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(248,250,252,0.5),rgba(255,255,255,1)_40%,rgba(248,250,252,0.3))] dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.4),rgba(2,6,23,0.7)_40%,rgba(15,23,42,0.3))]" />
        <FadeIn direction="up" className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <span className="mb-4 inline-block rounded-full border border-primary/20 bg-primary/[0.07] px-4 py-1.5 text-xs font-semibold text-primary">
              {isAr ? "المميزات" : "Features"}
            </span>
            <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
              {isAr ? "كل ما تحتاجه لإدارة فريقك" : "Everything to run your team"}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground/80">
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
        </FadeIn>
      </section>

      {/* ── PERSONAS ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-t py-28">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(248,250,252,0.6),rgba(255,255,255,1)_50%)] dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.5),rgba(2,6,23,0.7)_50%)]" />
        <FadeIn direction="up" className="container mx-auto px-4 text-center">
          <span className="mb-4 inline-block rounded-full border border-primary/20 bg-primary/[0.07] px-4 py-1.5 text-xs font-semibold text-primary">
            {isAr ? "لمن طاقم؟" : "Who is Taqam for?"}
          </span>
          <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            {isAr ? "مصمم لكل دور في فريقك" : "Built for every role in your team"}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            {isAr
              ? "بدل صور عامة منفصلة عن المنتج، كل دور هنا مرتبط بلقطات فعلية أقرب لطريقة استخدامه داخل المنصة."
              : "Instead of generic stock imagery, each role is paired with product visuals closer to the way that team actually works inside Taqam."}
          </p>

          <div className="mt-12 space-y-6 text-start">
            {personas.map((persona, i) => (
              <div
                key={persona.roleEn}
                className="group relative grid overflow-hidden rounded-[2.75rem] border border-border/40 bg-card/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-md transition-all duration-500 hover:border-border/80 hover:bg-card/95 hover:shadow-xl lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)]"
              >
                <div className={`${i % 2 === 0 ? "order-1" : "order-1 lg:order-2"} flex flex-1 flex-col justify-center px-6 py-10 lg:px-12 xl:px-16`}>
                  <p className="mb-3 text-xs font-bold uppercase tracking-[0.15em] text-primary/70">
                    {`0${i + 1} — ${isAr ? persona.roleAr : persona.roleEn}`}
                  </p>
                  <h3 className="text-2xl font-bold leading-snug lg:text-3xl">
                    {isAr ? persona.titleAr : persona.titleEn}
                  </h3>
                  <p className="mt-4 leading-relaxed text-muted-foreground">
                    {isAr ? persona.descAr : persona.descEn}
                  </p>
                  <ul className="mt-7 space-y-3.5">
                    {persona.features.map((f) => (
                      <li key={f.en} className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                          <CheckCircle2 className="h-3 w-3 text-primary" />
                        </div>
                        <span className="text-sm text-muted-foreground">{isAr ? f.ar : f.en}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className={i % 2 === 0 ? "order-2" : "order-2 lg:order-1"}>
                  <PersonaVisualPanel persona={persona} isAr={isAr} />
                </div>
              </div>
            ))}
          </div>
        </FadeIn>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────── */}
      <section className="relative bg-slate-950 py-28 text-white dark:bg-black">
        <div className="pointer-events-none absolute inset-0 -z-0 bg-[radial-gradient(ellipse_50%_40%_at_50%_0%,rgba(99,102,241,0.12),transparent_60%)]" />
        <FadeIn direction="up" className="container relative mx-auto px-4">
          {/* Header */}
          <div className="mb-20 text-center">
            <span className="mb-4 inline-block rounded-full border border-white/10 bg-white/[0.06] px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-white/70">
              {isAr ? "قصص النجاح" : "Success stories"}
            </span>
            <h2 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
              {isAr ? "لماذا يثق عملاؤنا بطاقم؟" : "Why do customers trust Taqam?"}
            </h2>
          </div>

          {/* Featured hero quote */}
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <svg
              aria-hidden="true"
              className="mx-auto mb-6 h-12 w-12 text-indigo-400 opacity-60"
              fill="currentColor"
              viewBox="0 0 32 32"
            >
              <path d="M10 6C5.6 6 2 9.6 2 14c0 4 2.7 7.4 6.5 8.3L6 26h4l3.5-6c.3-.6.5-1.3.5-2V6H10zm14 0c-4.4 0-8 3.6-8 8 0 4 2.7 7.4 6.5 8.3L20 26h4l3.5-6c.3-.6.5-1.3.5-2V6h-4z" />
            </svg>
            <blockquote className="text-xl font-light italic leading-relaxed text-white/90 sm:text-2xl">
              {isAr ? testimonials[0].quoteAr : testimonials[0].quoteEn}
            </blockquote>
            <div className="mt-9 flex items-center justify-center gap-4">
              <Image
                alt={isAr ? testimonials[0].nameAr : testimonials[0].nameEn}
                className="rounded-full object-cover ring-2 ring-indigo-500/50"
                height={52}
                src={testimonials[0].avatar}
                unoptimized
                width={52}
              />
              <div className="text-start">
                <p className="font-semibold text-white">
                  {isAr ? testimonials[0].nameAr : testimonials[0].nameEn}
                </p>
                <p className="text-sm text-white/60">
                  {isAr ? testimonials[0].roleAr : testimonials[0].roleEn}
                </p>
                <div className="mt-1.5 flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="h-3 w-3 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Two compact testimonials */}
          <div className="grid gap-5 border-t border-white/10 pt-12 sm:grid-cols-2">
            {testimonials.slice(1).map((t) => (
              <div
                key={t.nameEn}
                className="group flex gap-5 rounded-[2.5rem] border border-white/5 bg-white/[0.02] p-8 backdrop-blur-xl transition-all duration-500 hover:-translate-y-1.5 hover:border-white/15 hover:bg-white/[0.06] hover:shadow-[0_24px_40px_-15px_rgba(0,0,0,0.5)]"
              >
                <Image
                  alt={isAr ? t.nameAr : t.nameEn}
                  className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-white/15"
                  height={48}
                  src={t.avatar}
                  unoptimized
                  width={48}
                />
                <div>
                  <svg
                    aria-hidden="true"
                    className="mb-2 h-5 w-5 text-indigo-400/60"
                    fill="currentColor"
                    viewBox="0 0 32 32"
                  >
                    <path d="M10 6C5.6 6 2 9.6 2 14c0 4 2.7 7.4 6.5 8.3L6 26h4l3.5-6c.3-.6.5-1.3.5-2V6H10zm14 0c-4.4 0-8 3.6-8 8 0 4 2.7 7.4 6.5 8.3L20 26h4l3.5-6c.3-.6.5-1.3.5-2V6h-4z" />
                  </svg>
                  <p className="text-sm leading-relaxed text-white/80">
                    {isAr ? t.quoteAr : t.quoteEn}
                  </p>
                  <p className="mt-3 text-sm font-semibold text-white">{isAr ? t.nameAr : t.nameEn}</p>
                  <p className="text-xs text-white/60">{isAr ? t.roleAr : t.roleEn}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Proof strip */}
          <div className="mt-16 grid gap-4 border-t border-white/10 pt-12 sm:grid-cols-3">
            {[
              {
                icon: Layers,
                titleAr: "تشغيل موحد",
                titleEn: "Unified operations",
                descAr: "الموظفون والحضور والرواتب في نفس المسار بدل التنقل بين أدوات منفصلة.",
                descEn: "Employees, attendance, and payroll stay in one flow instead of separate tools.",
              },
              {
                icon: Globe,
                titleAr: "واجهة عربية أصلية",
                titleEn: "Arabic-first experience",
                descAr: "تجربة RTL كاملة مع نسخة إنجليزية جاهزة للإدارة والموظفين.",
                descEn: "Full RTL experience with an English-ready flow for admins and employees.",
              },
              {
                icon: Zap,
                titleAr: "اعتماد أسرع داخل الفريق",
                titleEn: "Faster team adoption",
                descAr: "نفس المنصة تغطي الإدارة المكتبية والجوال اليومي بدون تعقيد بصري زائد.",
                descEn: "The same product covers desktop admin work and daily mobile use without visual clutter.",
              },
            ].map((item) => {
              const ItemIcon = item.icon;
              return (
                <div
                  key={item.titleEn}
                  className="rounded-[2rem] border border-white/10 bg-white/5 p-6 text-start backdrop-blur-sm"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-indigo-300">
                    <ItemIcon className="h-5 w-5" />
                  </div>
                  <p className="mt-4 text-lg font-semibold text-white">{isAr ? item.titleAr : item.titleEn}</p>
                  <p className="mt-2 text-sm leading-7 text-white/65">{isAr ? item.descAr : item.descEn}</p>
                </div>
              );
            })}
          </div>
        </FadeIn>
      </section>

      {/* ── PRICING ──────────────────────────────────────────── */}
      <section id="pricing" className="py-28">
        <FadeIn direction="up" className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <span className="mb-4 inline-block rounded-full border border-primary/20 bg-primary/[0.07] px-4 py-1.5 text-xs font-semibold text-primary">
              {isAr ? "الأسعار" : "Pricing"}
            </span>
            <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
              {isAr ? "باقات تناسب كل حجم" : "Plans for every team size"}
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-lg text-muted-foreground/80">
              {isAr ? "ابدأ مجانًا، ادفع عند النمو" : "Start free, pay as you grow"}
            </p>
          </div>
          <div className="relative grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`group relative flex flex-col overflow-hidden rounded-[2.5rem] border border-border/40 bg-card/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:shadow-xl hover:border-border/80 ${
                  plan.popular ? "border-primary/40 ring-2 ring-primary/20 shadow-lg" : ""
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
        </FadeIn>
      </section>

      {/* ── INTEGRATIONS ─────────────────────────────────────── */}
      <section className="border-t bg-muted/10 py-24">
        <FadeIn direction="up" className="container mx-auto px-4">
          <div className="mb-10 text-center">
            <h3 className="text-xl font-bold">
              {isAr ? "يتكامل مع الأنظمة التي تعرفها" : "Integrates with the systems you know"}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {isAr
                ? "طاقم يربط مباشرةً مع الجهات الحكومية السعودية وأنظمة المحاسبة"
                : "Taqam connects directly with Saudi government entities and accounting systems"}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6 sm:gap-4">
            {integrations.map((item) => (
              <div
                key={item.id}
                className="group flex flex-col items-center gap-2.5 rounded-[1.75rem] border border-border/40 bg-card/60 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-md transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg hover:border-border/80"
              >
                <svg
                  aria-label={item.name}
                  height="48"
                  role="img"
                  viewBox="0 0 48 48"
                  width="48"
                  className="rounded-xl shadow-sm"
                >
                  <rect width="48" height="48" rx="10" fill={item.fill} />
                  <text
                    dominantBaseline="middle"
                    fill="white"
                    fontFamily="system-ui,-apple-system,Arial,sans-serif"
                    fontSize={item.fontSize}
                    fontWeight="700"
                    textAnchor="middle"
                    x="24"
                    y="25"
                  >
                    {item.name}
                  </text>
                </svg>
                <p className="text-center text-xs font-semibold">{item.name}</p>
                <p className="text-center text-[10px] leading-tight text-muted-foreground">
                  {isAr ? item.descAr : item.descEn}
                </p>
              </div>
            ))}
          </div>
        </FadeIn>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-t py-28">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-sky-50 via-white to-indigo-100/80 dark:from-indigo-600 dark:via-blue-600 dark:to-purple-700" />
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_-20%,rgba(59,130,246,0.14),transparent_60%)] dark:bg-[radial-gradient(ellipse_at_50%_-20%,rgba(255,255,255,0.15),transparent_60%)]" />
        <FadeIn className="container mx-auto px-4 text-center">
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
        </FadeIn>
      </section>
    </main>
  );
}




