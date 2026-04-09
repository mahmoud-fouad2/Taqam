import { Metadata } from "next";
import { SidebarNav } from "./sidebar-nav";
import { generateMeta } from "@/lib/utils";
import { getAppLocale } from "@/lib/i18n/locale";
import { getText } from "@/lib/i18n/text";

const t = getText("ar");

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getAppLocale();
  return generateMeta({
    title: locale === "ar" ? "إعدادات النظام" : "Settings",
    description:
      locale === "ar"
        ? t.common.pManageYourAccountSettingsAndEm
        : "Manage your account settings and email preferences.",
  });
}

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getAppLocale();

  const p = locale === "en" ? "/en" : "";

  const sidebarNavItems = [
    {
      title: locale === "ar" ? "الملف الشخصي" : "Profile",
      href: `${p}/dashboard/settings`,
    },
    {
      title: locale === "ar" ? "إعدادات الحضور والموقع" : "Attendance & Location",
      href: `${p}/dashboard/settings/attendance`,
    },
    {
      title: locale === "ar" ? "إعدادات عامة" : "General",
      href: `${p}/dashboard/settings-advanced`,
    },
    {
      title: locale === "ar" ? "الأمان" : "Security",
      href: `${p}/dashboard/settings-advanced?section=security`,
    },
    {
      title: locale === "ar" ? "الإشعارات" : "Notifications",
      href: `${p}/dashboard/settings-advanced?section=notifications`,
    },
    {
      title: locale === "ar" ? "التكاملات" : "Integrations",
      href: `${p}/dashboard/settings-advanced?section=integrations`,
    },
    {
      title: locale === "ar" ? "الأدوار والصلاحيات" : "Roles & Permissions",
      href: `${p}/dashboard/settings-advanced?section=roles`,
    },
    {
      title: locale === "ar" ? "أنواع الإجازات" : "Leave Types",
      href: `${p}/dashboard/settings-advanced?section=leaves`,
    },
    {
      title: locale === "ar" ? "سير العمل" : "Workflows",
      href: `${p}/dashboard/settings-advanced?section=workflows`,
    },
    {
      title: locale === "ar" ? "النسخ الاحتياطي" : "Backup",
      href: `${p}/dashboard/settings-advanced?section=backup`,
    },
  ];

  return (
    <>
      <div className="space-y-1 mb-4">
        <h2 className="text-2xl font-bold tracking-tight text-start">
          {locale === "ar" ? "إعدادات النظام" : "Settings"}
        </h2>
        <p className="text-muted-foreground">
          {locale === "ar"
            ? t.common.pManageYourAccountSettingsAndEm
            : "Manage your account settings and email preferences."}
        </p>
      </div>
      <div
        className="flex flex-col gap-6 lg:flex-row lg:items-start rtl:lg:flex-row-reverse"
      >
        <aside className="lg:w-64 lg:shrink-0 lg:sticky lg:top-20">
          <div className="rounded-lg border bg-card p-2 shadow-sm">
            <SidebarNav items={sidebarNavItems} />
          </div>
        </aside>
        <div className="flex-1">
          <div className="rounded-lg border bg-card p-6 shadow-sm">{children}</div>
        </div>
      </div>
    </>
  );
}
