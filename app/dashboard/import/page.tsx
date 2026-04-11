import { CSVImportManager } from "./csv-import-manager";
import { Upload } from "lucide-react";
import { getText } from "@/lib/i18n/text";
import { getAppLocale } from "@/lib/i18n/locale";

export async function generateMetadata() {
  const locale = await getAppLocale();
  const t = getText(locale);
  return {
    title: t.csvImport.pageTitle,
    description: t.csvImport.pageDesc
  };
}

export default async function ImportPage() {
  const locale = await getAppLocale();
  const t = getText(locale);
  return (
    <>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-500/10">
            <Upload className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t.csvImport.title}</h1>
            <p className="text-muted-foreground text-sm">{t.csvImport.pEmployeeDetails} CSV</p>
          </div>
        </div>
      </div>
      <CSVImportManager />
    </>
  );
}
