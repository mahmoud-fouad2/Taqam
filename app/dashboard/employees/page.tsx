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
    description: `${t.employees.pEmployeeDetails} - Core HR Phase 3`,
  });
}

export default async function EmployeesPage() {
  const locale = await getAppLocale();
  const t = getText(locale);
  return (
    <>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
            <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t.employees.pageTitle}</h1>
            <p className="text-sm text-muted-foreground">{t.employees.pManageEmployeeDataAndRecords}</p>
          </div>
        </div>
      </div>
      <EmployeesManager />
    </>
  );
}
