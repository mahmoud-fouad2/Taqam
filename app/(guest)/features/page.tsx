import type { Metadata } from "next";
import Link from "next/link";

import {
  BarChart3,
  BookOpen,
  Building2,
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
} from "lucide-react";

import { MarketingPageCta } from "@/components/marketing/page-cta";
import { MarketingPageHero } from "@/components/marketing/page-hero";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

const featureSections = [
  {
    titleAr: "الموارد البشرية الأساسية",
    titleEn: "Core HR",
    items: [
      {
        icon: Users,
        titleAr: "إدارة الموظفين",
        titleEn: "Employee Management",
        descAr: "ملف موظف شامل: بيانات شخصية، وظيفية، عقد، تاريخ التعيين، والحالة الوظيفية.",
        descEn: "Full employee profile: personal data, job info, contract, hire date, and status.",
      },
      {
        icon: Building2,
        titleAr: "هيكل الشركة",
        titleEn: "Org Structure",
        descAr: "أقسام ومسميات وظيفية وورديات وتوزيع الموظفين في هيكل هرمي واضح.",
        descEn: "Departments, job titles, shifts, and employee assignment in a clear hierarchy.",
      },
      {
        icon: LayoutDashboard,
        titleAr: "لوحة التحكم",
        titleEn: "Dashboard",
        descAr: "نظرة شاملة على المؤشرات الحيوية: الحضور، الإجازات، الرواتب، والتنبيهات اليومية.",
        descEn: "A full overview of key metrics: attendance, leave, payroll, and daily alerts.",
      },
    ],
  },
  {
    titleAr: "الحضور والإجازات",
    titleEn: "Attendance & Leave",
    items: [
      {
        icon: Clock,
        titleAr: "الحضور والانصراف",
        titleEn: "Time & Attendance",
        descAr: "سجلات حضور دقيقة، ورديات مرنة، رصد التأخر والغياب، وتقارير يومية.",
        descEn: "Accurate attendance logs, flexible shifts, tardiness tracking, and daily reports.",
      },
      {
        icon: Smartphone,
        titleAr: "تسجيل حضور من الجوال",
        titleEn: "Mobile Check-in",
        descAr: "يسجّل الموظف حضوره وانصرافه من التطبيق مع التحقق من الموقع الجغرافي.",
        descEn: "Employees check in/out from the app with optional location verification.",
      },
      {
        icon: MessageSquare,
        titleAr: "إدارة الإجازات",
        titleEn: "Leave Management",
        descAr: "طلبات إجازة، موافقة/رفض، أنواع إجازات متعددة (سنوية، مرضية، بدون أجر)، ورصيد تلقائي.",
        descEn: "Leave requests, approve/reject flow, multiple types (annual, sick, unpaid), and automatic balance.",
      },
    ],
  },
  {
    titleAr: "الرواتب والمالية",
    titleEn: "Payroll & Finance",
    items: [
      {
        icon: CreditCard,
        titleAr: "مسير الرواتب",
        titleEn: "Payroll Run",
        descAr: "تشغيل شهري أو دوري للرواتب، استحقاقات واستقطاعات مرنة، وإقرار بضغطة واحدة.",
        descEn: "Monthly or periodic payroll runs with flexible allowances, deductions, and one-click approval.",
      },
      {
        icon: FileDown,
        titleAr: "تصدير WPS",
        titleEn: "WPS Export",
        descAr: "تصدير ملفات الرواتب بصيغة WPS متوافقة مع متطلبات وزارة الموارد البشرية.",
        descEn: "Export payroll files in WPS format compliant with Ministry of HR requirements.",
      },
      {
        icon: Wallet,
        titleAr: "كشوف الرواتب",
        titleEn: "Payslips",
        descAr: "قسائم راتب احترافية قابلة للطباعة والتحميل كـ PDF وإرسالها للموظفين.",
        descEn: "Professional payslips printable, downloadable as PDF, and sendable to employees.",
      },
    ],
  },
  {
    titleAr: "الأداء والتطوير",
    titleEn: "Performance & Development",
    items: [
      {
        icon: Star,
        titleAr: "تقييم الأداء",
        titleEn: "Performance Reviews",
        descAr: "نماذج تقييم مخصصة، دورات تقييم دورية، وتقارير لمتابعة أداء الموظفين.",
        descEn: "Custom review templates, periodic evaluation cycles, and performance reports.",
      },
      {
        icon: Target,
        titleAr: "الأهداف وخطط التطوير",
        titleEn: "Goals & Development Plans",
        descAr: "تحديد أهداف واضحة لكل موظف وربطها بخطط تطوير مهني قابلة للمتابعة.",
        descEn: "Set clear goals per employee and link them to trackable professional development plans.",
      },
      {
        icon: GraduationCap,
        titleAr: "التدريب والأكاديمية",
        titleEn: "Training & Academy",
        descAr: "إدارة برامج التدريب، التسجيل في الدورات، ومتابعة إتمام الموظفين للمواد.",
        descEn: "Manage training programs, course enrollment, and track employee completion.",
      },
    ],
  },
  {
    titleAr: "التوظيف",
    titleEn: "Recruitment",
    items: [
      {
        icon: BookOpen,
        titleAr: "إعلانات الوظائف",
        titleEn: "Job Postings",
        descAr: "نشر إعلانات الوظائف ومتابعة المتقدمين في مكان واحد.",
        descEn: "Publish job postings and track applicants in one place.",
      },
      {
        icon: Users,
        titleAr: "إدارة المقابلات",
        titleEn: "Interview Management",
        descAr: "جدولة المقابلات، تسجيل الملاحظات، وإصدار عروض العمل مباشرة من النظام.",
        descEn: "Schedule interviews, add notes, and issue job offers directly from the system.",
      },
    ],
  },
  {
    titleAr: "التقارير والامتثال",
    titleEn: "Reports & Compliance",
    items: [
      {
        icon: BarChart3,
        titleAr: "تقارير HR متعددة",
        titleEn: "HR Reports",
        descAr: "تقارير حضور، إجازات، رواتب، دوران عمالة، وتكاليف — كلها في صفحة واحدة.",
        descEn: "Attendance, leave, payroll, turnover, and cost reports — all in one place.",
      },
      {
        icon: TrendingUp,
        titleAr: "تقارير الرواتب",
        titleEn: "Payroll Reports",
        descAr: "تحليلات مفصّلة لتكاليف الرواتب، المكافآت، الاستقطاعات، والمقارنة بين الفترات.",
        descEn: "Detailed payroll cost analysis, bonuses, deductions, and period comparisons.",
      },
      {
        icon: Shield,
        titleAr: "الأدوار وسجلات التدقيق",
        titleEn: "Roles & Audit Logs",
        descAr: "صلاحيات دقيقة لكل مستخدم مع سجل كامل للعمليات الحساسة.",
        descEn: "Fine-grained permissions per user with a full audit trail for sensitive actions.",
      },
      {
        icon: FileSpreadsheet,
        titleAr: "استيراد وتصدير Excel",
        titleEn: "Excel Import & Export",
        descAr: "استيراد بيانات الموظفين والإجازات من Excel وتصدير التقارير بسهولة.",
        descEn: "Import employee and leave data from Excel and export reports with ease.",
      },
      {
        icon: Globe,
        titleAr: "عربي / إنجليزي بالكامل",
        titleEn: "Full Arabic / English",
        descAr: "واجهة كاملة بالعربية مع دعم RTL، وتبديل فوري للإنجليزية.",
        descEn: "Full Arabic interface with RTL support and instant English switch.",
      },
    ],
  },
];



export default async function FeaturesPage() {
  const locale = await getAppLocale();
  const isAr = locale === "ar";
  const p = locale === "en" ? "/en" : "";

  const totalFeatures = featureSections.reduce((sum, s) => sum + s.items.length, 0);

  return (
    <main className="bg-background">
      <MarketingPageHero
        icon={Sparkles}
        badge={isAr ? "منصة موارد بشرية متكاملة" : "All-in-one HR platform"}
        title={isAr ? "كل ما تحتاجه في مكان واحد" : "Everything you need, in one place"}
        description={
          isAr
            ? "من إدارة الموظفين إلى الرواتب والحضور والأداء، طاقم يجمع احتياجات التشغيل اليومية في هيكل واضح وسهل التوسع."
            : "From employee management to payroll, attendance, and performance, Taqam brings your day-to-day HR operations into one scalable workflow."
        }
        actions={[
          { href: `${p}/request-demo`, label: isAr ? "طلب عرض تجريبي" : "Request a demo", variant: "brand" },
          { href: `${p}/pricing`, label: isAr ? "عرض الأسعار" : "View pricing", variant: "outline" },
        ]}
        stats={[
          { value: `${totalFeatures}+`, label: isAr ? "ميزة" : "Features" },
          { value: `${featureSections.length}`, label: isAr ? "وحدة" : "Modules" },
          { value: "1", label: isAr ? "منصة" : "Platform" },
        ]}
      />

      {/* FEATURE SECTIONS */}
      {featureSections.map((section, sIdx) => {
        const SectionIcon = section.items[0].icon;

        return (
          <section
            key={section.titleEn}
            className={`border-t py-16 ${sIdx % 2 === 1 ? "bg-muted/30" : "bg-background"}`}
          >
            <div className="container mx-auto px-4">
              <div className="mb-10 flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <SectionIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{isAr ? section.titleAr : section.titleEn}</h2>
                  <p className="text-sm text-muted-foreground">{isAr ? section.titleEn : section.titleAr}</p>
                </div>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {section.items.map((item) => (
                  <Card key={item.titleEn} className="group transition-shadow hover:shadow-md">
                    <CardHeader>
                      <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                        <item.icon className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-base">{isAr ? item.titleAr : item.titleEn}</CardTitle>
                      <CardDescription className="text-xs">{isAr ? item.titleEn : item.titleAr}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {isAr ? item.descAr : item.descEn}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        );
      })}

      <MarketingPageCta
        title={isAr ? "جاهز تبدأ؟" : "Ready to get started?"}
        description={
          isAr
            ? "خلّينا نجهّز لك Demo سريع ونضبط المسار حسب حجم الشركة والوحدات التي تحتاجها أولًا."
            : "Let us prepare a focused demo and shape the rollout around your company size and the modules you want first."
        }
        primaryAction={{ href: `${p}/request-demo`, label: isAr ? "طلب عرض تجريبي مجاني" : "Request a free demo" }}
        secondaryAction={{ href: `${p}/plans`, label: isAr ? "تفاصيل الباقات" : "See plan details" }}
      />
    </main>
  );
}
