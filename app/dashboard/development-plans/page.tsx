import { DevelopmentPlansManager } from "./development-plans-manager";
import { getText } from "@/lib/i18n/text";
import { getAppLocale } from "@/lib/i18n/locale";

export default async function DevelopmentPlansPage() {
  const locale = await getAppLocale();
  const t = getText(locale);
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t.developmentPlans.pageTitle}</h1>
          <p className="text-muted-foreground">
            {t.developmentPlans.pManageEmployeeDevelopmentAndTr}
          </p>
        </div>
      </div>
      <DevelopmentPlansManager />
    </div>
  );
}
