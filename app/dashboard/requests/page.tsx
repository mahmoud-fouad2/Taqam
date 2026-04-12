import { RequestsManager } from "./requests-manager";
import { InboxIcon } from "lucide-react";
import { getText } from "@/lib/i18n/text";
import { getAppLocale } from "@/lib/i18n/locale";

export async function generateMetadata() {
  const locale = await getAppLocale();
  const t = getText(locale);
  return {
    title: t.requests.pageTitle,
    description: t.requests.pageDesc
  };
}

export default async function RequestsPage() {
  const locale = await getAppLocale();
  const t = getText(locale);
  return (
    <div className="mx-auto max-w-7xl space-y-6 sm:space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div className="group flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-500/10 shadow-sm transition-transform duration-300 group-hover:scale-105">
            <InboxIcon className="h-6 w-6 text-sky-600 transition-transform group-hover:scale-110 dark:text-sky-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t.requests.pageTitle}</h1>
            <p className="text-muted-foreground text-sm">
              {t.requests.pSubmitAndTrackAttendanceReques}
            </p>
          </div>
        </div>
      </div>
      <RequestsManager />
    </div>
  );
}
