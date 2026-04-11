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
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>{t.myRequests.totalRequests}</CardDescription>
          <CardTitle className="text-3xl">{stats.total}</CardTitle>
        </CardHeader>
      </Card>
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader className="pb-2">
          <CardDescription>{t.common.pending}</CardDescription>
          <CardTitle className="text-3xl text-yellow-600">{stats.pending}</CardTitle>
        </CardHeader>
      </Card>
      <Card className="border-green-200 bg-green-50">
        <CardHeader className="pb-2">
          <CardDescription>{t.common.accepted}</CardDescription>
          <CardTitle className="text-3xl text-green-600">{stats.approved}</CardTitle>
        </CardHeader>
      </Card>
      <Card className="border-red-200 bg-red-50">
        <CardHeader className="pb-2">
          <CardDescription>{t.common.rejected}</CardDescription>
          <CardTitle className="text-3xl text-red-600">{stats.rejected}</CardTitle>
        </CardHeader>
      </Card>
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="pb-2">
          <CardDescription>{t.leaveBalances.taken}</CardDescription>
          <CardTitle className="text-3xl text-blue-600">{stats.taken}</CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}
