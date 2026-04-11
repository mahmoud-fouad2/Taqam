"use client";

import * as React from "react";
import {
  IconChartPie,
  IconUsers,
  IconBuilding,
  IconCalendar,
  IconDownload,
  IconTrendingUp,
  IconTrendingDown,
  IconMinus,
  IconTarget,
  IconStarFilled,
  IconLoader
} from "@tabler/icons-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { defaultPerformanceRatings, formatScore, getRatingByScore } from "@/lib/types/performance";
import { useClientLocale } from "@/lib/i18n/use-client-locale";
import { getText } from "@/lib/i18n/text";

const t = getText("ar");

type EvaluationCycle = {
  id: string;
  name: string;
  status: string;
  totalEvaluations: number;
  completedEvaluations: number;
  startDate?: string;
  endDate?: string;
};

type EmployeeEvaluation = {
  id: string;
  cycleId: string;
  employeeName: string;
  employeeNumber: string;
  employeeAvatar?: string;
  department: string;
  jobTitle: string;
  cycleName?: string;
  status: string;
  overallScore?: number;
  createdAt?: string;
};

type PerformanceGoal = {
  id: string;
  employeeName: string;
  department: string;
  title: string;
  status: string;
  progress: number;
  dueDate?: string;
  createdAt?: string;
};

type DepartmentReport = {
  department: string;
  avgScore: number;
  employees: number;
  goalsCompleted: number;
  trend: "up" | "down" | "stable";
};

function getPeriodStart(period: string): Date | null {
  const now = new Date();

  switch (period) {
    case "current_year":
      return new Date(now.getFullYear(), 0, 1);
    case "last_year":
      return new Date(now.getFullYear() - 1, 0, 1);
    case "last_quarter":
      return new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    case "last_6_months":
      return new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
    default:
      return null;
  }
}

function isWithinPeriod(dateValue: string | undefined, period: string) {
  if (!dateValue) {
    return period === "current_year";
  }

  const date = new Date(dateValue);
  const now = new Date();

  switch (period) {
    case "current_year":
      return date.getFullYear() === now.getFullYear();
    case "last_year":
      return date.getFullYear() === now.getFullYear() - 1;
    case "last_quarter":
    case "last_6_months": {
      const start = getPeriodStart(period);
      return start ? date >= start && date <= now : true;
    }
    default:
      return true;
  }
}

function buildCsv(rows: Array<Record<string, string | number>>) {
  if (rows.length === 0) {
    return "";
  }

  const headers = Object.keys(rows[0]);
  const csvRows = [headers.join(",")];

  for (const row of rows) {
    csvRows.push(
      headers.map((header) => `"${String(row[header] ?? "").replaceAll('"', '""')}"`).join(",")
    );
  }

  return csvRows.join("\n");
}

function getRatingBadgeClass(score: number) {
  if (score >= 4.5) {
    return "bg-green-100 text-green-700";
  }

  if (score >= 3.5) {
    return "bg-blue-100 text-blue-700";
  }

  if (score >= 2.5) {
    return "bg-amber-100 text-amber-700";
  }

  if (score >= 1.5) {
    return "bg-orange-100 text-orange-700";
  }

  return "bg-red-100 text-red-700";
}

function getRatingSwatchClass(color: string) {
  switch (color) {
    case "#10B981":
      return "bg-green-500";
    case "#3B82F6":
      return "bg-blue-500";
    case "#F59E0B":
      return "bg-amber-500";
    case "#F97316":
      return "bg-orange-500";
    case "#EF4444":
      return "bg-red-500";
    default:
      return "bg-gray-500";
  }
}

export function PerformanceReportsManager() {
  const locale = useClientLocale();
  const t = getText(locale);
  const [selectedCycle, setSelectedCycle] = React.useState<string>("all");
  const [selectedDepartment, setSelectedDepartment] = React.useState<string>("all");
  const [selectedPeriod, setSelectedPeriod] = React.useState<string>("current_year");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [cycles, setCycles] = React.useState<EvaluationCycle[]>([]);
  const [evaluations, setEvaluations] = React.useState<EmployeeEvaluation[]>([]);
  const [goals, setGoals] = React.useState<PerformanceGoal[]>([]);

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [cyclesRes, evaluationsRes, goalsRes] = await Promise.all([
        fetch("/api/performance/cycles", { cache: "no-store" }),
        fetch("/api/performance/evaluations", { cache: "no-store" }),
        fetch("/api/performance/goals", { cache: "no-store" })
      ]);

      const [cyclesData, evaluationsData, goalsData] = await Promise.all([
        cyclesRes.json(),
        evaluationsRes.json(),
        goalsRes.json()
      ]);

      if (!cyclesRes.ok || !evaluationsRes.ok || !goalsRes.ok) {
        throw new Error(
          cyclesData.error || evaluationsData.error || goalsData.error || t.perfReports.loadFailed
        );
      }

      setCycles(Array.isArray(cyclesData.data) ? cyclesData.data : []);
      setEvaluations(Array.isArray(evaluationsData.data) ? evaluationsData.data : []);
      setGoals(Array.isArray(goalsData.data) ? goalsData.data : []);
    } catch (loadError) {
      setCycles([]);
      setEvaluations([]);
      setGoals([]);
      setError(loadError instanceof Error ? loadError.message : t.perfReports.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [t.perfReports.loadFailed]);

  React.useEffect(() => {
    void loadData();
  }, [loadData]);

  const departmentOptions = React.useMemo(() => {
    return Array.from(
      new Set(
        [
          ...evaluations.map((evaluation) => evaluation.department),
          ...goals.map((goal) => goal.department)
        ].filter(Boolean)
      )
    ).sort((left, right) => left.localeCompare(right, "ar"));
  }, [evaluations, goals]);

  const filteredEvaluations = React.useMemo(() => {
    return evaluations.filter((evaluation) => {
      const matchesCycle = selectedCycle === "all" || evaluation.cycleId === selectedCycle;
      const matchesDepartment =
        selectedDepartment === "all" || evaluation.department === selectedDepartment;
      const matchesPeriod = isWithinPeriod(evaluation.createdAt, selectedPeriod);
      return matchesCycle && matchesDepartment && matchesPeriod;
    });
  }, [evaluations, selectedCycle, selectedDepartment, selectedPeriod]);

  const filteredGoals = React.useMemo(() => {
    return goals.filter((goal) => {
      const matchesDepartment =
        selectedDepartment === "all" || goal.department === selectedDepartment;
      const matchesPeriod = isWithinPeriod(goal.dueDate || goal.createdAt, selectedPeriod);
      return matchesDepartment && matchesPeriod;
    });
  }, [goals, selectedDepartment, selectedPeriod]);

  const completedEvaluations = React.useMemo(
    () =>
      filteredEvaluations.filter(
        (evaluation) => evaluation.status === "completed" && evaluation.overallScore !== undefined
      ),
    [filteredEvaluations]
  );

  const completedGoals = React.useMemo(
    () => filteredGoals.filter((goal) => goal.status === "completed"),
    [filteredGoals]
  );

  const avgScore = React.useMemo(() => {
    if (completedEvaluations.length === 0) {
      return 0;
    }

    return (
      completedEvaluations.reduce((sum, evaluation) => sum + (evaluation.overallScore || 0), 0) /
      completedEvaluations.length
    );
  }, [completedEvaluations]);

  const goalsCompletionRate = React.useMemo(() => {
    if (filteredGoals.length === 0) {
      return 0;
    }

    return (completedGoals.length / filteredGoals.length) * 100;
  }, [completedGoals.length, filteredGoals.length]);

  const departmentPerformance = React.useMemo<DepartmentReport[]>(() => {
    const departmentNames = Array.from(
      new Set(
        [
          ...filteredEvaluations.map((evaluation) => evaluation.department),
          ...filteredGoals.map((goal) => goal.department)
        ].filter(Boolean)
      )
    );

    return departmentNames
      .map((department) => {
        const departmentEvaluations = completedEvaluations.filter(
          (evaluation) => evaluation.department === department
        );
        const departmentGoals = filteredGoals.filter((goal) => goal.department === department);
        const departmentCompletedGoals = departmentGoals.filter(
          (goal) => goal.status === "completed"
        );
        const employeeCount = new Set(
          filteredEvaluations
            .filter((evaluation) => evaluation.department === department)
            .map((evaluation) => evaluation.employeeNumber || evaluation.employeeName)
        ).size;

        const departmentAvgScore =
          departmentEvaluations.length > 0
            ? departmentEvaluations.reduce(
                (sum, evaluation) => sum + (evaluation.overallScore || 0),
                0
              ) / departmentEvaluations.length
            : 0;

        let trend: DepartmentReport["trend"] = "stable";
        if (departmentAvgScore > avgScore + 0.15) {
          trend = "up";
        } else if (departmentAvgScore < avgScore - 0.15 && departmentAvgScore > 0) {
          trend = "down";
        }

        return {
          department,
          avgScore: departmentAvgScore,
          employees: employeeCount,
          goalsCompleted:
            departmentGoals.length > 0
              ? Math.round((departmentCompletedGoals.length / departmentGoals.length) * 100)
              : 0,
          trend
        };
      })
      .sort((left, right) => right.avgScore - left.avgScore);
  }, [filteredEvaluations, filteredGoals, completedEvaluations, avgScore]);

  const topPerformers = React.useMemo(() => {
    return [...completedEvaluations]
      .sort((left, right) => (right.overallScore || 0) - (left.overallScore || 0))
      .slice(0, 10);
  }, [completedEvaluations]);

  const ratingDistribution = React.useMemo(() => {
    return defaultPerformanceRatings.map((rating) => {
      const count = completedEvaluations.filter(
        (evaluation) =>
          evaluation.overallScore !== undefined &&
          evaluation.overallScore >= rating.minScore &&
          evaluation.overallScore <= rating.maxScore
      ).length;

      return {
        rating: rating.label,
        count,
        percentage:
          completedEvaluations.length > 0
            ? Math.round((count / completedEvaluations.length) * 100)
            : 0
      };
    });
  }, [completedEvaluations]);

  const scoreDeviation = React.useMemo(() => {
    if (completedEvaluations.length === 0) {
      return 0;
    }

    const variance =
      completedEvaluations.reduce((sum, evaluation) => {
        const diff = (evaluation.overallScore || 0) - avgScore;
        return sum + diff * diff;
      }, 0) / completedEvaluations.length;

    return Math.sqrt(variance);
  }, [completedEvaluations, avgScore]);

  const bestDepartment = departmentPerformance[0];

  const getTrendIcon = (trend: DepartmentReport["trend"]) => {
    switch (trend) {
      case "up":
        return <IconTrendingUp className="h-4 w-4 text-green-600" />;
      case "down":
        return <IconTrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <IconMinus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRatingLabel = (score: number) => {
    const rating = getRatingByScore(score, defaultPerformanceRatings);
    return rating?.label || t.common.unspecified;
  };

  const getRatingColor = (score: number) => {
    const rating = getRatingByScore(score, defaultPerformanceRatings);
    return rating?.color || "#6b7280";
  };

  function handleExport() {
    const csv = buildCsv(
      completedEvaluations.map((evaluation) => ({
        employeeName: evaluation.employeeName,
        employeeNumber: evaluation.employeeNumber,
        department: evaluation.department,
        jobTitle: evaluation.jobTitle,
        cycleName: evaluation.cycleName || "",
        overallScore: evaluation.overallScore || 0,
        rating: getRatingLabel(evaluation.overallScore || 0)
      }))
    );

    if (!csv) {
      toast.error(t.perfReports.noExportData);
      return;
    }

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "performance-report.csv";
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t.perfReports.reportExported);
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="border-destructive/30 bg-destructive/5 text-destructive rounded-lg border p-4">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t.perfReports.title}</h2>
          <p className="text-muted-foreground">{t.perfReports.subtitle}</p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <IconDownload className="ms-2 h-4 w-4" />
          {t.common.exportData}
        </Button>
      </div>

      <div className="flex flex-wrap gap-4">
        <Select value={selectedCycle} onValueChange={setSelectedCycle}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder={t.evaluations.evaluationCycle} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.trainingCourses.allCourses}</SelectItem>
            {cycles.map((cycle) => (
              <SelectItem key={cycle.id} value={cycle.id}>
                {cycle.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder={t.common.department} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.common.allDepartments}</SelectItem>
            {departmentOptions.map((department) => (
              <SelectItem key={department} value={department}>
                {department}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder={t.common.period} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="current_year">{t.perfReports.currentYear}</SelectItem>
            <SelectItem value="last_year">{t.perfReports.lastYear}</SelectItem>
            <SelectItem value="last_quarter">{t.perfReports.lastQuarter}</SelectItem>
            <SelectItem value="last_6_months">{t.perfReports.last6Months}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <IconLoader className="text-primary h-8 w-8 animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <IconUsers className="h-4 w-4" />
                  {t.perfReports.completedEvaluations}
                </CardDescription>
                <CardTitle className="text-3xl">{completedEvaluations.length}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  {t.perfReports.outOf} {filteredEvaluations.length} {t.perfReports.evaluation}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <IconStarFilled className="h-4 w-4" />
                  {t.perfReports.avgScore}
                </CardDescription>
                <CardTitle className="text-3xl">{formatScore(avgScore)}</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge className={getRatingBadgeClass(avgScore)}>{getRatingLabel(avgScore)}</Badge>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <IconTarget className="h-4 w-4" />
                  {t.performanceGoals.completedGoals}
                </CardDescription>
                <CardTitle className="text-3xl">{Math.round(goalsCompletionRate)}%</CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={goalsCompletionRate} className="h-2" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <IconBuilding className="h-4 w-4" />
                  {t.perfReports.pTopDepartment}
                </CardDescription>
                <CardTitle className="text-xl">{bestDepartment?.department || "-"}</CardTitle>
              </CardHeader>
              <CardContent>
                {bestDepartment ? (
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-700">
                      {formatScore(bestDepartment.avgScore)}
                    </Badge>
                    {getTrendIcon(bestDepartment.trend)}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">{t.perfReports.insufficientData}</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">{t.perfReports.overview}</TabsTrigger>
              <TabsTrigger value="departments">{t.common.departments}</TabsTrigger>
              <TabsTrigger value="top-performers">{t.perfReports.topPerformers}</TabsTrigger>
              <TabsTrigger value="distribution">{t.evaluations.ratingDistribution}</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <IconChartPie className="h-4 w-4" />
                      {t.perfReports.pEvaluationDistribution}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {ratingDistribution.map((item) => (
                        <div key={item.rating} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span>{item.rating}</span>
                            <span className="font-medium">
                              {item.count} ({item.percentage}%)
                            </span>
                          </div>
                          <Progress value={item.percentage} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <IconTarget className="h-4 w-4" />
                      {t.perfReports.pGoalsProgress}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        {
                          label: t.perfReports.completedGoals,
                          value: completedGoals.length,
                          total: filteredGoals.length,
                          color: "bg-green-500"
                        },
                        {
                          label: t.common.inProgress,
                          value: filteredGoals.filter((goal) => goal.status === "in-progress")
                            .length,
                          total: filteredGoals.length,
                          color: "bg-blue-500"
                        },
                        {
                          label: t.perfReports.overdue,
                          value: filteredGoals.filter((goal) => goal.status === "overdue").length,
                          total: filteredGoals.length,
                          color: "bg-red-500"
                        }
                      ].map((item) => (
                        <div key={item.label} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`h-3 w-3 rounded-full ${item.color}`} />
                            <span className="text-sm">{item.label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{item.value}</span>
                            <span className="text-muted-foreground text-sm">
                              ({item.total > 0 ? Math.round((item.value / item.total) * 100) : 0}%)
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <IconCalendar className="h-4 w-4" />
                      {t.perfReports.pLatestCompletedEvaluations}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t.common.employee}</TableHead>
                          <TableHead>{t.common.department}</TableHead>
                          <TableHead>{t.trainingCourses.course}</TableHead>
                          <TableHead>{t.perfReports.finalEval}</TableHead>
                          <TableHead>{t.jobTitles.level}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {completedEvaluations.slice(0, 5).map((evaluation) => (
                          <TableRow key={evaluation.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={evaluation.employeeAvatar} alt="" />
                                  <AvatarFallback>
                                    {evaluation.employeeName.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <span>{evaluation.employeeName}</span>
                              </div>
                            </TableCell>
                            <TableCell>{evaluation.department}</TableCell>
                            <TableCell>{evaluation.cycleName || "-"}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {formatScore(evaluation.overallScore || 0)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={getRatingBadgeClass(evaluation.overallScore || 0)}>
                                {getRatingLabel(evaluation.overallScore || 0)}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="departments">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t.perfReports.deptPerformance}</CardTitle>
                  <CardDescription>{t.perfReports.deptPerformanceDesc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t.common.department}</TableHead>
                        <TableHead>{t.common.employees}</TableHead>
                        <TableHead>{t.evaluations.avgRating}</TableHead>
                        <TableHead>{t.performanceGoals.completedGoals}</TableHead>
                        <TableHead>{t.perfReports.trend}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {departmentPerformance.map((department) => (
                        <TableRow key={department.department}>
                          <TableCell className="font-medium">{department.department}</TableCell>
                          <TableCell>{department.employees}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge className={getRatingBadgeClass(department.avgScore)}>
                                {formatScore(department.avgScore)}
                              </Badge>
                              <span className="text-muted-foreground text-sm">
                                {getRatingLabel(department.avgScore)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={department.goalsCompleted} className="h-2 w-20" />
                              <span className="text-sm">{department.goalsCompleted}%</span>
                            </div>
                          </TableCell>
                          <TableCell>{getTrendIcon(department.trend)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="top-performers">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t.perfReports.topEmployees}</CardTitle>
                  <CardDescription>{t.perfReports.topEmployeesDesc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topPerformers.map((performer, index) => (
                      <div
                        key={performer.id}
                        className="flex items-center justify-between rounded-lg border p-4">
                        <div className="flex items-center gap-4">
                          <div className="bg-muted flex h-8 w-8 items-center justify-center rounded-full font-bold">
                            {index + 1}
                          </div>
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={performer.employeeAvatar} alt="" />
                            <AvatarFallback>{performer.employeeName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{performer.employeeName}</p>
                            <p className="text-muted-foreground text-sm">
                              {performer.jobTitle} - {performer.department}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <IconStarFilled
                                key={star}
                                className={`h-4 w-4 ${star <= Math.round(performer.overallScore || 0) ? "text-yellow-500" : "text-gray-300"}`}
                              />
                            ))}
                          </div>
                          <Badge
                            className={`px-3 text-lg ${getRatingBadgeClass(performer.overallScore || 0)}`}>
                            {formatScore(performer.overallScore || 0)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="distribution">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">{t.evaluations.ratingDistribution}</CardTitle>
                    <CardDescription>{t.perfReports.evalLevelDist}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {defaultPerformanceRatings.map((rating) => {
                        const count = completedEvaluations.filter(
                          (evaluation) =>
                            evaluation.overallScore !== undefined &&
                            evaluation.overallScore >= rating.minScore &&
                            evaluation.overallScore <= rating.maxScore
                        ).length;
                        const percentage =
                          completedEvaluations.length > 0
                            ? (count / completedEvaluations.length) * 100
                            : 0;

                        return (
                          <div key={rating.label} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div
                                  className={`h-4 w-4 rounded ${getRatingSwatchClass(rating.color)}`}
                                />
                                <span className="font-medium">{rating.label}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">
                                  {count} {t.perfReports.employeeCount}
                                </span>
                                <Badge variant="outline">{Math.round(percentage)}%</Badge>
                              </div>
                            </div>
                            <Progress value={percentage} className="h-3" />
                            <p className="text-muted-foreground text-xs">
                              {t.perfReports.range} {rating.minScore} - {rating.maxScore}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">{t.perfReports.quickStats}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="bg-muted flex items-center justify-between rounded-lg p-3">
                        <span>{t.perfReports.highestEval}</span>
                        <Badge className="bg-green-100 text-green-700">
                          {formatScore(
                            Math.max(
                              ...completedEvaluations.map(
                                (evaluation) => evaluation.overallScore || 0
                              ),
                              0
                            )
                          )}
                        </Badge>
                      </div>
                      <div className="bg-muted flex items-center justify-between rounded-lg p-3">
                        <span>{t.perfReports.lowestEval}</span>
                        <Badge className="bg-red-100 text-red-700">
                          {formatScore(
                            Math.min(
                              ...completedEvaluations.map(
                                (evaluation) => evaluation.overallScore || 0
                              ),
                              completedEvaluations.length > 0
                                ? completedEvaluations[0].overallScore || 0
                                : 0
                            )
                          )}
                        </Badge>
                      </div>
                      <div className="bg-muted flex items-center justify-between rounded-lg p-3">
                        <span>{t.perfReports.average}</span>
                        <Badge className="bg-blue-100 text-blue-700">{formatScore(avgScore)}</Badge>
                      </div>
                      <div className="bg-muted flex items-center justify-between rounded-lg p-3">
                        <span>{t.perfReports.stdDeviation}</span>
                        <Badge variant="outline">{formatScore(scoreDeviation)}</Badge>
                      </div>
                      <div className="bg-muted flex items-center justify-between rounded-lg p-3">
                        <span>{t.perfReports.aboveAverage}</span>
                        <Badge className="bg-green-100 text-green-700">
                          {
                            completedEvaluations.filter(
                              (evaluation) => (evaluation.overallScore || 0) >= avgScore
                            ).length
                          }
                        </Badge>
                      </div>
                      <div className="bg-muted flex items-center justify-between rounded-lg p-3">
                        <span>{t.perfReports.belowAverage}</span>
                        <Badge className="bg-orange-100 text-orange-700">
                          {
                            completedEvaluations.filter(
                              (evaluation) => (evaluation.overallScore || 0) < avgScore
                            ).length
                          }
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
