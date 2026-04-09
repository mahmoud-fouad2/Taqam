import { LeaveRequestsManager } from "./leave-requests-manager";
import { CalendarOff } from "lucide-react";
import { Metadata } from "next";
import { generateMeta } from "@/lib/utils";
import { getText } from "@/lib/i18n/text";
import { getAppLocale } from "@/lib/i18n/locale";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getAppLocale();
  const t = getText(locale);
  return generateMeta({
    title: t.leaveRequests.pLeaveRequests,
    description: t.leaveRequests.pLeaveRequests,
  });
}

export default async function LeaveRequestsPage() {
  const locale = await getAppLocale();
  const t = getText(locale);
  return (
    <>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
            <CalendarOff className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t.leaveRequests.pLeaveRequests}</h1>
            <p className="text-sm text-muted-foreground">{t.leaveRequests.pReviewAndManageLeaveAndAbsence}</p>
          </div>
        </div>
      </div>
      <LeaveRequestsManager />
    </>
  );
}
