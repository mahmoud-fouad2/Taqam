"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

import type { AppLocale } from "@/lib/i18n/types";
import type { DashboardAttendancePoint, DashboardChartPeriod } from "@/lib/dashboard";

type Props = {
  locale: AppLocale;
  initialAttendance: DashboardAttendancePoint[];
  initialPeriod?: DashboardChartPeriod;
};

const ChartAreaInteractive = dynamic<Props>(
  () => import("@/components/chart-area-interactive").then((m) => m.ChartAreaInteractive),
  {
    ssr: false,
    loading: () => (
      <div className="bg-card rounded-xl border p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-9 w-32" />
        </div>
        <Skeleton className="mt-4 h-[260px] w-full" />
      </div>
    )
  }
);

export function ChartAreaInteractiveClient({ locale, initialAttendance }: Props) {
  return <ChartAreaInteractive locale={locale} initialAttendance={initialAttendance} />;
}
