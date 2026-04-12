import Link from "next/link";
import { CalendarDays, Clock } from "lucide-react";
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
            href={`${prefix}/dashboard/calendar`}
            className="inline-flex h-12 items-center gap-2 rounded-xl border border-border/60 bg-card px-4 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted/50"
          >
            <CalendarDays className="h-4 w-4" />
            {locale === "ar" ? "عرض التقويم" : "Calendar view"}
          </Link>
        </div>
      </div>

      <AttendanceManager />
    </div>
  );
}