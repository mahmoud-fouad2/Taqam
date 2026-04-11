"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  Clock,
  Wallet,
  Target,
  GraduationCap,
  Briefcase,
  Building2,
  BarChart3,
  PieChart,
  LineChart,
  ArrowUpRight,
  Calendar,
  Download,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useClientLocale } from "@/lib/i18n/use-client-locale";
import { getText } from "@/lib/i18n/text";

const t = getText("ar");

type KPIMetric = {
  id: string;
  name: string;
  value: number;
  unit?: string;
  target?: number;
  trend: "up" | "down" | "neutral";
  trendPercentage?: number;
};

type AnalyticsOverview = {
  currency: string;
  period: string;
  kpis: KPIMetric[];
  hr: {
    totalEmployees: number;
    newHires: number;
    terminations: number;
    turnoverRate: number;
    headcountByDepartment: Array<{ department: string; count: number }>;
    headcountByNationality: Array<{ nationality: string; count: number }>;
    ageDistribution: Array<{ range: string; count: number }>;
    employmentTypeDistribution: Array<{ type: string; count: number }>;
  };
  attendance: {
    averageAttendanceRate: number;
    lateArrivals: number;
    absences: number;
    overtimeHours: number;
    attendanceByDepartment: Array<{ department: string; rate: number }>;
  };
  payroll: {
    totalPayroll: number;
    averageSalary: number;
    salaryByDepartment: Array<{ department: string; total: number; average: number }>;
    allowancesBreakdown: Array<{ name: string; amount: number }>;
  };
};

export default function AnalyticsManager() {
  const locale = useClientLocale();
  const t = getText(locale);
  const [period, setPeriod] = useState("current-month");
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const nationalityDotColors = [
    "bg-blue-500",
    "bg-emerald-500",
    "bg-amber-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-cyan-500",
    "bg-orange-500"
  ];

  const getEmploymentTypeLabel = (type: string) => {
    switch (type) {
      case "FULL_TIME":
        return t.analytics.fullTime;
      case "PART_TIME":
        return t.analytics.partTime;
      case "CONTRACT":
        return t.analytics.contract;
      case "INTERN":
        return t.analytics.internship;
      case "TEMPORARY":
        return t.analytics.temporary;
      default:
        return type;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendColor = (trend: string, isPositive: boolean = true) => {
    if (trend === "up") return isPositive ? "text-green-600" : "text-red-600";
    if (trend === "down") return isPositive ? "text-red-600" : "text-green-600";
    return "text-gray-600";
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("ar-SA").format(num);
  };

  const formatCurrency = (num: number) => {
    const c = data?.currency || "SAR";
    return new Intl.NumberFormat("ar-SA", {
      style: "currency",
      currency: c,
      maximumFractionDigits: 0
    }).format(num);
  };

  const fetchOverview = useCallback(async (selectedPeriod: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/analytics/overview?period=${encodeURIComponent(selectedPeriod)}`,
        {
          method: "GET",
          headers: { "content-type": "application/json" }
        }
      );

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || "Failed to load analytics");
      }

      setData(json.data as AnalyticsOverview);
    } catch (e: any) {
      setData(null);
      setError(e?.message || "Failed to load analytics");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchOverview(period);
  }, [fetchOverview, period]);

  const kpis = useMemo(() => data?.kpis ?? [], [data]);
  const hr = data?.hr;
  const attendance = data?.attendance;
  const payroll = data?.payroll;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t.analytics.title}</h1>
          <p className="text-muted-foreground">{t.analytics.dashboardSubtitle}</p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="ms-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this-week">{t.common.thisWeek}</SelectItem>
              <SelectItem value="current-month">{t.common.thisMonth}</SelectItem>
              <SelectItem value="last-month">{t.common.lastMonth}</SelectItem>
              <SelectItem value="this-quarter">{t.analytics.thisQuarter}</SelectItem>
              <SelectItem value="this-year">{t.common.thisYear}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => void fetchOverview(period)} disabled={isLoading}>
            <RefreshCw className="ms-2 h-4 w-4" />
            {t.analytics.pRefresh}
          </Button>
          <Button variant="outline">
            <Download className="ms-2 h-4 w-4" />
            {t.common.exportData}
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        {kpis.map((kpi) => (
          <Card key={kpi.id}>
            <CardContent className="pt-6">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-muted-foreground text-sm">{kpi.name}</span>
                {getTrendIcon(kpi.trend)}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">
                  {kpi.unit && kpi.unit !== "%" && kpi.unit !== "h"
                    ? formatCurrency(kpi.value)
                    : kpi.unit
                      ? `${kpi.value}${kpi.unit}`
                      : formatNumber(kpi.value)}
                </span>
              </div>
              {kpi.trendPercentage !== undefined && (
                <p className={`mt-1 text-xs ${getTrendColor(kpi.trend, kpi.id !== "kpi-2")}`}>
                  {kpi.trendPercentage > 0 ? "+" : ""}
                  {kpi.trendPercentage}% {t.analytics.vsLastPeriod}
                </p>
              )}
              {kpi.target && (
                <div className="mt-2">
                  <Progress value={(kpi.value / kpi.target) * 100} className="h-1" />
                  <p className="text-muted-foreground mt-1 text-xs">
                    {t.analytics.pTarget} {kpi.target}
                    {kpi.unit}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {error && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="hr" className="w-full">
        <TabsList>
          <TabsTrigger value="hr">{t.analytics.hr}</TabsTrigger>
          <TabsTrigger value="attendance">{t.attendance.title}</TabsTrigger>
          <TabsTrigger value="payroll">{t.helpCenter.payroll}</TabsTrigger>
        </TabsList>

        {/* HR Analytics Tab */}
        <TabsContent value="hr" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">{t.analytics.totalEmployees}</p>
                    <p className="text-2xl font-bold">{formatNumber(hr?.totalEmployees || 0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">{t.analytics.newHires}</p>
                    <p className="text-2xl font-bold">{hr?.newHires || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100">
                    <TrendingDown className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">{t.analytics.leavers}</p>
                    <p className="text-2xl font-bold">{hr?.terminations || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100">
                    <Target className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">{t.analytics.turnoverRate}</p>
                    <p className="text-2xl font-bold">{hr?.turnoverRate || 0}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  {t.analytics.pEmployeeDistributionByDepartme}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(hr?.headcountByDepartment || []).map((item, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-sm font-medium">{item.department}</span>
                          <span className="text-muted-foreground text-sm">{item.count}</span>
                        </div>
                        <Progress
                          value={(item.count / Math.max(1, hr?.totalEmployees || 0)) * 100}
                          className="h-2"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  {t.analytics.pNationalityDistribution}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(hr?.headcountByNationality || []).map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-3 w-3 rounded-full ${nationalityDotColors[index % nationalityDotColors.length]}`}
                        />
                        <span className="text-sm">{item.nationality}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.count}</span>
                        <span className="text-muted-foreground text-xs">
                          ({((item.count / Math.max(1, hr?.totalEmployees || 0)) * 100).toFixed(1)}
                          %)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {t.analytics.pAgeDistribution}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(hr?.ageDistribution || []).map((item, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <span className="w-16 text-sm">{item.range}</span>
                      <div className="flex-1">
                        <Progress
                          value={(item.count / Math.max(1, hr?.totalEmployees || 0)) * 100}
                          className="h-2"
                        />
                      </div>
                      <span className="text-muted-foreground w-12 text-start text-sm">
                        {item.count}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  {t.analytics.pEmploymentType}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(hr?.employmentTypeDistribution || []).map((item, index) => (
                    <div
                      key={index}
                      className="bg-muted flex items-center justify-between rounded-lg p-3">
                      <span className="font-medium">{getEmploymentTypeLabel(item.type)}</span>
                      <Badge variant="secondary">{item.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Attendance Analytics Tab */}
        <TabsContent value="attendance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                    <Target className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">
                      {t.analytics.attendanceRateLabel}
                    </p>
                    <p className="text-2xl font-bold">{attendance?.averageAttendanceRate || 0}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">{t.analytics.delays}</p>
                    <p className="text-2xl font-bold">{attendance?.lateArrivals || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100">
                    <Users className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">{t.attendance.absent}</p>
                    <p className="text-2xl font-bold">{attendance?.absences || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                    <Clock className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">{t.common.overtime}</p>
                    <p className="text-2xl font-bold">{attendance?.overtimeHours || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                {t.analytics.pAttendanceRateByDepartment}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(attendance?.attendanceByDepartment || []).map((item, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <span className="w-32 text-sm">{item.department}</span>
                    <div className="flex-1">
                      <Progress value={item.rate} className="h-3" />
                    </div>
                    <span
                      className={`w-16 text-start text-sm font-medium ${
                        item.rate >= 95
                          ? "text-green-600"
                          : item.rate >= 90
                            ? "text-yellow-600"
                            : "text-red-600"
                      }`}>
                      {item.rate}%
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payroll Analytics Tab */}
        <TabsContent value="payroll" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                    <Wallet className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">
                      {t.salaryStructures.totalSalaries}
                    </p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(payroll?.totalPayroll || 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">{t.salaryStructures.avgSalary}</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(payroll?.averageSalary || 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  {t.analytics.pSalariesByDepartment}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(payroll?.salaryByDepartment || []).map((item, index) => (
                    <div
                      key={index}
                      className="bg-muted flex items-center justify-between rounded-lg p-3">
                      <div>
                        <span className="font-medium">{item.department}</span>
                        <p className="text-muted-foreground text-xs">
                          {t.analytics.pAverage} {formatCurrency(item.average)}
                        </p>
                      </div>
                      <span className="font-bold">{formatCurrency(item.total)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  {t.analytics.pAllowanceDistribution}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(payroll?.allowancesBreakdown || []).map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{item.name}</span>
                      <span className="font-medium">{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between border-t pt-3 font-bold">
                    <span>{t.common.total}</span>
                    <span>
                      {formatCurrency(
                        (payroll?.allowancesBreakdown || []).reduce(
                          (sum, item) => sum + item.amount,
                          0
                        )
                      )}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
