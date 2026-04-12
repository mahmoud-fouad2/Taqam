import { PayrollProcessingManager } from "./payroll-manager";
import { DollarSign } from "lucide-react";
import { getText } from "@/lib/i18n/text";
import { getAppLocale } from "@/lib/i18n/locale";
import { requireTenantRole } from "@/lib/auth";

export default async function PayrollPage() {
  await requireTenantRole(["TENANT_ADMIN", "HR_MANAGER"]);
  const locale = await getAppLocale();
  const t = getText(locale);
  return (
    <div className="mx-auto max-w-7xl space-y-6 sm:space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 transition-transform duration-300 group-hover:scale-105 items-center justify-center rounded-2xl bg-purple-500/10">
            <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t.payroll.title}</h1>
            <p className="text-muted-foreground text-sm">{t.payroll.pageSubtitle}</p>
          </div>
        </div>
      </div>
      <PayrollProcessingManager />
    </div>
  );
}


