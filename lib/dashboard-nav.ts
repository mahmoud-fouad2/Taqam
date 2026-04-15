import type { Icon } from "@tabler/icons-react";
import {
  IconBriefcase,
  IconChartBar,
  IconClock,
  IconDashboard,
  IconFolder,
  IconListDetails,
  IconUsers
} from "@tabler/icons-react";

import { isSuperAdminRole } from "@/lib/access-control";
import type { AppLocale } from "@/lib/i18n/types";

export type DashboardNavDefinition = {
  id: string;
  title: { ar: string; en: string };
  url: string;
  icon: Icon;
};

export type DashboardNavItem = {
  title: string;
  url: string;
  icon: Icon;
};

const SUPER_ADMIN_NAV: DashboardNavDefinition[] = [
  {
    id: "platform-dashboard",
    title: { ar: "لوحة المنصة", en: "Platform dashboard" },
    url: "/dashboard/super-admin",
    icon: IconDashboard
  },
  {
    id: "global-insights",
    title: { ar: "الرؤى الشاملة", en: "Global insights" },
    url: "/dashboard/super-admin/insights",
    icon: IconChartBar
  },
  {
    id: "subscription-requests",
    title: { ar: "طلبات الاشتراك", en: "Subscription requests" },
    url: "/dashboard/super-admin/requests",
    icon: IconListDetails
  },
  {
    id: "tenants",
    title: { ar: "الشركات والعملاء", en: "Tenants and customers" },
    url: "/dashboard/super-admin/tenants",
    icon: IconUsers
  },
  {
    id: "job-title-library",
    title: { ar: "مكتبة المسميات", en: "Job title library" },
    url: "/dashboard/super-admin/job-titles",
    icon: IconBriefcase
  },
  {
    id: "pricing",
    title: { ar: "الأسعار والباقات", en: "Pricing and plans" },
    url: "/dashboard/super-admin/pricing",
    icon: IconBriefcase
  },
  {
    id: "feature-catalog",
    title: { ar: "Feature Catalog", en: "Feature catalog" },
    url: "/dashboard/super-admin/feature-catalog",
    icon: IconListDetails
  },
  {
    id: "content-seo",
    title: { ar: "المحتوى والسيو", en: "Content and SEO" },
    url: "/dashboard/super-admin/content",
    icon: IconFolder
  },
  {
    id: "platform-settings",
    title: { ar: "إعدادات المنصة", en: "Platform settings" },
    url: "/dashboard/super-admin/settings",
    icon: IconFolder
  }
];

const EMPLOYEE_NAV: DashboardNavDefinition[] = [
  {
    id: "dashboard",
    title: { ar: "الرئيسية", en: "Dashboard" },
    url: "/dashboard",
    icon: IconDashboard
  },
  {
    id: "my-requests",
    title: { ar: "طلباتي", en: "My Requests" },
    url: "/dashboard/my-requests",
    icon: IconListDetails
  },
  {
    id: "attendance",
    title: { ar: "الحضور والانصراف", en: "Attendance" },
    url: "/dashboard/attendance",
    icon: IconClock
  },
  {
    id: "settings",
    title: { ar: "إعدادات النظام", en: "Settings" },
    url: "/dashboard/settings",
    icon: IconFolder
  }
];

const MANAGER_NAV: DashboardNavDefinition[] = [
  {
    id: "dashboard",
    title: { ar: "الرئيسية", en: "Dashboard" },
    url: "/dashboard",
    icon: IconDashboard
  },
  {
    id: "employees",
    title: { ar: "الموظفون", en: "Employees" },
    url: "/dashboard/employees",
    icon: IconUsers
  },
  {
    id: "organization",
    title: { ar: "الهيكل التنظيمي", en: "Organization" },
    url: "/dashboard/organization",
    icon: IconFolder
  },
  {
    id: "attendance",
    title: { ar: "الحضور والانصراف", en: "Attendance" },
    url: "/dashboard/attendance",
    icon: IconClock
  },
  {
    id: "requests",
    title: { ar: "الطلبات", en: "Requests" },
    url: "/dashboard/requests",
    icon: IconListDetails
  },
  {
    id: "my-requests",
    title: { ar: "طلباتي", en: "My Requests" },
    url: "/dashboard/my-requests",
    icon: IconChartBar
  },
  {
    id: "settings",
    title: { ar: "إعدادات النظام", en: "Settings" },
    url: "/dashboard/settings",
    icon: IconFolder
  }
];

const HR_MANAGER_NAV: DashboardNavDefinition[] = [
  {
    id: "dashboard",
    title: { ar: "الرئيسية", en: "Dashboard" },
    url: "/dashboard",
    icon: IconDashboard
  },
  {
    id: "employees",
    title: { ar: "الموظفون", en: "Employees" },
    url: "/dashboard/employees",
    icon: IconUsers
  },
  {
    id: "departments",
    title: { ar: "الأقسام", en: "Departments" },
    url: "/dashboard/departments",
    icon: IconFolder
  },
  {
    id: "organization",
    title: { ar: "الهيكل التنظيمي", en: "Organization" },
    url: "/dashboard/organization",
    icon: IconFolder
  },
  {
    id: "users",
    title: { ar: "المستخدمون", en: "Users" },
    url: "/dashboard/users",
    icon: IconUsers
  },
  {
    id: "attendance",
    title: { ar: "الحضور والانصراف", en: "Attendance" },
    url: "/dashboard/attendance",
    icon: IconClock
  },
  {
    id: "requests",
    title: { ar: "الطلبات", en: "Requests" },
    url: "/dashboard/requests",
    icon: IconListDetails
  },
  {
    id: "reports",
    title: { ar: "التقارير", en: "Reports" },
    url: "/dashboard/reports",
    icon: IconChartBar
  },
  {
    id: "settings",
    title: { ar: "إعدادات النظام", en: "Settings" },
    url: "/dashboard/settings",
    icon: IconFolder
  }
];

const TENANT_ADMIN_NAV: DashboardNavDefinition[] = [
  {
    id: "dashboard",
    title: { ar: "الرئيسية", en: "Dashboard" },
    url: "/dashboard",
    icon: IconDashboard
  },
  {
    id: "employees",
    title: { ar: "الموظفون", en: "Employees" },
    url: "/dashboard/employees",
    icon: IconChartBar
  },
  {
    id: "departments",
    title: { ar: "الأقسام", en: "Departments" },
    url: "/dashboard/departments",
    icon: IconFolder
  },
  {
    id: "organization",
    title: { ar: "الهيكل التنظيمي", en: "Organization" },
    url: "/dashboard/organization",
    icon: IconFolder
  },
  {
    id: "users",
    title: { ar: "المستخدمون", en: "Users" },
    url: "/dashboard/users",
    icon: IconUsers
  },
  {
    id: "attendance",
    title: { ar: "الحضور والانصراف", en: "Attendance" },
    url: "/dashboard/attendance",
    icon: IconClock
  },
  {
    id: "job-postings",
    title: { ar: "الوظائف الشاغرة", en: "Job Postings" },
    url: "/dashboard/job-postings",
    icon: IconListDetails
  },
  {
    id: "applicants",
    title: { ar: "المتقدمون", en: "Applicants" },
    url: "/dashboard/applicants",
    icon: IconUsers
  },
  {
    id: "job-offers",
    title: { ar: "العروض الوظيفية", en: "Job Offers" },
    url: "/dashboard/job-offers",
    icon: IconBriefcase
  },
  {
    id: "settings",
    title: { ar: "إعدادات النظام", en: "Settings" },
    url: "/dashboard/settings",
    icon: IconFolder
  }
];

export function getDashboardNavDefinitions(role?: string): DashboardNavDefinition[] {
  if (isSuperAdminRole(role)) {
    return SUPER_ADMIN_NAV;
  }

  if (role === "EMPLOYEE") {
    return EMPLOYEE_NAV;
  }

  if (role === "MANAGER") {
    return MANAGER_NAV;
  }

  if (role === "HR_MANAGER") {
    return HR_MANAGER_NAV;
  }

  return TENANT_ADMIN_NAV;
}

export function getDashboardNav(locale: AppLocale, role?: string): DashboardNavItem[] {
  return getDashboardNavDefinitions(role).map((item) => ({
    title: item.title[locale],
    url: item.url,
    icon: item.icon
  }));
}