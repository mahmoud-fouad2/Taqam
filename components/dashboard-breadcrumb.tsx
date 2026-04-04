"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useClientLocale } from "@/lib/i18n/use-client-locale";

/** Map of URL segment → { ar, en } label */
const SEGMENT_LABELS: Record<string, { ar: string; en: string }> = {
  dashboard: { ar: "الرئيسية", en: "Dashboard" },
  employees: { ar: "الموظفون", en: "Employees" },
  departments: { ar: "الأقسام", en: "Departments" },
  "job-titles": { ar: "المسميات الوظيفية", en: "Job Titles" },
  organization: { ar: "الهيكل التنظيمي", en: "Organization" },
  users: { ar: "المستخدمون", en: "Users" },
  "job-postings": { ar: "الوظائف الشاغرة", en: "Job Postings" },
  applicants: { ar: "المتقدمون", en: "Applicants" },
  "job-offers": { ar: "العروض الوظيفية", en: "Job Offers" },
  interviews: { ar: "المقابلات", en: "Interviews" },
  attendance: { ar: "الحضور والانصراف", en: "Attendance" },
  "leave-requests": { ar: "طلبات الإجازات", en: "Leave Requests" },
  "leave-types": { ar: "أنواع الإجازات", en: "Leave Types" },
  "leave-calendar": { ar: "تقويم الإجازات", en: "Leave Calendar" },
  calendar: { ar: "التقويم", en: "Calendar" },
  payroll: { ar: "الرواتب", en: "Payroll" },
  "salary-structures": { ar: "هياكل الرواتب", en: "Salary Structures" },
  requests: { ar: "الطلبات", en: "Requests" },
  "my-requests": { ar: "طلباتي", en: "My Requests" },
  evaluations: { ar: "التقييمات", en: "Evaluations" },
  "employee-evaluations": { ar: "تقييمات الموظفين", en: "Employee Evaluations" },
  "evaluation-templates": { ar: "قوالب التقييم", en: "Evaluation Templates" },
  performance: { ar: "الأداء", en: "Performance" },
  onboarding: { ar: "الاستقبال الوظيفي", en: "Onboarding" },
  "development-plans": { ar: "خطط التطوير", en: "Development Plans" },
  academy: { ar: "الأكاديمية", en: "Academy" },
  analytics: { ar: "التحليلات", en: "Analytics" },
  reports: { ar: "التقارير", en: "Reports" },
  "payroll-reports": { ar: "تقارير الرواتب", en: "Payroll Reports" },
  "performance-reports": { ar: "تقارير الأداء", en: "Performance Reports" },
  support: { ar: "الدعم الفني", en: "Support" },
  "help-center": { ar: "مركز المساعدة", en: "Help Center" },
  "whats-new": { ar: "ما الجديد؟", en: "What's New" },
  ideas: { ar: "الأفكار والمقترحات", en: "Ideas" },
  settings: { ar: "الإعدادات", en: "Settings" },
  "settings-advanced": { ar: "إعدادات متقدمة", en: "Advanced Settings" },
  "audit-logs": { ar: "سجلات المراجعة", en: "Audit Logs" },
  import: { ar: "استيراد البيانات", en: "Import Data" },
  "my-profile": { ar: "ملفي الشخصي", en: "My Profile" },
  account: { ar: "الحساب", en: "Account" },
  "change-password": { ar: "تغيير كلمة المرور", en: "Change Password" },
  "change-email": { ar: "تغيير البريد الإلكتروني", en: "Change Email" },
  "super-admin": { ar: "إدارة المنصة", en: "Platform Admin" },
  tenants: { ar: "الشركات", en: "Tenants" },
  pricing: { ar: "الأسعار والباقات", en: "Pricing & Plans" },
  new: { ar: "إضافة جديد", en: "New" },
  edit: { ar: "تعديل", en: "Edit" },
};

function label(segment: string, locale: "ar" | "en"): string {
  return SEGMENT_LABELS[segment]?.[locale] ?? segment;
}

export function DashboardBreadcrumb() {
  const locale = useClientLocale("ar") as "ar" | "en";
  const pathname = usePathname();
  const isRTL = locale === "ar";
  const SepIcon = isRTL ? ChevronLeft : ChevronRight;

  // Strip /en prefix if present, then split on "/"
  const clean = pathname.replace(/^\/en/, "");
  const segments = clean.split("/").filter(Boolean); // ["dashboard", "employees", "123"]

  // Build crumbs — skip UUIDs/numeric IDs from display label but include in href
  type Crumb = { label: string; href: string };
  const crumbs: Crumb[] = [];
  const prefix = locale === "en" ? "/en" : "";

  let accumulated = prefix;
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]!;
    accumulated += `/${seg}`;
    const isUuidOrId = /^[0-9a-f-]{8,}$|^\d+$/.test(seg);
    crumbs.push({
      label: isUuidOrId ? "..." : label(seg, locale),
      href: accumulated,
    });
  }

  if (crumbs.length <= 1) return null; // On the root dashboard page, no breadcrumb needed

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <BreadcrumbItem key={crumb.href}>
              {isLast ? (
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              ) : (
                <>
                  <BreadcrumbLink asChild>
                    <Link href={crumb.href}>{crumb.label}</Link>
                  </BreadcrumbLink>
                  <BreadcrumbSeparator>
                    <SepIcon className="h-3.5 w-3.5" />
                  </BreadcrumbSeparator>
                </>
              )}
            </BreadcrumbItem>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
