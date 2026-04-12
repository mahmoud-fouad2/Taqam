import { ReportsView } from "./reports-view";
import { BarChart3 } from "lucide-react";
import { getText } from "@/lib/i18n/text";
import { getAppLocale } from "@/lib/i18n/locale";
import { requireTenantRole } from "@/lib/auth";

export async function generateMetadata() {
  const locale = await getAppLocale();
  const t = getText(locale);
  return {
    title: t.reports.pageTitle,
    description: t.reports.pageDesc
  };
}

export default async function ReportsPage() {
  await requireTenantRole(["TENANT_ADMIN", "HR_MANAGER"]);
  const locale = await getAppLocale();
  const t = getText(locale);
  return (
    <div className="mx-auto max-w-7xl space-y-6 sm:space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div className="group flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-500/10 shadow-sm transition-transform duration-300 group-hover:scale-105">
            <BarChart3 className="h-6 w-6 text-orange-600 transition-transform group-hover:scale-110 dark:text-orange-400" />
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
    </div>
  );
}
