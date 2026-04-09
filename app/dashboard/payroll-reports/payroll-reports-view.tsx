"use client";

import * as React from "react";
import {
  IconDownload,
  IconFilter,
  IconCalendar,
  IconCurrencyRiyal,
  IconUsers,
  IconBuilding,
  IconTrendingUp,
  IconChartBar,
  IconFileSpreadsheet,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency, getMonthName } from "@/lib/types/payroll";
import { useClientLocale } from "@/lib/i18n/use-client-locale";
import { getText } from "@/lib/i18n/text";

const t = getText("ar");

type DepartmentOption = { id: string; name: string; nameAr?: string | null };

type DepartmentStat = {
  id: string;
  name: string;
  employeeCount: number;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  avgSalary: number;
  gosiBase: number;
  gosiEmployee: number;
  gosiEmployer: number;
};

type MonthlyTrendItem = {
  month: string;
  totalGross: number;
  totalNet: number;
  employeeCount: number;
};

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { cache: "no-store", ...init });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json?.error || "Request failed");
  }
  return json as T;
}

export function PayrollReportsView() {
  const locale = useClientLocale();
  const t = getText(locale);
  const [yearFilter, setYearFilter] = React.useState(String(new Date().getFullYear()));
  const [monthFilter, setMonthFilter] = React.useState("all");
  const [departmentFilter, setDepartmentFilter] = React.useState("all");
  const [departments, setDepartments] = React.useState<DepartmentOption[]>([]);
  const [departmentStats, setDepartmentStats] = React.useState<DepartmentStat[]>([]);
  const [monthlyTrend, setMonthlyTrend] = React.useState<MonthlyTrendItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    fetchJson<{ data: any[] }>("/api/departments")
      .then(({ data }) => {
        setDepartments(
          data.map((d) => ({ id: d.id, name: d.name, nameAr: d.nameAr }))
        );
      })
      .catch((e) => {
        console.error(e);
        toast.error(e?.message || t.jobPostings.fetchDeptsFailed);
      });
  }, [t.jobPostings.fetchDeptsFailed]);

  React.useEffect(() => {
    setIsLoading(true);
    fetchJson<{ data: { departmentStats: DepartmentStat[]; monthlyTrend: MonthlyTrendItem[] } }>(
      `/api/payroll/reports?year=${encodeURIComponent(yearFilter)}&month=${encodeURIComponent(
        monthFilter
      )}&departmentId=${encodeURIComponent(departmentFilter)}`
    )
      .then(({ data }) => {
        setDepartmentStats(data.departmentStats);
        setMonthlyTrend(data.monthlyTrend);
      })
      .catch((e) => {
        console.error(e);
        toast.error(e?.message || t.perfReports.loadReportFailed);
      })
      .finally(() => setIsLoading(false));
  }, [yearFilter, monthFilter, departmentFilter, t.perfReports.loadReportFailed]);

  // Calculate totals
  const totalStats = {
    totalGross: departmentStats.reduce((sum, d) => sum + d.totalGross, 0),
    totalDeductions: departmentStats.reduce((sum, d) => sum + d.totalDeductions, 0),
    totalNet: departmentStats.reduce((sum, d) => sum + d.totalNet, 0),
    totalEmployees: departmentStats.reduce((sum, d) => sum + d.employeeCount, 0),
    avgSalary: departmentStats.length
      ? departmentStats.reduce((sum, d) => sum + d.avgSalary, 0) / departmentStats.length
      : 0,
    gosiBase: departmentStats.reduce((sum, d) => sum + d.gosiBase, 0),
    gosiEmployee: departmentStats.reduce((sum, d) => sum + d.gosiEmployee, 0),
    gosiEmployer: departmentStats.reduce((sum, d) => sum + d.gosiEmployer, 0),
  };

  const handleExportCSV = () => {
    // Generate CSV content
    const headers = [t.common.department, t.common.employees, t.payrollReports.totalSalaries, t.payroll.deductions, t.payroll.net, t.payrollReports.avgSalary];
    const rows = departmentStats.map((d) => [
      d.name,
      d.employeeCount,
      d.totalGross,
      d.totalDeductions,
      d.totalNet,
      d.avgSalary,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.join(",")),
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `payroll-report-${yearFilter}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.salaryStructures.totalSalaries}</CardTitle>
            <IconCurrencyRiyal className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{formatCurrency(totalStats.totalGross)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.payroll.deductionsCol}</CardTitle>
            <IconTrendingUp className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-red-600">
              {formatCurrency(totalStats.totalDeductions)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.salaryStructures.netSalaries}</CardTitle>
            <IconCurrencyRiyal className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-green-600">
              {formatCurrency(totalStats.totalNet)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.common.employees}</CardTitle>
            <IconUsers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.totalEmployees}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.salaryStructures.avgSalary}</CardTitle>
            <IconChartBar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{formatCurrency(totalStats.avgSalary)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Select value={yearFilter} onValueChange={setYearFilter}>
            <SelectTrigger className="w-[120px]">
              <IconCalendar className="h-4 w-4 ms-2" />
              <SelectValue placeholder={t.common.year} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
            </SelectContent>
          </Select>
          <Select value={monthFilter} onValueChange={setMonthFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder={t.payrollReports.month} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.payrollReports.allMonths}</SelectItem>
              {Array.from({ length: 12 }, (_, i) => (
                <SelectItem key={i + 1} value={(i + 1).toString()}>
                  {getMonthName(i + 1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-[160px]">
              <IconFilter className="h-4 w-4 ms-2" />
              <SelectValue placeholder={t.common.department} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.common.allDepartments}</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id}>
                  {dept.nameAr || dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" onClick={handleExportCSV}>
          <IconDownload className="ms-2 h-4 w-4" />{t.common.exportData}</Button>
      </div>

      <Tabs defaultValue="departments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="departments">
            <IconBuilding className="h-4 w-4 ms-2" />
            {t.payrollReports.pByDepartment}
          </TabsTrigger>
          <TabsTrigger value="trend">
            <IconTrendingUp className="h-4 w-4 ms-2" />
            {t.payrollReports.pMonthlyTrend}
          </TabsTrigger>
          <TabsTrigger value="gosi">
            <IconFileSpreadsheet className="h-4 w-4 ms-2" />
            {t.payrollReports.pInsuranceReport}
          </TabsTrigger>
        </TabsList>

        {/* Department Stats */}
        <TabsContent value="departments">
          <Card>
            <CardHeader>
              <CardTitle>{t.payrollReports.payrollByDept}</CardTitle>
              <CardDescription>{t.payrollReports.payrollByDeptDesc}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.common.department}</TableHead>
                    <TableHead>{t.common.employees}</TableHead>
                    <TableHead>{t.salaryStructures.totalSalaries}</TableHead>
                    <TableHead>{t.payroll.deductionsCol}</TableHead>
                    <TableHead>{t.payroll.netCol}</TableHead>
                    <TableHead>{t.salaryStructures.avgSalary}</TableHead>
                    <TableHead>{t.payrollReports.percentage}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">{t.common.loading}</TableCell>
                    </TableRow>
                  )}
                  {departmentStats.map((dept) => (
                    <TableRow key={dept.id}>
                      <TableCell className="font-medium">{dept.name}</TableCell>
                      <TableCell>{dept.employeeCount}</TableCell>
                      <TableCell>{formatCurrency(dept.totalGross)}</TableCell>
                      <TableCell className="text-red-600">
                        -{formatCurrency(dept.totalDeductions)}
                      </TableCell>
                      <TableCell className="font-bold">
                        {formatCurrency(dept.totalNet)}
                      </TableCell>
                      <TableCell>{formatCurrency(dept.avgSalary)}</TableCell>
                      <TableCell className="w-32">
                        <div className="flex items-center gap-2">
                          <Progress
                            value={(dept.totalNet / totalStats.totalNet) * 100}
                            className="h-2"
                          />
                          <span className="text-xs text-muted-foreground w-10">
                            {((dept.totalNet / totalStats.totalNet) * 100).toFixed(0)}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold bg-muted">
                    <TableCell>{t.common.total}</TableCell>
                    <TableCell>{totalStats.totalEmployees}</TableCell>
                    <TableCell>{formatCurrency(totalStats.totalGross)}</TableCell>
                    <TableCell className="text-red-600">
                      -{formatCurrency(totalStats.totalDeductions)}
                    </TableCell>
                    <TableCell>{formatCurrency(totalStats.totalNet)}</TableCell>
                    <TableCell>{formatCurrency(totalStats.avgSalary)}</TableCell>
                    <TableCell>100%</TableCell>
                  </TableRow>
                </TableBody>
                  {isLoading && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">{t.common.loading}</TableCell>
                    </TableRow>
                  )}
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monthly Trend */}
        <TabsContent value="trend">
          <Card>
            <CardHeader>
              <CardTitle>{t.payrollReports.monthlyTrend} {t.payrollReports.pForPayroll}</CardTitle>
              <CardDescription>{t.payrollReports.monthlyTrendDesc}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.common.month}</TableHead>
                    <TableHead>{t.common.employees}</TableHead>
                    <TableHead>{t.salaryStructures.totalSalaries}</TableHead>
                    <TableHead>{t.salaryStructures.netSalaries}</TableHead>
                    <TableHead>{t.payrollReports.change}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyTrend.map((month, index) => {
                    const prevMonth = index > 0 ? monthlyTrend[index - 1] : null;
                    const change = prevMonth
                      ? ((month.totalNet - prevMonth.totalNet) / prevMonth.totalNet) * 100
                      : 0;
                    return (
                      <TableRow key={month.month}>
                        <TableCell className="font-medium">{month.month}</TableCell>
                        <TableCell>{month.employeeCount}</TableCell>
                        <TableCell>{formatCurrency(month.totalGross)}</TableCell>
                        <TableCell>{formatCurrency(month.totalNet)}</TableCell>
                        <TableCell>
                          {index > 0 && (
                            <span
                              className={
                                change > 0
                                  ? "text-green-600"
                                  : change < 0
                                  ? "text-red-600"
                                  : ""
                              }
                            >
                              {change > 0 ? "+" : ""}
                              {change.toFixed(1)}%
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* GOSI Report */}
        <TabsContent value="gosi">
          <Card>
            <CardHeader>
              <CardTitle>{t.payrollReports.gosiReport}  (GOSI)</CardTitle>
              <CardDescription>
                {t.payrollReports.pSummaryOfSocialInsuranceSubscr}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{t.payrollReports.employeeShare}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {formatCurrency(totalStats.gosiEmployee)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{t.payrollReports.employerShare}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">
                      {formatCurrency(totalStats.gosiEmployer)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{t.payrollReports.totalSubscriptions}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(totalStats.gosiEmployee + totalStats.gosiEmployer)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.common.department}</TableHead>
                    <TableHead>{t.payrollReports.subjectSalary}</TableHead>
                    <TableHead>{t.payrollReports.employeeShareCol}</TableHead>
                    <TableHead>{t.payrollReports.employerShareCol}</TableHead>
                    <TableHead>{t.common.total}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departmentStats.map((dept) => {
                    return (
                      <TableRow key={dept.id}>
                        <TableCell className="font-medium">{dept.name}</TableCell>
                        <TableCell>{formatCurrency(dept.gosiBase)}</TableCell>
                        <TableCell className="text-blue-600">
                          {formatCurrency(dept.gosiEmployee)}
                        </TableCell>
                        <TableCell className="text-orange-600">
                          {formatCurrency(dept.gosiEmployer)}
                        </TableCell>
                        <TableCell className="font-bold">
                          {formatCurrency(dept.gosiEmployee + dept.gosiEmployer)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              <div className="flex justify-end">
                <Button variant="outline">
                  <IconDownload className="ms-2 h-4 w-4" />
                  {t.payrollReports.pExportInsuranceReport}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
