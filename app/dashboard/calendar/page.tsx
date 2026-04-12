import { CalendarView } from "./calendar-view";
import { CalendarDays } from "lucide-react";
import { getText } from "@/lib/i18n/text";
import { getAppLocale } from "@/lib/i18n/locale";

export async function generateMetadata() {
  const locale = await getAppLocale();
  const t = getText(locale);
  return {
    title: t.calendar.pageTitle,
    description: t.calendar.pageDesc
  };
}

export default async function CalendarPage() {
  const locale = await getAppLocale();
  const t = getText(locale);
  return (
    <div className="mx-auto max-w-7xl space-y-6 sm:space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div className="group flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/10 shadow-sm transition-transform duration-300 group-hover:scale-105">
            <CalendarDays className="h-6 w-6 text-cyan-600 transition-transform group-hover:scale-110 dark:text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t.calendar.pCalendar}</h1>
            <p className="text-muted-foreground text-sm">
              {t.calendar.pCalendarViewOfAttendanceRecord}
            </p>
          </div>
        </div>
      </div>
      <CalendarView />
    </div>
  );
}
