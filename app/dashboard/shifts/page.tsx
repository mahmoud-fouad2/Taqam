import { ShiftsManager } from "./shifts-manager";
import { CalendarClock } from "lucide-react";
import { getText } from "@/lib/i18n/text";
import { getAppLocale } from "@/lib/i18n/locale";

export async function generateMetadata() {
  const locale = await getAppLocale();
  const t = getText(locale);
  return {
    title: t.shifts.pageTitle,
    description: t.shifts.pageDesc,
  };
}

export default async function ShiftsPage() {
  const locale = await getAppLocale();
  const t = getText(locale);
  return (
    <>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-500/10">
            <CalendarClock className="h-5 w-5 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t.shifts.pageTitle}</h1>
            <p className="text-sm text-muted-foreground">{t.shifts.pManageWorkShiftsAndSchedules}</p>
          </div>
        </div>
      </div>
      <ShiftsManager />
    </>
  );
}
