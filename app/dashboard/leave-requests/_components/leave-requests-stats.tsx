"use client";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useClientLocale } from "@/lib/i18n/use-client-locale";
import { getText } from "@/lib/i18n/text";

const t = getText("ar");

export function LeaveRequestsStats({
  stats
}: {
  stats: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    taken: number;
  };
}) {
  const locale = useClientLocale();
  const t = getText(locale);
  return (
    <div className="grid gap-4 md:grid-cols-5">
      <Card className="border-border/40 bg-card/90 rounded-3xl shadow-[0_2px_10px_0_rgba(0,0,0,0.02)] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
        <CardHeader className="pb-2">
          <CardDescription>{t.myRequests.totalRequests}</CardDescription>
          <CardTitle className="text-3xl">{stats.total}</CardTitle>
        </CardHeader>
      </Card>
      <Card className="rounded-3xl border border-amber-200/50 bg-amber-50/50 shadow-[0_2px_10px_0_rgba(0,0,0,0.02)] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-amber-900/30 dark:bg-amber-900/10">
        <CardHeader className="pb-2">
          <CardDescription>{t.common.pending}</CardDescription>
          <CardTitle className="text-3xl text-amber-600 dark:text-amber-400">
            {stats.pending}
          </CardTitle>
        </CardHeader>
      </Card>
      <Card className="rounded-3xl border border-emerald-200/50 bg-emerald-50/50 shadow-[0_2px_10px_0_rgba(0,0,0,0.02)] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-emerald-900/30 dark:bg-emerald-900/10">
        <CardHeader className="pb-2">
          <CardDescription>{t.common.accepted}</CardDescription>
          <CardTitle className="text-3xl text-emerald-600 dark:text-emerald-400">
            {stats.approved}
          </CardTitle>
        </CardHeader>
      </Card>
      <Card className="rounded-3xl border border-rose-200/50 bg-rose-50/50 shadow-[0_2px_10px_0_rgba(0,0,0,0.02)] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-rose-900/30 dark:bg-rose-900/10">
        <CardHeader className="pb-2">
          <CardDescription>{t.common.rejected}</CardDescription>
          <CardTitle className="text-3xl text-rose-600 dark:text-rose-400">
            {stats.rejected}
          </CardTitle>
        </CardHeader>
      </Card>
      <Card className="rounded-3xl border border-sky-200/50 bg-sky-50/50 shadow-[0_2px_10px_0_rgba(0,0,0,0.02)] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-sky-900/30 dark:bg-sky-900/10">
        <CardHeader className="pb-2">
          <CardDescription>{t.leaveBalances.taken}</CardDescription>
          <CardTitle className="text-3xl text-sky-600 dark:text-sky-400">{stats.taken}</CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}
