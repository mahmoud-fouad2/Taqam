"use client";

import * as React from "react";
import { Cell, Pie, PieChart, Tooltip } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AppLocale } from "@/lib/i18n/types";
import { getText } from "@/lib/i18n/text";
import type { DashboardPiePoint } from "@/lib/dashboard";

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--primary))"
];

const CHART_COLOR_CLASSES = [
  "bg-[hsl(var(--chart-1))]",
  "bg-[hsl(var(--chart-2))]",
  "bg-[hsl(var(--chart-3))]",
  "bg-[hsl(var(--chart-4))]",
  "bg-[hsl(var(--chart-5))]",
  "bg-[hsl(var(--primary))]"
];

type TooltipPayloadItem = {
  name?: string;
  value?: number;
};

function DepartmentsTooltip({
  active,
  payload
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const item = payload[0];
  const name = typeof item?.name === "string" ? item.name : "";
  const value = typeof item?.value === "number" ? item.value : undefined;

  return (
    <div className="bg-background text-foreground rounded-md border px-2 py-1 text-sm shadow-sm">
      <div className="font-medium">{name}</div>
      {typeof value === "number" ? (
        <div className="text-muted-foreground tabular-nums">{value}</div>
      ) : null}
    </div>
  );
}

interface Props {
  locale: AppLocale;
  data: DashboardPiePoint[];
}

export function ChartDepartmentsPie({ locale, data }: Props) {
  const t = getText(locale);
  const c = t.dashboardCharts;

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>{c.departmentsTitle}</CardTitle>
        <CardDescription>{c.departmentsSubtitle}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4 sm:flex-row">
        {data.length === 0 ? (
          <p className="text-muted-foreground w-full py-8 text-center text-sm">{c.noData}</p>
        ) : (
          <>
            <div className="relative shrink-0">
              <PieChart width={180} height={180}>
                <Pie
                  data={data}
                  cx={85}
                  cy={85}
                  innerRadius={52}
                  outerRadius={82}
                  dataKey="value"
                  strokeWidth={0}>
                  {data.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<DepartmentsTooltip />} />
              </PieChart>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold">{total}</span>
                <span className="text-muted-foreground text-xs">{c.employees}</span>
              </div>
            </div>
            <ul className="min-w-0 flex-1 space-y-2">
              {data.map((dept, i) => (
                <li key={dept.name} className="flex min-w-0 items-center gap-2 text-sm">
                  <span
                    className={`h-3 w-3 shrink-0 rounded-sm ${
                      CHART_COLOR_CLASSES[i % CHART_COLOR_CLASSES.length]
                    }`}
                  />
                  <span className="flex-1 truncate">
                    {locale === "ar" && dept.nameAr ? dept.nameAr : dept.name}
                  </span>
                  <span className="shrink-0 font-medium tabular-nums">{dept.value}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
}
