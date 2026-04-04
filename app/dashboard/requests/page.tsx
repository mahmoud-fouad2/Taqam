import { RequestsManager } from "./requests-manager";
import { InboxIcon } from "lucide-react";

export const metadata = {
  title: "الطلبات | طاقم",
  description: "إدارة طلبات الحضور والانصراف",
};

export default function RequestsPage() {
  return (
    <>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/10">
            <InboxIcon className="h-5 w-5 text-sky-600 dark:text-sky-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">الطلبات</h1>
            <p className="text-sm text-muted-foreground">تقديم ومتابعة طلبات الحضور والانصراف</p>
          </div>
        </div>
      </div>
      <RequestsManager />
    </>
  );
}
