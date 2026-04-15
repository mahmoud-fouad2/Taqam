"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import type { AppLocale } from "@/lib/i18n/types";
import type { DashboardPiePoint } from "@/lib/dashboard";

const ChartDepartmentsPie = dynamic(
  () => import("@/components/chart-departments-pie").then((m) => m.ChartDepartmentsPie),
  {
    ssr: false,
    loading: () => (
      <div className="bg-card rounded-xl border p-4">
        <Skeleton className="mb-2 h-5 w-40" />
        <Skeleton className="mb-4 h-4 w-56" />
        <Skeleton className="h-[180px] w-full" />
      </div>
    )
  }
);

const ChartLeavesBar = dynamic(
  () => import("@/components/chart-leaves-bar").then((m) => m.ChartLeavesBar),
  {
    ssr: false,
    loading: () => (
      <div className="bg-card rounded-xl border p-4">
        <Skeleton className="mb-2 h-5 w-40" />
        <Skeleton className="mb-4 h-4 w-56" />
        <Skeleton className="h-[180px] w-full" />
      </div>
    )
  }
);

interface Props {
  locale: AppLocale;
  departments: DashboardPiePoint[];
  leaves: DashboardPiePoint[];
}

export function DashboardSecondaryChartsClient({ locale, departments, leaves }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 @5xl/main:grid-cols-2">
      <ChartDepartmentsPie locale={locale} data={departments} />
      <ChartLeavesBar locale={locale} data={leaves} />
    </div>
  );
}
