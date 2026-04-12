"use client";

import * as React from "react";
import {
  type Icon,
  IconBriefcase,
  IconChartBar,
  IconClock,
  IconDashboard,
  IconFolder,
  IconListDetails,
  IconUsers
} from "@tabler/icons-react";
import Link from "next/link";
import { useSession } from "next-auth/react";

import { isSuperAdminRole } from "@/lib/access-control";
import { useClientLocale } from "@/lib/i18n/use-client-locale";
import { LogoMark } from "@/components/logo-mark";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from "@/components/ui/sidebar";

type NavItem = {
  title: string;
  url: string;
  icon: Icon;
};

function getNav(locale: "ar" | "en", role?: string): NavItem[] {
  if (isSuperAdminRole(role)) {
    return [
      {
        title: locale === "ar" ? "لوحة المنصة" : "Platform dashboard",
        url: "/dashboard/super-admin",
        icon: IconDashboard
      },
      {
        title: locale === "ar" ? "الرؤى الشاملة" : "Global insights",
        url: "/dashboard/super-admin/insights",
        icon: IconChartBar
      },
      {
        title: locale === "ar" ? "طلبات الاشتراك" : "Subscription requests",
        url: "/dashboard/super-admin/requests",
        icon: IconListDetails
      },
      {
        title: locale === "ar" ? "الشركات والعملاء" : "Tenants and customers",
        url: "/dashboard/super-admin/tenants",
        icon: IconUsers
      },
      {
        title: locale === "ar" ? "الأسعار والباقات" : "Pricing and plans",
        url: "/dashboard/super-admin/pricing",
        icon: IconBriefcase
      },
      {
        title: locale === "ar" ? "المحتوى والسيو" : "Content and SEO",
        url: "/dashboard/super-admin/content",
        icon: IconFolder
      },
      {
        title: locale === "ar" ? "إعدادات المنصة" : "Platform settings",
        url: "/dashboard/super-admin/settings",
        icon: IconFolder
      }
    ];
  }

  if (role === "EMPLOYEE") {
    return [
      {
        title: locale === "ar" ? "الرئيسية" : "Dashboard",
        url: "/dashboard",
        icon: IconDashboard
      },
      {
        title: locale === "ar" ? "طلباتي" : "My Requests",
        url: "/dashboard/my-requests",
        icon: IconListDetails
      },
      {
        title: locale === "ar" ? "الحضور والانصراف" : "Attendance",
        url: "/dashboard/attendance",
        icon: IconClock
      },
      {
        title: locale === "ar" ? "إعدادات النظام" : "Settings",
        url: "/dashboard/settings",
        icon: IconFolder
      }
    ];
  }

  if (role === "MANAGER") {
    return [
      {
        title: locale === "ar" ? "الرئيسية" : "Dashboard",
        url: "/dashboard",
        icon: IconDashboard
      },
      {
        title: locale === "ar" ? "الموظفون" : "Employees",
        url: "/dashboard/employees",
        icon: IconUsers
      },
      {
        title: locale === "ar" ? "الهيكل التنظيمي" : "Organization",
        url: "/dashboard/organization",
        icon: IconFolder
      },
      {
        title: locale === "ar" ? "الحضور والانصراف" : "Attendance",
        url: "/dashboard/attendance",
        icon: IconClock
      },
      {
        title: locale === "ar" ? "الطلبات" : "Requests",
        url: "/dashboard/requests",
        icon: IconListDetails
      },
      {
        title: locale === "ar" ? "طلباتي" : "My Requests",
        url: "/dashboard/my-requests",
        icon: IconChartBar
      },
      {
        title: locale === "ar" ? "إعدادات النظام" : "Settings",
        url: "/dashboard/settings",
        icon: IconFolder
      }
    ];
  }

  if (role === "HR_MANAGER") {
    return [
      {
        title: locale === "ar" ? "الرئيسية" : "Dashboard",
        url: "/dashboard",
        icon: IconDashboard
      },
      {
        title: locale === "ar" ? "الموظفون" : "Employees",
        url: "/dashboard/employees",
        icon: IconUsers
      },
      {
        title: locale === "ar" ? "الأقسام" : "Departments",
        url: "/dashboard/departments",
        icon: IconFolder
      },
      {
        title: locale === "ar" ? "الهيكل التنظيمي" : "Organization",
        url: "/dashboard/organization",
        icon: IconFolder
      },
      {
        title: locale === "ar" ? "المسميات الوظيفية" : "Job Titles",
        url: "/dashboard/job-titles",
        icon: IconBriefcase
      },
      {
        title: locale === "ar" ? "المستخدمون" : "Users",
        url: "/dashboard/users",
        icon: IconUsers
      },
      {
        title: locale === "ar" ? "الحضور والانصراف" : "Attendance",
        url: "/dashboard/attendance",
        icon: IconClock
      },
      {
        title: locale === "ar" ? "الطلبات" : "Requests",
        url: "/dashboard/requests",
        icon: IconListDetails
      },
      {
        title: locale === "ar" ? "التقارير" : "Reports",
        url: "/dashboard/reports",
        icon: IconChartBar
      },
      {
        title: locale === "ar" ? "إعدادات النظام" : "Settings",
        url: "/dashboard/settings",
        icon: IconFolder
      }
    ];
  }

  return [
    {
      title: locale === "ar" ? "الرئيسية" : "Dashboard",
      url: "/dashboard",
      icon: IconDashboard
    },
    {
      title: locale === "ar" ? "الموظفون" : "Employees",
      url: "/dashboard/employees",
      icon: IconChartBar
    },
    {
      title: locale === "ar" ? "الأقسام" : "Departments",
      url: "/dashboard/departments",
      icon: IconFolder
    },
    {
      title: locale === "ar" ? "المسميات الوظيفية" : "Job Titles",
      url: "/dashboard/job-titles",
      icon: IconFolder
    },
    {
      title: locale === "ar" ? "الهيكل التنظيمي" : "Organization",
      url: "/dashboard/organization",
      icon: IconFolder
    },
    {
      title: locale === "ar" ? "المستخدمون" : "Users",
      url: "/dashboard/users",
      icon: IconUsers
    },
    {
      title: locale === "ar" ? "الحضور والانصراف" : "Attendance",
      url: "/dashboard/attendance",
      icon: IconClock
    },
    {
      title: locale === "ar" ? "الوظائف الشاغرة" : "Job Postings",
      url: "/dashboard/job-postings",
      icon: IconListDetails
    },
    {
      title: locale === "ar" ? "المتقدمون" : "Applicants",
      url: "/dashboard/applicants",
      icon: IconUsers
    },
    {
      title: locale === "ar" ? "العروض الوظيفية" : "Job Offers",
      url: "/dashboard/job-offers",
      icon: IconBriefcase
    },
    {
      title: locale === "ar" ? "إعدادات النظام" : "Settings",
      url: "/dashboard/settings",
      icon: IconFolder
    }
  ];
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const locale = useClientLocale("ar");
  const { data: session } = useSession();
  const [role, setRole] = React.useState<string | undefined>(undefined);
  const [user, setUser] = React.useState<{ name: string; email: string; avatar: string } | null>(
    null
  );

  React.useEffect(() => {
    const sessionUser = session?.user as
      | {
          role?: string;
          name?: string;
          firstName?: string;
          lastName?: string;
          email?: string;
          avatar?: string;
        }
      | undefined;

    setRole(sessionUser?.role);

    const name =
      sessionUser?.name ||
      `${sessionUser?.firstName || ""} ${sessionUser?.lastName || ""}`.trim() ||
      "User";
    const email = sessionUser?.email || "";
    const avatar = sessionUser?.avatar || "/images/avatars/1.png";

    setUser(sessionUser ? { name, email, avatar } : null);
  }, [session]);

  const navItems = React.useMemo(() => getNav(locale, role), [locale, role]);
  const homeUrl = isSuperAdminRole(role) ? "/dashboard/super-admin" : "/dashboard";
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
              className="border-sidebar-border/70 bg-sidebar-accent/40 hover:bg-sidebar-accent rounded-xl border !p-2 shadow-sm transition-all">
              <Link href={homeUrl}>
                <LogoMark
                  frameClassName="size-9 rounded-lg border border-sidebar-border/60 bg-sidebar p-1 shadow-sm"
                  imageClassName="h-[18px]"
                  darkImageClassName="h-[21px]"
                />
                <div className="grid flex-1 text-start text-sm leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate font-bold tracking-tight">طاقم</span>
                  <span className="text-sidebar-foreground/65 truncate text-xs">
                    {workspaceLabel}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="px-1">
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter className="border-sidebar-border/70 border-t px-2 pt-2 pb-2">
        {user ? <NavUser user={user} /> : null}
      </SidebarFooter>
    </Sidebar>
  );
}
