import Link from "next/link";
import { CalendarClock, CalendarDays, Clock, Settings2 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { AttendanceManager } from "./attendance-manager";
import { getText } from "@/lib/i18n/text";
import { getAppLocale } from "@/lib/i18n/locale";

export async function generateMetadata() {
  const locale = await getAppLocale();
  const t = getText(locale);
  return {
    title: t.attendance.pageTitle,
    description: t.attendance.pageDesc
  };
}

export default async function AttendancePage() {
  const locale = await getAppLocale();
  const t = getText(locale);
  const prefix = locale === "en" ? "/en" : "";
  const attendanceQuickLinks = [
    {
      href: `${prefix}/dashboard/shifts`,
      icon: CalendarClock,
      title: locale === "ar" ? "الورديات وساعات الدوام" : "Shifts and work hours",
      description:
        locale === "ar"
          ? "هنا تُدار جداول العمل والقوالب وساعات الدوام المتوقعة لكل فريق."
          : "Manage shift templates, schedules, and expected working hours here."
    },
    {
      href: `${prefix}/dashboard/calendar`,
      icon: CalendarDays,
      title: locale === "ar" ? "التقويم والعطلات" : "Calendar and holidays",
      description:
        locale === "ar"
          ? "التقويم اختياري للمراجعة البصرية ويُظهر العطلات الرسمية وأيام الراحة."
          : "Use the optional calendar view for visual review of holidays and rest days."
    },
    {
      href: `${prefix}/dashboard/settings/attendance`,
      icon: Settings2,
      title: locale === "ar" ? "سياسات الحضور والموقع" : "Attendance and location rules",
      description:
        locale === "ar"
          ? "عدّل geofence والدقة وسياسات البصمة وإعدادات المواقع من هنا."
          : "Configure geofence, accuracy, check-in rules, and work locations here."
    }
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="group flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-500/10 shadow-sm transition-transform duration-300 group-hover:scale-105">
            <Clock className="h-6 w-6 text-green-600 transition-transform group-hover:scale-110 dark:text-green-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t.attendance.title}</h1>
            <p className="text-muted-foreground text-sm">
              {t.attendance.pTrackAndManageDailyAttendance}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href={`${prefix}/dashboard/shifts`}
            className="border-border/60 bg-card text-foreground hover:bg-muted/50 inline-flex h-12 items-center gap-2 rounded-xl border px-4 text-sm font-medium shadow-sm transition-colors">
            <CalendarClock className="h-4 w-4" />
            {locale === "ar" ? "الورديات" : "Shifts"}
          </Link>
          <Link
            href={`${prefix}/dashboard/settings/attendance`}
            className="border-border/60 bg-card text-foreground hover:bg-muted/50 inline-flex h-12 items-center gap-2 rounded-xl border px-4 text-sm font-medium shadow-sm transition-colors">
            <Settings2 className="h-4 w-4" />
            {locale === "ar" ? "إعدادات الحضور" : "Attendance settings"}
          </Link>
          <Link
            href={`${prefix}/dashboard/calendar`}
            className="border-border/60 bg-card text-foreground hover:bg-muted/50 inline-flex h-12 items-center gap-2 rounded-xl border px-4 text-sm font-medium shadow-sm transition-colors">
            <CalendarDays className="h-4 w-4" />
            {locale === "ar" ? "عرض التقويم" : "Calendar view"}
          </Link>
        </div>
      </div>

      <Card className="border-border/60 bg-card/80 rounded-3xl shadow-sm">
        <CardContent className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1.2fr)_repeat(3,minmax(0,1fr))]">
          <div className="border-primary/20 bg-primary/5 rounded-2xl border p-4">
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 rounded-2xl p-3">
                <Clock className="text-primary h-5 w-5" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs font-semibold tracking-[0.14em] uppercase">
                  {locale === "ar" ? "العرض الأساسي" : "Default view"}
                </p>
                <h2 className="mt-1 text-base font-semibold">
                  {locale === "ar" ? "قائمة الحضور اليومية" : "Daily attendance list"}
                </h2>
                <p className="text-muted-foreground mt-2 text-sm leading-6">
                  {locale === "ar"
                    ? "هذه الصفحة تظل القائمة الأساسية للمراجعة اليومية والفلترة السريعة. استخدم الروابط المجاورة عندما تحتاج ضبط الورديات أو سياسات الموقع أو مراجعة التقويم."
                    : "This page remains the default day-to-day list view. Use the links beside it when you need shift setup, location policies, or the optional calendar review."}
                </p>
              </div>
            </div>
          </div>

          {attendanceQuickLinks.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="group border-border/60 bg-muted/20 hover:border-primary/30 hover:bg-primary/5 rounded-2xl border p-4 transition-colors">
                <div className="bg-background mb-3 inline-flex rounded-2xl p-3 shadow-sm">
                  <Icon className="text-primary h-5 w-5" />
                </div>
                <h3 className="group-hover:text-primary text-sm font-semibold">{item.title}</h3>
                <p className="text-muted-foreground mt-2 text-sm leading-6">{item.description}</p>
              </Link>
            );
          })}
        </CardContent>
      </Card>

      <AttendanceManager />
    </div>
  );
}
