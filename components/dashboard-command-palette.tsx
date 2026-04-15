"use client";

import type { ComponentType } from "react";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Bell,
  BookOpen,
  Clock3,
  DollarSign,
  FileSearch,
  HelpCircle,
  KeyRound,
  Lightbulb,
  Search,
  Settings,
  Shield,
  Sparkles,
  SquareArrowOutUpRight,
  User,
  UserPlus
} from "lucide-react";

import { isSuperAdminRole } from "@/lib/access-control";
import { getDashboardNavDefinitions } from "@/lib/dashboard-nav";
import { getText } from "@/lib/i18n/text";
import type { AppLocale } from "@/lib/i18n/types";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut
} from "@/components/ui/command";

type CommandGroupKey = "navigate" | "actions" | "support";

type CommandEntry = {
  id: string;
  title: string;
  titleAlt?: string;
  subtitle: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  group: CommandGroupKey;
  keywords?: string[];
};

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tagName = target.tagName;
  return (
    target.isContentEditable ||
    tagName === "INPUT" ||
    tagName === "TEXTAREA" ||
    tagName === "SELECT" ||
    Boolean(target.closest("[contenteditable='true']"))
  );
}

function isCurrentPath(pathname: string, href: string) {
  if (pathname === href) {
    return true;
  }

  if (href === "/dashboard" || href === "/dashboard/super-admin") {
    return pathname === href;
  }

  return pathname.startsWith(`${href}/`);
}

export function DashboardCommandPalette({ locale }: { locale: AppLocale }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const role = (session?.user as { role?: string } | undefined)?.role;
  const t = getText(locale);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || isTypingTarget(event.target)) {
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const navigationItems = useMemo<CommandEntry[]>(() => {
    return getDashboardNavDefinitions(role).map((item) => ({
      id: item.id,
      title: item.title[locale],
      titleAlt: locale === "ar" ? item.title.en : item.title.ar,
      subtitle:
        locale === "ar" ? "التنقل داخل لوحة التحكم" : "Navigate across the dashboard",
      href: item.url,
      icon: item.icon,
      group: "navigate",
      keywords: [item.title.ar, item.title.en, item.url]
    }));
  }, [locale, role]);

  const actionItems = useMemo<CommandEntry[]>(() => {
    if (isSuperAdminRole(role)) {
      return [
        {
          id: "create-tenant",
          title: locale === "ar" ? "إنشاء شركة جديدة" : "Create tenant",
          titleAlt: locale === "ar" ? "Create tenant" : "إنشاء شركة جديدة",
          subtitle: locale === "ar" ? "إجراء إداري سريع" : "Quick admin action",
          href: "/dashboard/super-admin/tenants/new",
          icon: UserPlus,
          group: "actions",
          keywords: ["tenant", "company", "شركة", "عميل"]
        },
        {
          id: "subscription-requests",
          title: locale === "ar" ? "مراجعة طلبات الاشتراك" : "Review subscription requests",
          titleAlt:
            locale === "ar" ? "Review subscription requests" : "مراجعة طلبات الاشتراك",
          subtitle: locale === "ar" ? "متابعة الطلبات الجديدة" : "Follow up on new requests",
          href: "/dashboard/super-admin/requests",
          icon: FileSearch,
          group: "actions",
          keywords: ["طلبات", "subscriptions", "requests"]
        },
        {
          id: "platform-settings",
          title: locale === "ar" ? "إعدادات المنصة" : "Platform settings",
          titleAlt: locale === "ar" ? "Platform settings" : "إعدادات المنصة",
          subtitle: locale === "ar" ? "إدارة سياسات المنصة" : "Manage platform policies",
          href: "/dashboard/super-admin/settings",
          icon: Settings,
          group: "actions",
          keywords: ["platform", "settings", "المنصة", "إعدادات"]
        }
      ];
    }

    const isManager = ["SUPER_ADMIN", "TENANT_ADMIN", "HR_MANAGER", "MANAGER"].includes(
      role ?? ""
    );
    const isHrOrAdmin = ["SUPER_ADMIN", "TENANT_ADMIN", "HR_MANAGER"].includes(role ?? "");
    const items: CommandEntry[] = [
      {
        id: "request-leave",
        title: t.dashboard.requestLeave,
        titleAlt: locale === "ar" ? "Request leave" : "طلب إجازة",
        subtitle:
          locale === "ar" ? "الوصول السريع لطلباتك" : "Quick access to your own requests",
        href: "/dashboard/my-requests",
        icon: SquareArrowOutUpRight,
        group: "actions",
        keywords: ["leave", "request", "إجازة", "طلب"]
      },
      {
        id: "record-attendance",
        title: t.dashboard.recordAttendance,
        titleAlt: locale === "ar" ? "Record attendance" : "تسجيل حضور",
        subtitle:
          locale === "ar"
            ? "الذهاب إلى شاشة الحضور والانصراف"
            : "Jump to attendance and time tracking",
        href: "/dashboard/attendance",
        icon: Clock3,
        group: "actions",
        keywords: ["attendance", "time", "حضور", "انصراف"]
      },
      {
        id: "notifications",
        title: t.common.notifications,
        titleAlt: locale === "ar" ? "Notifications" : "الإشعارات",
        subtitle:
          locale === "ar" ? "مراجعة آخر الإشعارات" : "Review the latest notifications",
        href: "/dashboard/notifications",
        icon: Bell,
        group: "actions",
        keywords: ["notifications", "alerts", "إشعارات"]
      },
      {
        id: "profile",
        title: t.common.viewProfile,
        titleAlt: locale === "ar" ? "View profile" : "عرض الملف الشخصي",
        subtitle:
          locale === "ar" ? "إدارة بياناتك الشخصية" : "Manage your personal information",
        href: "/dashboard/my-profile",
        icon: User,
        group: "actions",
        keywords: ["profile", "account", "ملف", "حساب"]
      },
      {
        id: "settings",
        title: t.common.settings,
        titleAlt: locale === "ar" ? "Settings" : "الإعدادات",
        subtitle:
          locale === "ar" ? "فتح إعدادات النظام" : "Open system settings",
        href: "/dashboard/settings",
        icon: Settings,
        group: "actions",
        keywords: ["settings", "preferences", "إعدادات"]
      }
    ];

    if (isHrOrAdmin) {
      items.unshift({
        id: "add-employee",
        title: t.dashboard.addEmployee,
        titleAlt: locale === "ar" ? "Add employee" : "إضافة موظف",
        subtitle:
          locale === "ar" ? "بدء إضافة موظف جديد" : "Start creating a new employee record",
        href: "/dashboard/employees?open=new",
        icon: UserPlus,
        group: "actions",
        keywords: ["employee", "new", "موظف", "إضافة"]
      });

      items.push(
        {
          id: "run-payroll",
          title: t.dashboard.runPayroll,
          titleAlt: locale === "ar" ? "Run payroll" : "تشغيل الرواتب",
          subtitle:
            locale === "ar" ? "الانتقال إلى دورة الرواتب" : "Go to payroll operations",
          href: "/dashboard/payroll",
          icon: DollarSign,
          group: "actions",
          keywords: ["payroll", "salary", "رواتب"]
        },
        {
          id: "roles",
          title: locale === "ar" ? "الأدوار والصلاحيات" : "Roles and permissions",
          titleAlt: locale === "ar" ? "Roles and permissions" : "الأدوار والصلاحيات",
          subtitle:
            locale === "ar" ? "ضبط وصول المستخدمين" : "Adjust user access and permissions",
          href: "/dashboard/settings/roles",
          icon: Shield,
          group: "actions",
          keywords: ["roles", "permissions", "صلاحيات", "أدوار"]
        },
        {
          id: "audit-logs",
          title: locale === "ar" ? "سجل التغييرات" : "Audit logs",
          titleAlt: locale === "ar" ? "Audit logs" : "سجل التغييرات",
          subtitle:
            locale === "ar" ? "مراجعة العمليات الحساسة" : "Review sensitive system activity",
          href: "/dashboard/audit-logs",
          icon: FileSearch,
          group: "actions",
          keywords: ["audit", "logs", "سجل", "تغييرات"]
        }
      );
    }

    if (isManager) {
      items.push({
        id: "review-requests",
        title: t.dashboard.reviewRequests,
        titleAlt: locale === "ar" ? "Review requests" : "مراجعة الطلبات",
        subtitle:
          locale === "ar" ? "الوصول إلى الطلبات المعلقة" : "Open pending approval workflows",
        href: "/dashboard/requests",
        icon: FileSearch,
        group: "actions",
        keywords: ["requests", "approvals", "طلبات", "موافقات"]
      });
    }

    if (role === "TENANT_ADMIN") {
      items.push({
        id: "sso-settings",
        title: locale === "ar" ? "إعدادات SSO" : "SSO settings",
        titleAlt: locale === "ar" ? "SSO settings" : "إعدادات SSO",
        subtitle:
          locale === "ar"
            ? "ضبط تسجيل الدخول الموحد للشركة"
            : "Configure company single sign-on",
        href: "/dashboard/settings/sso",
        icon: KeyRound,
        group: "actions",
        keywords: ["sso", "single sign on", "دخول موحد"]
      });
    }

    return items;
  }, [locale, role, t]);

  const supportItems = useMemo<CommandEntry[]>(() => {
    if (isSuperAdminRole(role)) {
      return [
        {
          id: "help-center",
          title: t.common.helpCenter,
          titleAlt: locale === "ar" ? "Help center" : "مركز المساعدة",
          subtitle:
            locale === "ar" ? "الرجوع إلى التوثيق والدعم" : "Open docs and guidance",
          href: "/dashboard/help-center",
          icon: HelpCircle,
          group: "support",
          keywords: ["help", "support", "مساعدة"]
        },
        {
          id: "support",
          title: locale === "ar" ? "الدعم الفني" : "Support desk",
          titleAlt: locale === "ar" ? "Support desk" : "الدعم الفني",
          subtitle:
            locale === "ar" ? "إدارة التذاكر والدعم" : "Handle support tickets and follow-up",
          href: "/dashboard/support",
          icon: Sparkles,
          group: "support",
          keywords: ["support", "tickets", "دعم", "تذاكر"]
        }
      ];
    }

    return [
      {
        id: "help-center",
        title: t.common.helpCenter,
        titleAlt: locale === "ar" ? "Help center" : "مركز المساعدة",
        subtitle:
          locale === "ar" ? "شرح سريع للمنتج" : "Browse product documentation",
        href: "/dashboard/help-center",
        icon: HelpCircle,
        group: "support",
        keywords: ["help", "docs", "مساعدة", "دليل"]
      },
      {
        id: "academy",
        title: t.common.academy,
        titleAlt: locale === "ar" ? "Academy" : "أكاديمية طاقم",
        subtitle:
          locale === "ar" ? "مواد تعليمية وتدريبية" : "Training content and onboarding guides",
        href: "/dashboard/academy",
        icon: BookOpen,
        group: "support",
        keywords: ["academy", "training", "تعليم", "تدريب"]
      },
      {
        id: "support",
        title: locale === "ar" ? "الدعم الفني" : "Support",
        titleAlt: locale === "ar" ? "Support" : "الدعم الفني",
        subtitle:
          locale === "ar" ? "التذاكر والمحادثات" : "Support tickets and conversations",
        href: "/dashboard/support",
        icon: Sparkles,
        group: "support",
        keywords: ["support", "tickets", "دعم"]
      },
      {
        id: "ideas",
        title: t.common.shareIdeas,
        titleAlt: locale === "ar" ? "Share ideas" : "مشاركة اقتراحات وأفكار",
        subtitle:
          locale === "ar" ? "اقتراحات تحسين المنتج" : "Submit product improvement ideas",
        href: "/dashboard/ideas",
        icon: Lightbulb,
        group: "support",
        keywords: ["ideas", "feedback", "اقتراحات", "أفكار"]
      },
      {
        id: "whats-new",
        title: t.common.whatsNew,
        titleAlt: locale === "ar" ? "What's new" : "ما الجديد؟",
        subtitle:
          locale === "ar" ? "آخر التحديثات والتحسينات" : "Review recent product updates",
        href: "/dashboard/whats-new",
        icon: Sparkles,
        group: "support",
        keywords: ["updates", "release notes", "تحديثات", "جديد"]
      }
    ];
  }, [locale, role, t]);

  const groups = useMemo(
    () => [
      {
        key: "navigate" as const,
        heading: locale === "ar" ? "التنقل" : "Navigation",
        items: navigationItems
      },
      {
        key: "actions" as const,
        heading: locale === "ar" ? "إجراءات سريعة" : "Quick actions",
        items: actionItems
      },
      {
        key: "support" as const,
        heading: locale === "ar" ? "المساعدة والدعم" : "Help and support",
        items: supportItems
      }
    ],
    [actionItems, locale, navigationItems, supportItems]
  );

  const navigateTo = (href: string) => {
    setOpen(false);
    if (href === pathname) {
      return;
    }

    requestAnimationFrame(() => router.push(href));
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        onClick={() => setOpen(true)}
        aria-label={locale === "ar" ? "فتح البحث السريع" : "Open quick search"}
        className="border-border/70 bg-background/75 hover:bg-accent/80 h-9 w-9 justify-start gap-2 rounded-lg border px-0 shadow-sm md:w-auto md:px-3">
        <Search className="h-4 w-4 shrink-0" />
        <span className="hidden text-sm font-medium md:inline">
          {locale === "ar" ? "بحث سريع" : "Quick search"}
        </span>
        <kbd className="bg-muted text-muted-foreground hidden h-6 items-center rounded-md px-1.5 text-[10px] font-medium md:inline-flex">
          Ctrl K
        </kbd>
      </Button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title={locale === "ar" ? "بحث وأوامر لوحة التحكم" : "Dashboard search and commands"}
        description={
          locale === "ar"
            ? "انتقل بسرعة بين الشاشات والإجراءات المتاحة"
            : "Jump between pages and common actions quickly"
        }
        className="overflow-hidden sm:max-w-2xl">
        <CommandInput
          placeholder={
            locale === "ar"
              ? "ابحث عن شاشة أو إجراء أو إعداد..."
              : "Search for a page, action, or setting..."
          }
        />
        <CommandList className="max-h-[min(70vh,540px)]">
          <CommandEmpty>
            {locale === "ar" ? "لا توجد نتائج مطابقة" : "No matching results"}
          </CommandEmpty>

          {groups.map((group, index) => {
            if (group.items.length === 0) {
              return null;
            }

            return (
              <div key={group.key}>
                {index > 0 ? <CommandSeparator /> : null}
                <CommandGroup heading={group.heading}>
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const current = isCurrentPath(pathname, item.href);

                    return (
                      <CommandItem
                        key={item.id}
                        value={[item.title, item.titleAlt, item.subtitle, ...(item.keywords ?? [])]
                          .filter(Boolean)
                          .join(" ")}
                        onSelect={() => navigateTo(item.href)}>
                        <Icon className="h-4 w-4 shrink-0 opacity-80" />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">{item.title}</div>
                          <div className="text-muted-foreground truncate text-xs">
                            {item.subtitle}
                          </div>
                        </div>
                        {current ? (
                          <CommandShortcut>
                            {locale === "ar" ? "الحالية" : "Current"}
                          </CommandShortcut>
                        ) : null}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </div>
            );
          })}
        </CommandList>
      </CommandDialog>
    </>
  );
}