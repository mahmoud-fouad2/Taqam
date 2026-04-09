import { PayrollProcessingManager } from "./payroll-manager";
import { DollarSign } from "lucide-react";import { getText } from "@/lib/i18n/text";
import { getAppLocale } from "@/lib/i18n/locale";

export default async function PayrollPage() {
  const locale = await getAppLocale();
  const t = getText(locale);
  return (
    <>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10">
            <DollarSign className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t.payroll.title}</h1>
            <p className="text-sm text-muted-foreground">{t.payroll.pageSubtitle}</p>
          </div>
        </div>
      </div>
      <PayrollProcessingManager />
    </>
  );
}
