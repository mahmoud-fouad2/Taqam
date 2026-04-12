import { DocumentsManager } from "./documents-manager";
import { FolderOpen } from "lucide-react";
import { getText } from "@/lib/i18n/text";
import { getAppLocale } from "@/lib/i18n/locale";

export async function generateMetadata() {
  const locale = await getAppLocale();
  const t = getText(locale);
  return {
    title: t.documents.pageTitle,
    description: t.documents.pageDesc
  };
}

export default async function DocumentsPage() {
  const locale = await getAppLocale();
  const t = getText(locale);
  return (
    <div className="mx-auto max-w-7xl space-y-6 sm:space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 transition-transform duration-300 group-hover:scale-105 items-center justify-center rounded-2xl bg-yellow-500/10">
            <FolderOpen className="h-6 w-6 transition-transform group-hover:scale-110 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t.onboarding.documents}</h1>
            <p className="text-muted-foreground text-sm">
              {t.documents.pUploadAndManageEmployeeDocumen}
            </p>
          </div>
        </div>
      </div>
      <DocumentsManager />
    </div>
  );
}

