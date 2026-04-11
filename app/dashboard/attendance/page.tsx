import { AttendanceManager } from "./attendance-manager";
import { Clock } from "lucide-react";
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
  return (
    <>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-500/10">
            <Clock className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t.attendance.title}</h1>
            <p className="text-muted-foreground text-sm">
              {t.attendance.pTrackAndManageDailyAttendance}
            </p>
          </div>
        </div>
      </div>
      <AttendanceManager />
    </>
  );
}
