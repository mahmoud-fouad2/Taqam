import type { Metadata } from "next";
import { generateMeta } from "@/lib/utils";
import { EmployeesManager } from "./employees-manager";
import { Users } from "lucide-react";
import { getText } from "@/lib/i18n/text";
import { getAppLocale } from "@/lib/i18n/locale";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getAppLocale();
  const t = getText(locale);
  return generateMeta({
    title: t.employees.pageTitle,
    description: `${t.employees.pEmployeeDetails} - Core HR Phase 3`
  });
}

export default async function EmployeesPage() {
  const locale = await getAppLocale();
  const t = getText(locale);
  return (
    <div className="mx-auto max-w-7xl space-y-6 sm:space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div className="group flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 shadow-sm transition-transform duration-300 group-hover:scale-105">
            <Users className="h-6 w-6 text-blue-600 transition-transform group-hover:scale-110 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t.employees.pageTitle}</h1>
            <p className="text-muted-foreground text-sm">
              {t.employees.pManageEmployeeDataAndRecords}
            </p>
          </div>
        </div>
      </div>
      <EmployeesManager />
    </div>
  );
}
