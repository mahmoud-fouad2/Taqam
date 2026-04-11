"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import { useIsMobile } from "@/hooks/use-mobile";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import type { AppLocale } from "@/lib/i18n/types";
import { getText } from "@/lib/i18n/text";
import type { DashboardAttendancePoint, DashboardChartPeriod } from "@/lib/dashboard";

export const description = "Dashboard attendance chart";

export function ChartAreaInteractive({
  locale,
  initialPeriod = "week",
  initialAttendance
}: {
  locale: AppLocale;
  initialPeriod?: DashboardChartPeriod;
  initialAttendance: DashboardAttendancePoint[];
}) {
  const isMobile = useIsMobile();
  const t = getText(locale);

  const [period, setPeriod] = React.useState<DashboardChartPeriod>(initialPeriod);
  const [attendance, setAttendance] = React.useState<DashboardAttendancePoint[]>(initialAttendance);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (isMobile) {
      setPeriod("week");
    }
  }, [isMobile]);

  React.useEffect(() => {
    if (period === initialPeriod) return;

    let cancelled = false;
    setIsLoading(true);

    fetch(`/api/dashboard/charts?period=${period}`)
      .then(async (res) => {
        const json = await res.json().catch(() => null);
        if (!res.ok) throw new Error(json?.error || "Failed to fetch chart data");
        return json;
      })
      .then((json) => {
        if (cancelled) return;
        setAttendance((json?.data?.attendance as DashboardAttendancePoint[]) ?? []);
      })
      .catch(() => {
        if (cancelled) return;
        setAttendance([]);
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [period, initialPeriod]);

  const chartConfig = React.useMemo(
    () =>
      ({
        present: {
          label: t.dashboardCharts.present,
          color: "hsl(var(--primary))"
        },
        late: {
          label: t.dashboardCharts.late,
          color: "hsl(var(--chart-4))"
        },
        absent: {
          label: t.dashboardCharts.absent,
          color: "hsl(var(--destructive))"
        }
      }) satisfies ChartConfig,
    [t]
  );

  const subtitle =
    period === "month"
      ? t.dashboardCharts.attendanceSubtitleMonth
      : period === "year"
        ? t.dashboardCharts.attendanceSubtitleYear
        : t.dashboardCharts.attendanceSubtitleWeek;

  const localeForDates = locale === "ar" ? "ar-SA" : "en-US";

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>{t.dashboardCharts.attendanceTitle}</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">{subtitle}</span>
          <span className="@[540px]/card:hidden">{subtitle}</span>
          {isLoading ? <span className="ms-2">…</span> : null}
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={period}
            onValueChange={(value) => {
              if (!value) return;
              setPeriod(value as DashboardChartPeriod);
            }}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex">
            <ToggleGroupItem value="week">{t.dashboardCharts.rangeWeek}</ToggleGroupItem>
            <ToggleGroupItem value="month">{t.dashboardCharts.rangeMonth}</ToggleGroupItem>
            <ToggleGroupItem value="year">{t.dashboardCharts.rangeYear}</ToggleGroupItem>
          </ToggleGroup>
          <Select
            value={period}
            onValueChange={(value) => setPeriod(value as DashboardChartPeriod)}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a value">
              <SelectValue placeholder={t.dashboardCharts.rangeWeek} />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="week" className="rounded-lg">
                {t.dashboardCharts.rangeWeek}
              </SelectItem>
              <SelectItem value="month" className="rounded-lg">
                {t.dashboardCharts.rangeMonth}
              </SelectItem>
              <SelectItem value="year" className="rounded-lg">
                {t.dashboardCharts.rangeYear}
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <AreaChart data={attendance}>
            <defs>
              <linearGradient id="fillPresent" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-present)" stopOpacity={1.0} />
                <stop offset="95%" stopColor="var(--color-present)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillLate" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-late)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-late)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillAbsent" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-absent)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-absent)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString(localeForDates, {
                  month: "short",
                  day: "numeric"
                });
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString(localeForDates, {
                      month: "short",
                      day: "numeric"
                    });
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="absent"
              type="natural"
              fill="url(#fillAbsent)"
              stroke="var(--color-absent)"
              stackId="a"
            />
            <Area
              dataKey="late"
              type="natural"
              fill="url(#fillLate)"
              stroke="var(--color-late)"
              stackId="a"
            />
            <Area
              dataKey="present"
              type="natural"
              fill="url(#fillPresent)"
              stroke="var(--color-present)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
