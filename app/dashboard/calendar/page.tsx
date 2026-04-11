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
    <>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10">
            <CalendarDays className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
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
    </>
  );
}
