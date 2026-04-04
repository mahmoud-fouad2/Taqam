import { CSVImportManager } from "./csv-import-manager";
import { Upload } from "lucide-react";

export const metadata = {
  title: "استيراد البيانات | طاقم",
  description: "استيراد بيانات الموظفين من ملفات CSV",
};

export default function ImportPage() {
  return (
    <>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-500/10">
            <Upload className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">استيراد البيانات</h1>
            <p className="text-sm text-muted-foreground">استيراد بيانات الموظفين بشكل جماعي من ملفات CSV</p>
          </div>
        </div>
      </div>
      <CSVImportManager />
    </>
  );
}
