"use client";

import * as React from "react";
import { Cell, Pie, PieChart, Tooltip } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
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
          <p className="text-muted-foreground text-sm py-8 w-full text-center">{c.noData}</p>
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
                <Tooltip
                  formatter={(value: number, name: string) => [value, name]}
                  contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))" }}
                />
              </PieChart>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold">{total}</span>
                <span className="text-muted-foreground text-xs">{c.employees}</span>
              </div>
            </div>
            <ul className="flex-1 space-y-2 min-w-0">
              {data.map((dept, i) => (
                <li key={dept.name} className="flex items-center gap-2 text-sm min-w-0">
                  <span
                    className="h-3 w-3 rounded-sm shrink-0"
                    style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                  />
                  <span className="truncate flex-1">
                    {locale === "ar" && dept.nameAr ? dept.nameAr : dept.name}
                  </span>
                  <span className="font-medium tabular-nums shrink-0">{dept.value}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
}
