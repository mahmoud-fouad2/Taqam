"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig
} from "@/components/ui/chart";
import type { AppLocale } from "@/lib/i18n/types";
import { getText } from "@/lib/i18n/text";
import type { DashboardPiePoint } from "@/lib/dashboard";

const chartConfig = {
  value: {
    label: "الإجازات",
    color: "hsl(var(--chart-2))"
  }
} satisfies ChartConfig;

interface Props {
  locale: AppLocale;
  data: DashboardPiePoint[];
}

export function ChartLeavesBar({ locale, data }: Props) {
  const t = getText(locale);
  const c = t.dashboardCharts;

  const chartData = data.map((d) => ({
    ...d,
    label: locale === "ar" && d.nameAr ? d.nameAr : d.name
  }));

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>{c.leavesTitle}</CardTitle>
        <CardDescription>{c.leavesSubtitle}</CardDescription>
      </CardHeader>
      <CardContent className="px-2 pt-2 sm:px-6">
        {data.length === 0 ? (
          <p className="text-muted-foreground w-full py-8 text-center text-sm">{c.noData}</p>
        ) : (
          <ChartContainer config={chartConfig} className="aspect-auto h-[200px] w-full">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ left: 0, right: 8, top: 0, bottom: 0 }}>
              <CartesianGrid horizontal={false} />
              <XAxis type="number" tickLine={false} axisLine={false} tickMargin={4} />
              <YAxis
                dataKey="label"
                type="category"
                tickLine={false}
                axisLine={false}
                tickMargin={4}
                width={90}
                tick={{ fontSize: 12 }}
              />
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <Bar dataKey="value" fill="var(--color-value)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
