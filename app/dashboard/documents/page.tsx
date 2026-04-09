import { DocumentsManager } from "./documents-manager";
import { FolderOpen } from "lucide-react";
import { getText } from "@/lib/i18n/text";
import { getAppLocale } from "@/lib/i18n/locale";

export async function generateMetadata() {
  const locale = await getAppLocale();
  const t = getText(locale);
  return {
    title: t.documents.pageTitle,
    description: t.documents.pageDesc,
  };
}

export default async function DocumentsPage() {
  const locale = await getAppLocale();
  const t = getText(locale);
  return (
    <>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-500/10">
            <FolderOpen className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t.onboarding.documents}</h1>
            <p className="text-sm text-muted-foreground">{t.documents.pUploadAndManageEmployeeDocumen}</p>
          </div>
        </div>
      </div>
      <DocumentsManager />
    </>
  );
}
