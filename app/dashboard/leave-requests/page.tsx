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
    description: t.leaveRequests.pLeaveRequests
  });
}

export default async function LeaveRequestsPage() {
  const locale = await getAppLocale();
  const t = getText(locale);
  return (
    <div className="mx-auto max-w-7xl space-y-6 sm:space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div className="group flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 shadow-sm transition-transform duration-300 group-hover:scale-105">
            <CalendarOff className="h-6 w-6 text-amber-600 transition-transform group-hover:scale-110 dark:text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t.leaveRequests.pLeaveRequests}</h1>
            <p className="text-muted-foreground text-sm">
              {t.leaveRequests.pReviewAndManageLeaveAndAbsence}
            </p>
          </div>
        </div>
      </div>
      <LeaveRequestsManager />
    </div>
  );
}
