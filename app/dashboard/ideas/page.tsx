import { Lightbulb } from "lucide-react";
import { getAppLocale } from "@/lib/i18n/locale";
import { getText } from "@/lib/i18n/text";
import { getPageContext } from "@/lib/guards";

import { IdeasWorkspace } from "./ideas-workspace";

export default async function IdeasPage() {
  const locale = await getAppLocale();
  const t = getText(locale);
  const ctx = await getPageContext();

  return (
    <div className="mx-auto max-w-7xl space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="group flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 shadow-sm transition-transform duration-300 group-hover:scale-105">
            <Lightbulb className="h-6 w-6 text-amber-600 transition-transform group-hover:scale-110 dark:text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t.common.shareIdeas}</h1>
            <p className="text-muted-foreground text-sm leading-6">
              {locale === "ar"
                ? "حوّل الملاحظات والمشكلات والمقترحات إلى سجل واضح قابل للمتابعة بدون ازدواجية أو ضياع للسياق."
                : "Turn product feedback, bugs, and ideas into a single tracked queue with clear ownership."}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-border/50 bg-card/70 px-4 py-3 text-sm text-muted-foreground shadow-sm lg:max-w-sm">
          {locale === "ar"
            ? "أي إدخال من هذه الصفحة يتحول مباشرة إلى تذكرة قابلة للمراجعة والرد والمتابعة من نفس المسار."
            : "Every submission from this page becomes a tracked ticket that can be reviewed and answered from the same flow."}
        </div>
      </div>

      <IdeasWorkspace locale={locale} isSuperAdmin={ctx.isSuperAdmin} />
    </div>
  );
}