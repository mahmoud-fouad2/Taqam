import { ReportsView } from "./reports-view";
import { BarChart3 } from "lucide-react";
import { getText } from "@/lib/i18n/text";
import { getAppLocale } from "@/lib/i18n/locale";

export async function generateMetadata() {
  const locale = await getAppLocale();
  const t = getText(locale);
  return {
    title: t.reports.pageTitle,
    description: t.reports.pageDesc
  };
}

export default async function ReportsPage() {
  const locale = await getAppLocale();
  const t = getText(locale);
  return (
    <>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10">
            <BarChart3 className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t.common.reports}</h1>
            <p className="text-muted-foreground text-sm">
              {t.reports.pAttendanceReportsAndStatistics}
            </p>
          </div>
        </div>
      </div>
      <ReportsView />
    </>
  );
}
