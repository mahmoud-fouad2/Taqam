import type { Metadata } from "next";
import type { LucideIcon } from "lucide-react";

import {
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Building2,
  CheckCircle2,
  Clock,
  CreditCard,
  FileDown,
  FileSpreadsheet,
  Globe,
  GraduationCap,
  LayoutDashboard,
  MessageSquare,
  Shield,
  Smartphone,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Users,
  Wallet,
  Zap,
} from "lucide-react";

import { MarketingPageCta } from "@/components/marketing/page-cta";
import { MarketingPageHero } from "@/components/marketing/page-hero";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/ui/fade-in";
import { cn } from "@/lib/utils";
import { marketingMetadata } from "@/lib/marketing/seo";
import { getAppLocale } from "@/lib/i18n/locale";

export async function generateMetadata(): Promise<Metadata> {
  return marketingMetadata({
    path: "/features",
    titleAr: "مميزات طاقم | منصة موارد بشرية ورواتب وحضور",
    titleEn: "Taqam Features | HR, Payroll & Attendance",
    descriptionAr:
      "استكشف مميزات طاقم: إدارة موظفين، حضور وانصراف، رواتب، إجازات، تقييم أداء، تدريب، توظيف، وتقارير — كل ما تحتاجه في مكان واحد.",
    descriptionEn:
      "Explore Taqam features: employees, attendance, payroll, leave, performance, training, recruitment, and reports — everything in one place.",
  });
}

type FeatureCopy = {
  ar: string;
  en: string;
};

type FeatureItem = {
  icon: LucideIcon;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
};

type FeatureSection = {
  titleAr: string;
  titleEn: string;
  eyebrowAr: string;
  eyebrowEn: string;
  summaryAr: string;
  summaryEn: string;
  outcomes: FeatureCopy[];
  items: FeatureItem[];
};

const platformHighlights = [
  {
    icon: Zap,
    titleAr: "تشغيل يومي أسرع",
    titleEn: "Faster daily operations",
    descAr: "بدل التنقل بين Sheets وأدوات متفرقة، كل مسار التشغيل في شاشة واحدة مترابطة.",
    descEn: "Instead of jumping between sheets and scattered tools, every workflow lives in one connected place.",
  },
  {
    icon: Shield,
    titleAr: "امتثال سعودي أوضح",
    titleEn: "Clear Saudi compliance",
    descAr: "الرواتب، WPS، والصلاحيات وسجلات التدقيق مصممة لتقليل الأخطاء التشغيلية.",
    descEn: "Payroll, WPS, roles, and audit trails are designed to reduce operational mistakes.",
  },
  {
    icon: Globe,
    titleAr: "تجربة عربية/إنجليزية سليمة",
    titleEn: "Solid Arabic/English UX",
    descAr: "واجهة RTL/LTR متسقة بحيث لا يشعر المستخدم أن العربية طبقة مضافة فوق النظام.",
    descEn: "A consistent RTL/LTR experience so Arabic feels native, not layered on top of the product.",
  },
  {
    icon: Star,
    titleAr: "واجهة تنفيذية أنظف",
    titleEn: "Cleaner executive UX",
    descAr: "تنظيم بصري يوضح ما يهم المدير التنفيذي، وما يهم HR، وما يخص الموظف نفسه.",
    descEn: "A visual structure that separates what matters to executives, HR teams, and employees.",
  },
];

const featureSections: FeatureSection[] = [
  {
    titleAr: "الموارد البشرية الأساسية",
    titleEn: "Core HR",
    eyebrowAr: "قاعدة التشغيل",
    eyebrowEn: "Operational foundation",
    summaryAr: "كل ما يخص بيانات الموظفين وهيكل الشركة والتنبيهات الأساسية في طبقة تشغيل واحدة واضحة وسهلة الإدارة.",
    summaryEn: "Everything around employee records, company structure, and operational visibility in one clear foundation layer.",
    outcomes: [
      { ar: "ملفات موظفين كاملة وقابلة للتحديث", en: "Full employee records that stay up to date" },
      { ar: "هيكل إداري واضح بدل الجداول المتفرقة", en: "A clear org structure instead of scattered sheets" },
      { ar: "لوحة تحكم تُظهر ما يحتاجه الفريق يومياً", en: "A dashboard that surfaces what teams need every day" },
    ],
    items: [
      {
        icon: Users,
        titleAr: "إدارة الموظفين",
        titleEn: "Employee Management",
        descAr: "ملف موظف شامل: بيانات شخصية، وظيفية، عقد، تاريخ التعيين، والحالة الوظيفية مع سهولة الوصول والتحديث.",
        descEn: "A full employee profile with personal data, job info, contract details, hire date, and current status.",
      },
      {
        icon: Building2,
        titleAr: "هيكل الشركة",
        titleEn: "Org Structure",
        descAr: "أقسام ومسميات وظيفية وورديات وتوزيع للموظفين في هيكل هرمي واضح يسهل متابعته عند النمو.",
        descEn: "Departments, job titles, shifts, and employee assignment in a hierarchy that remains clear as you scale.",
      },
      {
        icon: LayoutDashboard,
        titleAr: "لوحة التحكم",
        titleEn: "Dashboard",
        descAr: "نظرة شاملة على الحضور، الإجازات، الرواتب، والتنبيهات اليومية بدون الحاجة لفتح عدة صفحات في كل مرة.",
        descEn: "A single overview for attendance, leave, payroll, and daily alerts without opening multiple pages each time.",
      },
    ],
  },
  {
    titleAr: "الحضور والإجازات",
    titleEn: "Attendance & Leave",
    eyebrowAr: "الإيقاع اليومي للعمل",
    eyebrowEn: "The daily work rhythm",
    summaryAr: "إدارة الوقت لا تكون فعالة عندما تكون منفصلة عن الإجازات والطلبات. هنا المسار كله مربوط من الحضور إلى الموافقة إلى التقرير.",
    summaryEn: "Time management is weak when it is isolated from leave and approvals. Here the whole path is connected end to end.",
    outcomes: [
      { ar: "تتبع يومي واضح للحضور والتأخير", en: "Clear daily tracking for attendance and tardiness" },
      { ar: "طلبات إجازة بمسار موافقات مفهوم", en: "Leave requests with a clean approval flow" },
      { ar: "تجربة موبايل تخدم الموظف مباشرة", en: "A mobile experience that serves employees directly" },
    ],
    items: [
      {
        icon: Clock,
        titleAr: "الحضور والانصراف",
        titleEn: "Time & Attendance",
        descAr: "سجلات حضور دقيقة، ورديات مرنة، رصد التأخر والغياب، وتقارير يومية تعطي الفريق التشغيلي صورة دقيقة لحظة بلحظة.",
        descEn: "Accurate attendance logs, flexible shifts, tardiness tracking, and daily reports for a real operational view.",
      },
      {
        icon: Smartphone,
        titleAr: "تسجيل حضور من الجوال",
        titleEn: "Mobile Check-in",
        descAr: "يسجّل الموظف حضوره وانصرافه من التطبيق مع قابلية ربطه بالموقع الجغرافي عند الحاجة دون تعقيد على المستخدم.",
        descEn: "Employees check in and out from mobile, with optional location verification when needed.",
      },
      {
        icon: MessageSquare,
        titleAr: "إدارة الإجازات",
        titleEn: "Leave Management",
        descAr: "طلبات إجازة، موافقة أو رفض، أنواع متعددة من الإجازات، وأرصدة تُحتسب تلقائياً بدل المتابعة اليدوية.",
        descEn: "Leave requests, approval or rejection, multiple leave types, and balances that update automatically.",
      },
    ],
  },
  {
    titleAr: "الرواتب والمالية",
    titleEn: "Payroll & Finance",
    eyebrowAr: "المسار المالي",
    eyebrowEn: "The finance layer",
    summaryAr: "بدل أن تكون الرواتب مرحلة منفصلة ومرهقة، طاقم يحولها إلى مسار واضح من الإدخال إلى المراجعة إلى التصدير والإرسال.",
    summaryEn: "Instead of payroll being a separate painful cycle, Taqam turns it into a clear flow from input to approval to export.",
    outcomes: [
      { ar: "تشغيل مسير رواتب شهري أو دوري", en: "Run payroll monthly or on custom cycles" },
      { ar: "تصدير WPS وقسائم راتب احترافية", en: "WPS export and polished payslips" },
      { ar: "تقليل الأخطاء اليدوية في الاستحقاقات", en: "Reduce manual errors in entitlements and deductions" },
    ],
    items: [
      {
        icon: CreditCard,
        titleAr: "مسير الرواتب",
        titleEn: "Payroll Run",
        descAr: "تشغيل شهري أو دوري للرواتب مع استحقاقات واستقطاعات مرنة ومراجعة أو إقرار بسرعة قبل الإرسال النهائي.",
        descEn: "Run payroll on monthly or custom schedules with flexible allowances, deductions, and quick approval steps.",
      },
      {
        icon: FileDown,
        titleAr: "تصدير WPS",
        titleEn: "WPS Export",
        descAr: "تصدير ملفات الرواتب بصيغة WPS المتوافقة مع متطلبات وزارة الموارد البشرية دون تحويلات يدوية إضافية.",
        descEn: "Export payroll files in WPS format aligned with Saudi labor requirements without extra manual steps.",
      },
      {
        icon: Wallet,
        titleAr: "كشوف الرواتب",
        titleEn: "Payslips",
        descAr: "قسائم راتب احترافية قابلة للطباعة والتحميل والإرسال للموظفين بشكل يليق بالعلامة ويقلل الأسئلة المتكررة.",
        descEn: "Professional payslips that can be printed, downloaded, and sent to employees in a cleaner branded format.",
      },
    ],
  },
  {
    titleAr: "الأداء والتطوير",
    titleEn: "Performance & Development",
    eyebrowAr: "النمو الداخلي",
    eyebrowEn: "Internal growth",
    summaryAr: "المنصة لا يجب أن تتوقف عند التوظيف والرواتب. هذا المسار يحافظ على التطوير المهني وتقييم الأداء كجزء من التشغيل نفسه.",
    summaryEn: "The platform should not stop at payroll and records. This layer keeps growth and performance inside the operating system.",
    outcomes: [
      { ar: "دورات تقييم متكررة وواضحة", en: "Repeatable and structured review cycles" },
      { ar: "أهداف قابلة للمتابعة وليست شكلية", en: "Trackable goals that are not just ceremonial" },
      { ar: "برامج تدريب مرتبطة بحالة الموظف", en: "Training linked directly to employee progress" },
    ],
    items: [
      {
        icon: Star,
        titleAr: "تقييم الأداء",
        titleEn: "Performance Reviews",
        descAr: "نماذج تقييم مخصصة ودورات تقييم دورية وتقارير تجعل مراجعة الأداء عملية يمكن البناء عليها لا مجرد إجراء سنوي.",
        descEn: "Custom review templates, recurring evaluation cycles, and reports that make performance review actionable.",
      },
      {
        icon: Target,
        titleAr: "الأهداف وخطط التطوير",
        titleEn: "Goals & Development Plans",
        descAr: "تحديد أهداف لكل موظف وربطها بخطط تطوير ومتابعة نسب التقدم من داخل النظام نفسه.",
        descEn: "Set goals per employee, link them to development plans, and track progress from within the platform.",
      },
      {
        icon: GraduationCap,
        titleAr: "التدريب والأكاديمية",
        titleEn: "Training & Academy",
        descAr: "إدارة برامج التدريب والتسجيل في الدورات ومتابعة إتمام الموظفين للمواد التدريبية بصورة منظمة.",
        descEn: "Manage training programs, enrollments, and completion tracking with a structured learning flow.",
      },
    ],
  },
  {
    titleAr: "التوظيف",
    titleEn: "Recruitment",
    eyebrowAr: "بوابة النمو",
    eyebrowEn: "Growth entry point",
    summaryAr: "التوظيف ليس مجرد نشر إعلان. طاقم يجمع الإعلان والمتقدمين والمقابلات والعروض في مسار واحد مفهوم للفريق.",
    summaryEn: "Recruitment is more than publishing a job post. Taqam keeps postings, applicants, interviews, and offers in one path.",
    outcomes: [
      { ar: "إعلان وظيفة ومتابعة المتقدمين من مكان واحد", en: "Job posting and applicant tracking in one place" },
      { ar: "تقليل الفوضى بين البريد والملفات", en: "Reduce chaos across email and manual files" },
      { ar: "تحويل المرشح إلى موظف دون فقدان السياق", en: "Move candidates into onboarding without losing context" },
    ],
    items: [
      {
        icon: BookOpen,
        titleAr: "إعلانات الوظائف",
        titleEn: "Job Postings",
        descAr: "نشر إعلانات الوظائف وإدارة المسارات المفتوحة بسهولة مع رؤية واضحة لحالة كل فرصة توظيف.",
        descEn: "Publish and manage job openings with clearer visibility into each recruitment pipeline.",
      },
      {
        icon: Users,
        titleAr: "إدارة المقابلات",
        titleEn: "Interview Management",
        descAr: "جدولة المقابلات وتسجيل الملاحظات وإصدار عروض العمل مباشرةً دون الاعتماد على مسارات خارجية مشتتة.",
        descEn: "Schedule interviews, capture notes, and issue offers directly instead of relying on external fragmented flows.",
      },
    ],
  },
  {
    titleAr: "التقارير والامتثال",
    titleEn: "Reports & Compliance",
    eyebrowAr: "طبقة القرار والحوكمة",
    eyebrowEn: "Decision and governance layer",
    summaryAr: "حتى أفضل العمليات تفقد قيمتها إذا لم تكن قابلة للقياس. هذا المسار يعطي الإدارة والتشغيل نظرة قابلة للفهم والتنفيذ.",
    summaryEn: "Even great operations lose value if they cannot be measured. This layer makes the system observable and governable.",
    outcomes: [
      { ar: "تقارير موارد بشرية ورواتب في مكان واحد", en: "HR and payroll reporting from one surface" },
      { ar: "سجلات تدقيق وصلاحيات واضحة", en: "Clear permissions and audit trails" },
      { ar: "استيراد وتصدير منظم للبيانات", en: "Structured import and export workflows" },
    ],
    items: [
      {
        icon: BarChart3,
        titleAr: "تقارير HR متعددة",
        titleEn: "HR Reports",
        descAr: "تقارير حضور وإجازات ورواتب ودوران عمالة وتكاليف في صفحة منظمة تساعدك على التحليل بدلاً من جمع البيانات أولاً.",
        descEn: "Attendance, leave, payroll, turnover, and cost reports organized for analysis instead of manual aggregation.",
      },
      {
        icon: TrendingUp,
        titleAr: "تقارير الرواتب",
        titleEn: "Payroll Reports",
        descAr: "تحليلات مفصّلة لتكاليف الرواتب والمكافآت والاستقطاعات مع مقارنة الفترات وإظهار الاتجاهات المهمة بسرعة.",
        descEn: "Detailed payroll analysis across salaries, bonuses, deductions, and period comparisons with faster signal detection.",
      },
      {
        icon: Shield,
        titleAr: "الأدوار وسجلات التدقيق",
        titleEn: "Roles & Audit Logs",
        descAr: "صلاحيات دقيقة لكل مستخدم مع سجل كامل للعمليات الحساسة بما يعطي الإدارة ثقة وتشغيلاً يمكن مراجعته.",
        descEn: "Fine-grained permissions with a full trail of sensitive actions for better trust and operational reviewability.",
      },
      {
        icon: FileSpreadsheet,
        titleAr: "استيراد وتصدير Excel",
        titleEn: "Excel Import & Export",
        descAr: "استيراد بيانات الموظفين والإجازات وتصدير التقارير بسهولة بحيث يكون الانتقال إلى النظام أقل احتكاكاً.",
        descEn: "Import employees and leave data, then export reports with less friction during rollout and daily usage.",
      },
      {
        icon: Globe,
        titleAr: "عربي / إنجليزي بالكامل",
        titleEn: "Full Arabic / English",
        descAr: "واجهة كاملة بالعربية مع دعم RTL وتبديل فوري للإنجليزية، بدون شعور بأن أحد اللغتين أقل جودة من الأخرى.",
        descEn: "A full Arabic UI with RTL support and instant English switching, without one locale feeling secondary.",
      },
    ],
  },
];

const suiteThemes = [
  {
    panel: "bg-gradient-to-br from-indigo-100 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/70",
    badge: "border-indigo-200 bg-white/80 text-indigo-700 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-200",
    iconWrap: "bg-indigo-600 text-white",
    itemIcon: "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-200",
    ribbon: "bg-indigo-500",
    index: "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-200",
  },
  {
    panel: "bg-gradient-to-br from-blue-100 via-white to-cyan-50 dark:from-slate-950 dark:via-slate-900 dark:to-cyan-950/70",
    badge: "border-blue-200 bg-white/80 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-200",
    iconWrap: "bg-blue-600 text-white",
    itemIcon: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-200",
    ribbon: "bg-blue-500",
    index: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-200",
  },
  {
    panel: "bg-gradient-to-br from-violet-100 via-white to-fuchsia-50 dark:from-slate-950 dark:via-slate-900 dark:to-violet-950/70",
    badge: "border-violet-200 bg-white/80 text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-200",
    iconWrap: "bg-violet-600 text-white",
    itemIcon: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-200",
    ribbon: "bg-violet-500",
    index: "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-200",
  },
  {
    panel: "bg-gradient-to-br from-emerald-100 via-white to-teal-50 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/70",
    badge: "border-emerald-200 bg-white/80 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200",
    iconWrap: "bg-emerald-600 text-white",
    itemIcon: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200",
    ribbon: "bg-emerald-500",
    index: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200",
  },
  {
    panel: "bg-gradient-to-br from-amber-100 via-white to-orange-50 dark:from-slate-950 dark:via-slate-900 dark:to-amber-950/70",
    badge: "border-amber-200 bg-white/80 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200",
    iconWrap: "bg-amber-500 text-white",
    itemIcon: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200",
    ribbon: "bg-amber-500",
    index: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-200",
  },
  {
    panel: "bg-gradient-to-br from-slate-200 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800",
    badge: "border-slate-300 bg-white/80 text-slate-700 dark:border-white/15 dark:bg-white/5 dark:text-slate-200",
    iconWrap: "bg-slate-900 text-white",
    itemIcon: "border-slate-200 bg-slate-50 text-slate-700 dark:border-white/15 dark:bg-white/5 dark:text-slate-200",
    ribbon: "bg-slate-500",
    index: "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200",
  },
];

export default async function FeaturesPage() {
  const locale = await getAppLocale();
  const isAr = locale === "ar";
  const p = locale === "en" ? "/en" : "";

  const totalFeatures = featureSections.reduce((sum, section) => sum + section.items.length, 0);

  return (
    <main className="bg-background">
      <StaggerContainer>
        <MarketingPageHero
          icon={Sparkles}
          badge={isAr ? "منصة موارد بشرية متكاملة" : "All-in-one HR platform"}
          title={isAr ? "نظام تشغيل فعلي للموارد البشرية" : "A real operating system for HR"}
          description={
            isAr
              ? "بدل صفحات متفرقة وكروت مكررة، طاقم ينظم التشغيل اليومي في مسارات واضحة: من الموظفين والحضور إلى الرواتب والتقارير والتوظيف."
              : "Instead of scattered pages and repetitive cards, Taqam organizes daily operations into clear paths: from employees and attendance to payroll, reporting, and recruitment."
          }
          actions={[
            { href: `${p}/request-demo`, label: isAr ? "اطلب عرضًا عمليًا" : "Request a practical demo", variant: "brand" },
            { href: `${p}/screenshots`, label: isAr ? "استعرض الواجهات" : "Browse screenshots", variant: "outline" },
          ]}
          stats={[
            { value: `${totalFeatures}+`, label: isAr ? "ميزة مترابطة" : "Connected capabilities" },
            { value: `${featureSections.length}`, label: isAr ? "مسارات تشغيل" : "Operational suites" },
            { value: isAr ? "عربي + إنجليزي" : "Arabic + English", label: isAr ? "واجهة ثنائية اللغة" : "Bilingual experience" },
          ]}
          tone="indigo"
        />

        <section className="border-b bg-gradient-to-b from-background to-muted/30 py-14 sm:py-18">
          <div className="container mx-auto px-4">
            <StaggerItem direction="up" className="rounded-[32px] border border-border/70 bg-background/80 p-6 shadow-[0_28px_80px_-40px_rgba(79,70,229,0.18)] backdrop-blur-sm sm:p-8 lg:p-10">
              <div className="grid gap-6 lg:grid-cols-[1.1fr_1.35fr] lg:items-start">
                <div className="rounded-[28px] bg-[radial-gradient(circle_at_top_left,rgba(79,70,229,0.16),transparent_42%),linear-gradient(135deg,rgba(255,255,255,0.98),rgba(238,242,255,0.95))] p-6 sm:p-8 dark:bg-[radial-gradient(circle_at_top_left,rgba(79,70,229,0.16),transparent_42%),linear-gradient(135deg,rgba(15,23,42,0.98),rgba(2,6,23,0.95))]">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-700/70 dark:text-indigo-300/80">
                    {isAr ? "بنية المنصة" : "Platform anatomy"}
                  </p>
                  <h2 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">
                    {isAr ? "منصة واحدة بدل ست أدوات لا تتكلم مع بعضها" : "One platform instead of six disconnected tools"}
                  </h2>
                  <p className="mt-4 max-w-xl leading-8 text-slate-600 dark:text-slate-400">
                    {isAr
                      ? "التصميم هنا ليس مجرد سرد للمميزات. الفكرة أن الزائر يفهم بسرعة كيف تتحول HR من ملفات وجداول وموافقات منفصلة إلى نظام تشغيل يومي مترابط."
                      : "This page is not a random feature dump. It is structured so visitors quickly understand how HR moves from fragmented files and approvals to one operational system."}
                  </p>
                  <div className="mt-8 grid gap-3 sm:grid-cols-2">
                    {platformHighlights.map((highlight) => (
                      <div
                        key={highlight.titleEn}
                        className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-[0_18px_36px_-28px_rgba(15,23,42,0.26)] dark:border-white/10 dark:bg-slate-950/80 dark:backdrop-blur-md"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-sm">
                          <highlight.icon className="h-4 w-4" />
                        </div>
                        <h3 className="mt-4 text-sm font-bold text-slate-950 dark:text-zinc-100">
                          {isAr ? highlight.titleAr : highlight.titleEn}
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-zinc-400">
                          {isAr ? highlight.descAr : highlight.descEn}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {featureSections.map((section, idx) => {
                    const theme = suiteThemes[idx % suiteThemes.length];

                    return (
                      <StaggerItem
                        direction="up"
                        key={section.titleEn}
                        className="group rounded-[28px] border border-border/70 bg-background/85 p-5 shadow-[0_22px_60px_-34px_rgba(15,23,42,0.18)] transition-transform duration-300 hover:-translate-y-1"
                      >
                        <div className={cn("inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold", theme.badge)}>
                          {String(idx + 1).padStart(2, "0")}
                        </div>
                        <h3 className="mt-4 text-lg font-bold tracking-tight">
                          {isAr ? section.titleAr : section.titleEn}
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                          {isAr ? section.summaryAr : section.summaryEn}
                        </p>
                        <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-foreground/70">
                          <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                          {isAr ? `${section.items.length} مكونات داخل هذا المسار` : `${section.items.length} capabilities in this suite`}
                        </div>
                      </StaggerItem>
                    );
                  })}
                </div>
              </div>
            </StaggerItem>
          </div>
        </section>

        {featureSections.map((section, sectionIndex) => {
          const theme = suiteThemes[sectionIndex % suiteThemes.length];
        const SectionIcon = section.items[0]?.icon ?? Sparkles;
        const reverse = sectionIndex % 2 === 1;

        return (
          <section
            key={section.titleEn}
            className={cn("border-b py-14 sm:py-18", sectionIndex % 2 === 0 ? "bg-background" : "bg-muted/20")}
          >
            <div className="container mx-auto px-4">
              <div className={cn("grid gap-6 lg:grid-cols-[0.92fr_1.35fr] lg:items-stretch", reverse && "lg:[&>*:first-child]:order-2")}>
                <div className={cn("rounded-[32px] border border-border/60 p-6 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.14)] sm:p-8", theme.panel)}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className={cn("inline-flex rounded-full border px-3 py-1 text-xs font-semibold", theme.badge)}>
                        {isAr ? section.eyebrowAr : section.eyebrowEn}
                      </span>
                      <h2 className="mt-5 text-2xl font-black tracking-tight sm:text-3xl">
                        {isAr ? section.titleAr : section.titleEn}
                      </h2>
                    </div>
                    <div className={cn("hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-sm sm:flex", theme.iconWrap)}>
                      <SectionIcon className="h-7 w-7" />
                    </div>
                  </div>

                  <p className="mt-5 leading-8 text-slate-700 dark:text-slate-300">
                    {isAr ? section.summaryAr : section.summaryEn}
                  </p>

                  <div className="mt-8 rounded-[28px] border border-white/70 bg-white/75 p-5 shadow-[0_22px_44px_-34px_rgba(15,23,42,0.24)] backdrop-blur dark:border-white/10 dark:bg-slate-950/80">
                    <div className="flex items-baseline gap-3">
                      <span className="text-3xl font-black text-slate-950 dark:text-white">{section.items.length}</span>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {isAr ? "عناصر تشغيل داخل هذا المسار" : "operational building blocks in this suite"}
                      </p>
                    </div>
                    <div className="mt-5 space-y-3">
                      {section.outcomes.map((outcome) => (
                        <div key={outcome.en} className="flex items-start gap-3">
                          <div className={cn("mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full", theme.index)}>
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </div>
                          <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">{isAr ? outcome.ar : outcome.en}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-2">
                    {section.items.map((item) => (
                      <span
                        key={item.titleEn}
                        className="rounded-full border border-white/70 bg-white/70 px-3 py-1.5 text-xs font-medium text-slate-700 dark:border-white/10 dark:bg-slate-950/80 dark:text-slate-300 dark:backdrop-blur-md"
                      >
                        {isAr ? item.titleAr : item.titleEn}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  {section.items.map((item, itemIndex) => (
                    <StaggerItem
                      direction="up"
                      key={item.titleEn}
                      className="group relative overflow-hidden rounded-[28px] border border-border/70 bg-background/90 p-5 shadow-[0_22px_56px_-36px_rgba(15,23,42,0.16)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_28px_72px_-38px_rgba(79,70,229,0.18)] sm:p-6"
                    >
                      <div className={cn("absolute inset-y-0 start-0 w-1", theme.ribbon)} />
                      <div className="flex gap-4 sm:gap-5">
                        <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border shadow-sm", theme.itemIcon)}>
                          <item.icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="mb-3 flex flex-wrap items-center gap-2">
                            <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]", theme.index)}>
                              {String(itemIndex + 1).padStart(2, "0")}
                            </span>
                            <h3 className="text-base font-bold tracking-tight sm:text-lg">
                              {isAr ? item.titleAr : item.titleEn}
                            </h3>
                          </div>
                          <p className="text-sm leading-7 text-muted-foreground sm:text-[15px]">
                            {isAr ? item.descAr : item.descEn}
                          </p>
                        </div>
                        <ArrowUpRight className="mt-1 hidden h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground sm:block" />
                      </div>
                    </StaggerItem>
                  ))}
                </div>
              </div>
            </div>
          </section>
        );
      })}

      <MarketingPageCta
        title={isAr ? "هل تريد رؤية المسار المناسب لفريقك؟" : "Want to see the right flow for your team?"}
        description={
          isAr
            ? "نرتب لك Demo يركز على المسارات التي تهمك فعلاً: HR الأساسية أو الرواتب أو الحضور أو التوظيف، بدل عرض عام سريع."
            : "We can tailor a demo around the suites you actually need first—Core HR, payroll, attendance, or recruitment—instead of a generic walkthrough."
        }
        primaryAction={{ href: `${p}/request-demo`, label: isAr ? "احجز عرضًا عمليًا" : "Book a practical demo" }}
        secondaryAction={{ href: `${p}/plans`, label: isAr ? "راجع الباقات" : "Review plans" }}
        tone="muted"
      />
      </StaggerContainer>
    </main>
  );
}


