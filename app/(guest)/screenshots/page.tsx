import type { Metadata } from "next";
import { marketingMetadata } from "@/lib/marketing/seo";
import { MarketingPageCta } from "@/components/marketing/page-cta";
import { ScreenshotsGallery } from "./gallery";
import { getAppLocale } from "@/lib/i18n/locale";
import { LayoutDashboard, Users, DollarSign, Clock, BarChart3, Smartphone } from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  return marketingMetadata({
    path: "/screenshots",
    titleAr: "استعراض النظام | طاقم",
    titleEn: "Product Tour | Taqam",
    descriptionAr: "معرض لواجهات طاقم: لوحة التحكم، الموظفين، الحضور، والرواتب.",
    descriptionEn: "A guided UI tour of Taqam: dashboard, employees, attendance, and payroll.",
  });
}

const desktopShots = [
  {
    src: "/images/marketing/screenshot-reports.svg?v=2",
    titleAr: "لوحة التحكم",
    titleEn: "Dashboard",
    badgeAr: "HR",
    badgeEn: "HR",
    badgeColor: "indigo" as const,
  },
  {
    src: "/images/marketing/screenshot-analytics.svg?v=2",
    titleAr: "التقارير والتحليلات",
    titleEn: "Reports & insights",
    badgeAr: "تقارير",
    badgeEn: "Reports",
    badgeColor: "orange" as const,
  },
  {
    src: "/images/marketing/screenshot-dashboard.svg?v=2",
    titleAr: "لوحة التحكم الرئيسية",
    titleEn: "Main Dashboard",
    badgeAr: "لوحة التحكم",
    badgeEn: "Dashboard",
    badgeColor: "indigo" as const,
  },
  {
    src: "/images/marketing/screenshot-employees.svg?v=2",
    titleAr: "إدارة الموظفين",
    titleEn: "Employee Management",
    badgeAr: "موارد بشرية",
    badgeEn: "HR",
    badgeColor: "blue" as const,
  },
  {
    src: "/images/marketing/screenshot-payroll-new.svg?v=2",
    titleAr: "كشف الرواتب",
    titleEn: "Payroll Processing",
    badgeAr: "رواتب",
    badgeEn: "Payroll",
    badgeColor: "purple" as const,
  },
];

const mobileShots = [
  {
    src: "/images/marketing/mobile-dashboard.svg",
    titleAr: "لوحة التحكم — جوال",
    titleEn: "Dashboard — Mobile",
    badgeAr: "لوحة التحكم",
    badgeEn: "Dashboard",
    badgeColor: "indigo" as const,
  },
  {
    src: "/images/marketing/mobile-employees.svg",
    titleAr: "الموظفون — جوال",
    titleEn: "Employees — Mobile",
    badgeAr: "موارد بشرية",
    badgeEn: "HR",
    badgeColor: "blue" as const,
  },
  {
    src: "/images/marketing/mobile-payroll.svg",
    titleAr: "الرواتب — جوال",
    titleEn: "Payroll — Mobile",
    badgeAr: "رواتب",
    badgeEn: "Payroll",
    badgeColor: "purple" as const,
  },
];

const features = [
  {
    icon: LayoutDashboard,
    color: "text-indigo-600 bg-indigo-500/10",
    labelAr: "لوحة تحكم ذكية",
    labelEn: "Smart Dashboard",
    descAr: "إحصائيات حية وتنبيهات فورية",
    descEn: "Live stats & instant alerts",
  },
  {
    icon: Users,
    color: "text-blue-600 bg-blue-500/10",
    labelAr: "إدارة الموظفين",
    labelEn: "Employee Management",
    descAr: "ملفات شاملة وصلاحيات مرنة",
    descEn: "Full profiles & flexible roles",
  },
  {
    icon: Clock,
    color: "text-green-600 bg-green-500/10",
    labelAr: "الحضور والانصراف",
    labelEn: "Attendance Tracking",
    descAr: "تسجيل يومي وتقارير غياب",
    descEn: "Daily tracking & absence reports",
  },
  {
    icon: DollarSign,
    color: "text-purple-600 bg-purple-500/10",
    labelAr: "معالجة الرواتب",
    labelEn: "Payroll Processing",
    descAr: "احتساب تلقائي وصرف دفعي",
    descEn: "Auto-calculate & bulk payment",
  },
  {
    icon: BarChart3,
    color: "text-orange-600 bg-orange-500/10",
    labelAr: "التقارير والتحليلات",
    labelEn: "Reports & Analytics",
    descAr: "رسوم بيانية وتصدير Excel",
    descEn: "Charts & Excel export",
  },
  {
    icon: Smartphone,
    color: "text-teal-600 bg-teal-500/10",
    labelAr: "تطبيق الجوال",
    labelEn: "Mobile App",
    descAr: "تجربة ميدانية للموظف والمدير",
    descEn: "Mobile workflows for employees and managers",
  },
];

export default async function ScreenshotsPage() {
  const locale = await getAppLocale();
  const isAr = locale === "ar";
  const p = locale === "en" ? "/en" : "";

  return (
    <main className="bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-indigo-50/60 via-background to-background dark:from-indigo-950/20">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-32 start-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-indigo-500/8 blur-3xl" />
          <div className="absolute -bottom-20 end-0 h-[400px] w-[400px] rounded-full bg-blue-500/8 blur-3xl" />
          <div className="absolute top-1/2 start-0 h-[300px] w-[300px] -translate-y-1/2 rounded-full bg-purple-500/6 blur-3xl" />
        </div>

        <div className="container mx-auto px-4 pb-0 pt-16">
          {/* Badge */}
          <div className="flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-xs font-semibold text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300">
              <span className="size-1.5 rounded-full bg-indigo-500" />
              {isAr ? "جولة تفاعلية في المنصة" : "Interactive Platform Tour"}
            </span>
          </div>

          {/* Heading */}
          <div className="mx-auto mt-5 max-w-3xl text-center">
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
              {isAr ? (
                <>
                  شاهد{" "}
                  <span className="bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent">
                    طاقم
                  </span>{" "}
                  في العمل
                </>
              ) : (
                <>
                  See{" "}
                  <span className="bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent">
                    Taqam
                  </span>{" "}
                  in action
                </>
              )}
            </h1>
            <p className="mt-4 text-base text-muted-foreground sm:text-lg">
              {isAr
                ? "استعرض واجهات المنصة بالتفصيل — من لوحة التحكم إلى الرواتب. اضغط على أي لقطة للتكبير."
                : "Explore every corner of the platform — from the dashboard to payroll. Click any screenshot to zoom in."}
            </p>
          </div>

          {/* Stats row */}
          <div className="mx-auto mt-8 grid max-w-2xl grid-cols-3 gap-3 rounded-2xl border bg-background/80 p-3 text-center shadow-sm backdrop-blur-sm sm:gap-4 sm:p-4">
            <div className="rounded-xl bg-muted/40 px-3 py-4">
              <p className="text-2xl font-bold text-foreground">٨+</p>
              <p className="text-xs text-muted-foreground">{isAr ? "لقطات شاشة" : "Screenshots"}</p>
            </div>
            <div className="rounded-xl bg-muted/40 px-3 py-4">
              <p className="text-2xl font-bold text-foreground">٦</p>
              <p className="text-xs text-muted-foreground">{isAr ? "وحدات وظيفية" : "Feature modules"}</p>
            </div>
            <div className="rounded-xl bg-muted/40 px-3 py-4">
              <p className="text-2xl font-bold text-foreground">٢</p>
              <p className="text-xs text-muted-foreground">{isAr ? "منصة (ويب + جوال)" : "Platforms (web + mobile)"}</p>
            </div>
          </div>

          {/* Feature highlights */}
          <div className="mx-auto mt-10 grid max-w-5xl grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {features.map((f) => (
              <div
                key={f.labelEn}
                className="flex flex-col items-center gap-2 rounded-2xl border border-border/70 bg-background/80 p-3.5 text-center shadow-sm backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className={`flex size-9 items-center justify-center rounded-lg ${f.color}`}>
                  <f.icon className="size-4" />
                </div>
                <p className="text-xs font-semibold leading-tight text-foreground">
                  {isAr ? f.labelAr : f.labelEn}
                </p>
                <p className="text-[10px] leading-tight text-muted-foreground">
                  {isAr ? f.descAr : f.descEn}
                </p>
              </div>
            ))}
          </div>

          {/* Gallery */}
          <ScreenshotsGallery locale={locale} desktop={desktopShots} mobile={mobileShots} />
        </div>
      </section>

      <MarketingPageCta
        title={isAr ? "هل تريد رؤية نفس المسارات على شركتك؟" : "Want to see the same flows on your company data?"}
        description={
          isAr
            ? "نرتب لك Demo عملي مبني على عدد الموظفين، الرواتب، والحضور داخل شركتك بدل مجرد استعراض عام للواجهة."
            : "We can run a practical demo around your employee count, payroll flow, and attendance setup instead of just a generic UI tour."
        }
        primaryAction={{ href: `${p}/request-demo`, label: isAr ? "احجز عرضًا عمليًا" : "Book a practical demo" }}
        secondaryAction={{ href: `${p}/pricing`, label: isAr ? "راجع الأسعار" : "Review pricing" }}
      />
    </main>
  );
}
