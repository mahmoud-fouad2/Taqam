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
    <>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/10">
            <InboxIcon className="h-5 w-5 text-sky-600 dark:text-sky-400" />
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
    </>
  );
}
