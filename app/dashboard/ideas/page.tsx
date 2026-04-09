import { getAppLocale } from "@/lib/i18n/locale";
import { getText } from "@/lib/i18n/text";
import { getPageContext } from "@/lib/guards";

import { IdeasWorkspace } from "./ideas-workspace";


export default async function IdeasPage() {
  const locale = await getAppLocale();
  const t = getText(locale);
  const ctx = await getPageContext();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t.common.shareIdeas}</h1>
        <p className="text-muted-foreground">
          {locale === "ar"
            ? "سجل المقترحات والبلاغات في مسار موحد مرتبط مباشرة بنظام التذاكر حتى لا تضيع المتابعة أو السياق."
            : "Capture ideas and bug reports in one tracked workflow tied directly to the ticketing system."}
        </p>
      </div>

      <IdeasWorkspace locale={locale} isSuperAdmin={ctx.isSuperAdmin} />
    </div>
  );
}
