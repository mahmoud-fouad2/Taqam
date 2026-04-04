import type { Metadata } from "next";
import Link from "next/link";

import { Building2, Clock, CreditCard, Globe, Shield, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { marketingMetadata } from "@/lib/marketing/seo";
import { getAppLocale } from "@/lib/i18n/locale";

export async function generateMetadata(): Promise<Metadata> {
  return marketingMetadata({
    path: "/features",
    titleAr: "مميزات طاقم | منصة موارد بشرية ورواتب وحضور",
    titleEn: "Taqam Features | HR, Payroll & Attendance",
    descriptionAr:
      "استكشف مميزات طاقم: إدارة موظفين، حضور وانصراف، رواتب، امتثال سعودي، تقارير، وصلاحيات متعددة داخل نظام متعدد الشركات.",
    descriptionEn:
      "Explore Taqam features: employees, attendance, payroll, Saudi compliance, reports, RBAC, and multi-tenant architecture.",
  });
}

const featureSections = [
  {
    titleAr: "الأساسيات",
    titleEn: "Core",
    items: [
      {
        icon: Users,
        titleAr: "إدارة الموظفين",
        titleEn: "Employee Management",
        descAr: "ملف موظف، بيانات تعيين، حالة، وتتبع تغييرات.",
        descEn: "Employee profile, hiring data, status, and history.",
      },
      {
        icon: Building2,
        titleAr: "هيكل الشركة",
        titleEn: "Org Structure",
        descAr: "أقسام ومسميات وظيفية وتوزيع الموظفين.",
        descEn: "Departments, job titles and employee assignment.",
      },
      {
        icon: Clock,
        titleAr: "الحضور والانصراف",
        titleEn: "Time & Attendance",
        descAr: "سجلات حضور، شِفتات، وتأخيرات.",
        descEn: "Attendance logs, shifts, and tardiness.",
      },
    ],
  },
  {
    titleAr: "الرواتب والامتثال",
    titleEn: "Payroll & Compliance",
    items: [
      {
        icon: CreditCard,
        titleAr: "إدارة الرواتب",
        titleEn: "Payroll",
        descAr: "تشغيل الرواتب، كشوفات، واستحقاقات/استقطاعات.",
        descEn: "Run payroll, payslips, allowances & deductions.",
      },
      {
        icon: Shield,
        titleAr: "امتثال سعودي",
        titleEn: "Saudi Compliance",
        descAr: "تهيئة لتكاملات مثل GOSI/WPS حسب احتياجك.",
        descEn: "Designed for integrations like GOSI/WPS as needed.",
      },
      {
        icon: Globe,
        titleAr: "عربي / إنجليزي",
        titleEn: "Arabic / English",
        descAr: "RTL/LTR وتجربة مناسبة للسوق المحلي.",
        descEn: "RTL/LTR with localized UX.",
      },
    ],
  },
];

export default async function FeaturesPage() {
  const locale = await getAppLocale();
  const isAr = locale === "ar";
  const p = locale === "en" ? "/en" : "";

  return (
    <main className="bg-background">
      <section className="container mx-auto px-4 py-14">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-bold sm:text-4xl">{isAr ? "مميزات طاقم" : "Taqam Features"}</h1>
          <p className="mt-3 text-muted-foreground">
            {isAr
              ? "كل ما تحتاجه لإدارة الموارد البشرية والرواتب والحضور في منصة واحدة."
              : "Everything you need to run HR, payroll and attendance in one platform."}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href={`${p}/pricing`}>
              <Button variant="brandOutline">{isAr ? "عرض الأسعار" : "View pricing"}</Button>
            </Link>
            <Link href={`${p}/request-demo`}>
              <Button variant="brand">{isAr ? "طلب عرض" : "Request a demo"}</Button>
            </Link>
          </div>
        </div>
      </section>

      {featureSections.map((section) => (
        <section key={section.titleEn} className="border-t py-14">
          <div className="container mx-auto px-4">
            <div className="mb-8">
              <h2 className="text-2xl font-bold">{isAr ? section.titleAr : section.titleEn}</h2>
              <p className="text-sm text-muted-foreground">{isAr ? section.titleEn : section.titleAr}</p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {section.items.map((item) => (
                <Card key={item.titleEn}>
                  <CardHeader>
                    <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle>{isAr ? item.titleAr : item.titleEn}</CardTitle>
                    <CardDescription>{isAr ? item.titleEn : item.titleAr}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{isAr ? item.descAr : item.descEn}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      ))}

      <section className="border-t bg-muted/30 py-14">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-bold">{isAr ? "جاهز تبدأ؟" : "Ready to get started?"}</h2>
            <p className="mt-2 text-muted-foreground">
              {isAr ? "خلّينا نعمل Demo ونظبطها حسب شركتك." : "Let’s schedule a demo and tailor it to your company."}
            </p>
            <div className="mt-6">
              <Link href={`${p}/request-demo`}>
                <Button size="lg" variant="brand">{isAr ? "طلب عرض تجريبي" : "Request a demo"}</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
