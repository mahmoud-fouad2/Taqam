"use client"

import * as React from "react"
import {
  IconBriefcase,
  IconChartBar,
  IconDashboard,
  IconFolder,
  IconHelp,
  IconListDetails,
  IconMessageCircle,
  IconUsers,
} from "@tabler/icons-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useClientLocale } from "@/lib/i18n/use-client-locale";
import { isSuperAdminRole } from "@/lib/access-control";

import { LogoMark } from "@/components/logo-mark";
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"


type NavItem = { title: string; url: string; icon: any };

function getNav(locale: "ar" | "en", role?: string): NavItem[] {
  const p = locale === "en" ? "/en" : "";

  if (isSuperAdminRole(role)) {
    return [
      {
        title: locale === "ar" ? "لوحة تحكم السوبر أدمن" : "Super Admin",
        url: `${p}/dashboard/super-admin`,
        icon: IconDashboard,
      },
      {
        title: locale === "ar" ? "طلبات الاشتراك" : "Subscription Requests",
        url: `${p}/dashboard/super-admin/requests`,
        icon: IconListDetails,
      },
      {
        title: locale === "ar" ? "الشركات" : "Tenants",
        url: `${p}/dashboard/super-admin/tenants`,
        icon: IconUsers,
      },
      {
        title: locale === "ar" ? "الأسعار والباقات" : "Pricing & Plans",
        url: `${p}/dashboard/super-admin/pricing`,
        icon: IconChartBar,
      },
      {
        title: locale === "ar" ? "إعدادات المنصة" : "Platform Settings",
        url: `${p}/dashboard/super-admin/settings`,
        icon: IconFolder,
      },
    ];
  }

  if (role === "EMPLOYEE") {
    return [
      {
        title: locale === "ar" ? "الرئيسية" : "Dashboard",
        url: `${p}/dashboard`,
        icon: IconDashboard,
      },
      {
        title: locale === "ar" ? "طلباتي" : "My Requests",
        url: `${p}/dashboard/my-requests`,
        icon: IconListDetails,
      },
      {
        title: locale === "ar" ? "مركز المساعدة" : "Help Center",
        url: `${p}/dashboard/help-center`,
        icon: IconHelp,
      },
      {
        title: locale === "ar" ? "الدعم الفني" : "Support",
        url: `${p}/dashboard/support`,
        icon: IconMessageCircle,
      },
      {
        title: locale === "ar" ? "إعدادات النظام" : "Settings",
        url: `${p}/dashboard/settings`,
        icon: IconFolder,
      },
    ];
  }

  if (role === "MANAGER") {
    return [
      {
        title: locale === "ar" ? "الرئيسية" : "Dashboard",
        url: `${p}/dashboard`,
        icon: IconDashboard,
      },
      {
        title: locale === "ar" ? "الموظفون" : "Employees",
        url: `${p}/dashboard/employees`,
        icon: IconUsers,
      },
      {
        title: locale === "ar" ? "الطلبات" : "Requests",
        url: `${p}/dashboard/requests`,
        icon: IconListDetails,
      },
      {
        title: locale === "ar" ? "طلباتي" : "My Requests",
        url: `${p}/dashboard/my-requests`,
        icon: IconChartBar,
      },
      {
        title: locale === "ar" ? "مركز المساعدة" : "Help Center",
        url: `${p}/dashboard/help-center`,
        icon: IconHelp,
      },
      {
        title: locale === "ar" ? "الدعم الفني" : "Support",
        url: `${p}/dashboard/support`,
        icon: IconMessageCircle,
      },
      {
        title: locale === "ar" ? "إعدادات النظام" : "Settings",
        url: `${p}/dashboard/settings`,
        icon: IconFolder,
      },
    ];
  }

  if (role === "HR_MANAGER") {
    return [
      {
        title: locale === "ar" ? "الرئيسية" : "Dashboard",
        url: `${p}/dashboard`,
        icon: IconDashboard,
      },
      {
        title: locale === "ar" ? "الموظفون" : "Employees",
        url: `${p}/dashboard/employees`,
        icon: IconUsers,
      },
      {
        title: locale === "ar" ? "الأقسام" : "Departments",
        url: `${p}/dashboard/departments`,
        icon: IconFolder,
      },
      {
        title: locale === "ar" ? "المسميات الوظيفية" : "Job Titles",
        url: `${p}/dashboard/job-titles`,
        icon: IconBriefcase,
      },
      {
        title: locale === "ar" ? "المستخدمون" : "Users",
        url: `${p}/dashboard/users`,
        icon: IconUsers,
      },
      {
        title: locale === "ar" ? "الطلبات" : "Requests",
        url: `${p}/dashboard/requests`,
        icon: IconListDetails,
      },
      {
        title: locale === "ar" ? "التقارير" : "Reports",
        url: `${p}/dashboard/reports`,
        icon: IconChartBar,
      },
      {
        title: locale === "ar" ? "مركز المساعدة" : "Help Center",
        url: `${p}/dashboard/help-center`,
        icon: IconHelp,
      },
      {
        title: locale === "ar" ? "الدعم الفني" : "Support",
        url: `${p}/dashboard/support`,
        icon: IconMessageCircle,
      },
      {
        title: locale === "ar" ? "إعدادات النظام" : "Settings",
        url: `${p}/dashboard/settings`,
        icon: IconFolder,
      },
    ];
  }

  return [
    {
      title: locale === "ar" ? "الرئيسية" : "Dashboard",
      url: `${p}/dashboard`,
      icon: IconDashboard,
    },
    {
      title: locale === "ar" ? "الموظفون" : "Employees",
      url: `${p}/dashboard/employees`,
      icon: IconChartBar,
    },
    {
      title: locale === "ar" ? "الأقسام" : "Departments",
      url: `${p}/dashboard/departments`,
      icon: IconFolder,
    },
    {
      title: locale === "ar" ? "المسميات الوظيفية" : "Job Titles",
      url: `${p}/dashboard/job-titles`,
      icon: IconFolder,
    },
    {
      title: locale === "ar" ? "الهيكل التنظيمي" : "Organization",
      url: `${p}/dashboard/organization`,
      icon: IconFolder,
    },
    {
      title: locale === "ar" ? "المستخدمون" : "Users",
      url: `${p}/dashboard/users`,
      icon: IconUsers,
    },
    {
      title: locale === "ar" ? "الوظائف الشاغرة" : "Job Postings",
      url: `${p}/dashboard/job-postings`,
      icon: IconListDetails,
    },
    {
      title: locale === "ar" ? "المتقدمون" : "Applicants",
      url: `${p}/dashboard/applicants`,
      icon: IconUsers,
    },
    {
      title: locale === "ar" ? "العروض الوظيفية" : "Job Offers",
      url: `${p}/dashboard/job-offers`,
      icon: IconBriefcase,
    },
    {
      title: locale === "ar" ? "مركز المساعدة" : "Help Center",
      url: `${p}/dashboard/help-center`,
      icon: IconHelp,
    },
    {
      title: locale === "ar" ? "الدعم الفني" : "Support",
      url: `${p}/dashboard/support`,
      icon: IconMessageCircle,
    },
    {
      title: locale === "ar" ? "إعدادات النظام" : "Settings",
      url: `${p}/dashboard/settings`,
      icon: IconUsers,
    },
  ];
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const locale = useClientLocale("ar");
  const p = locale === "en" ? "/en" : "";
  const { data: session } = useSession();
  const [role, setRole] = React.useState<string | undefined>(undefined);
  const [user, setUser] = React.useState<{ name: string; email: string; avatar: string } | null>(null);

  React.useEffect(() => {
    const sUser = session?.user as any;
    setRole(sUser?.role);
    const name = sUser?.name || `${sUser?.firstName || ""} ${sUser?.lastName || ""}`.trim() || "User";
    const email = sUser?.email || "";
    const avatar = sUser?.avatar || "/images/avatars/1.png";
    setUser(sUser ? { name, email, avatar } : null);
  }, [session]);

  const navItems = React.useMemo(() => getNav(locale, role), [locale, role]);
  const homeUrl = isSuperAdminRole(role) ? `${p}/dashboard/super-admin` : `${p}/dashboard`;
  const workspaceLabel = isSuperAdminRole(role)
    ? locale === "ar"
      ? "إدارة المنصة"
      : "Platform Admin"
    : locale === "ar"
      ? "مساحة الشركة"
      : "Tenant Workspace";

  return (
    <Sidebar collapsible="icon" className="dashboard-app-sidebar" {...props}>
      <SidebarHeader className="px-2 pt-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              className="rounded-xl border border-sidebar-border/70 bg-sidebar-accent/40 !p-2 shadow-sm transition-all hover:bg-sidebar-accent"
            >
              <Link href={homeUrl}>
                <LogoMark
                  frameClassName="size-9 rounded-lg border border-sidebar-border/60 bg-sidebar p-1 shadow-sm"
                  imageClassName="h-[18px]"
                />
                <div className="grid flex-1 text-start text-sm leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate font-bold tracking-tight">طاقم</span>
                  <span className="truncate text-xs text-sidebar-foreground/65">{workspaceLabel}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="px-1">
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border/70 px-2 pb-2 pt-2">
        {user ? <NavUser user={user} /> : null}
      </SidebarFooter>
    </Sidebar>
  )
}
