import { DocumentsManager } from "./documents-manager";
import { FolderOpen } from "lucide-react";

export const metadata = {
  title: "المستندات | طاقم",
  description: "إدارة مستندات الموظفين",
};

export default function DocumentsPage() {
  return (
    <>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-500/10">
            <FolderOpen className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">المستندات</h1>
            <p className="text-sm text-muted-foreground">رفع وإدارة مستندات الموظفين</p>
          </div>
        </div>
      </div>
      <DocumentsManager />
    </>
  );
}
