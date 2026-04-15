"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  IconAlertTriangle,
  IconBuilding,
  IconGitBranch,
  IconHierarchy,
  IconRefresh,
  IconUser,
  IconUsers
} from "@tabler/icons-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmployeeStatusBadge } from "@/app/dashboard/employees/_components/employee-status-badge";
import { getEmployeeFullName } from "@/lib/types/core-hr";
import { useClientLocale } from "@/lib/i18n/use-client-locale";

type OrgPerson = {
  id: string;
  employeeNumber?: string | null;
  firstName: string;
  firstNameAr?: string | null;
  lastName: string;
  lastNameAr?: string | null;
  email?: string | null;
  avatar?: string | null;
};

type EmployeeTreeNode = OrgPerson & {
  managerId?: string | null;
  status: string;
  hasHierarchyIssue?: boolean;
  directReportsCount: number;
  department?: { id: string; name: string; nameAr?: string | null } | null;
  jobTitle?: { id?: string; name: string; nameAr?: string | null } | null;
  branch?: { id: string; name: string; nameAr?: string | null } | null;
  directReports: EmployeeTreeNode[];
};

type DepartmentTreeNode = {
  id: string;
  name: string;
  nameAr?: string | null;
  code?: string | null;
  parentId?: string | null;
  isActive?: boolean;
  employeesCount: number;
  descendantEmployeeCount: number;
  manager?: OrgPerson | null;
  hasHierarchyIssue?: boolean;
  children: DepartmentTreeNode[];
};

type OrgChartPayload = {
  employeeTree: EmployeeTreeNode[];
  departmentTree: DepartmentTreeNode[];
  stats: {
    employeesCount: number;
    departmentsCount: number;
    leadersCount: number;
    departmentRoots: number;
    employeeHierarchyIssues: number;
    departmentHierarchyIssues: number;
  };
};

function toUiEmployeeStatus(status: string): "active" | "on_leave" | "terminated" | "onboarding" {
  switch (status) {
    case "ON_LEAVE":
      return "on_leave";
    case "SUSPENDED":
    case "TERMINATED":
    case "RESIGNED":
      return "terminated";
    case "ACTIVE":
    default:
      return "active";
  }
}

function initials(person: OrgPerson) {
  return `${person.firstName?.[0] || ""}${person.lastName?.[0] || ""}`.toUpperCase();
}

export function OrganizationOrgChart() {
  const locale = useClientLocale();
  const isRtl = locale === "ar";
  const [data, setData] = useState<OrgChartPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/organization/org-chart", { cache: "no-store" });
      if (!response.ok) {
        throw new Error(isRtl ? "تعذر تحميل الهيكل التنظيمي" : "Failed to load org chart");
      }

      const json = await response.json();
      setData(json.data ?? null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isRtl
            ? "تعذر تحميل الهيكل التنظيمي"
            : "Failed to load org chart"
      );
    } finally {
      setIsLoading(false);
    }
  }, [isRtl]);

  useEffect(() => {
    void load();
  }, [load]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <Card key={item}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="mt-2 h-8 w-16" />
              </CardHeader>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          {[1, 2].map((item) => (
            <Card key={item}>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
                <Skeleton className="mt-2 h-4 w-56" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle>{isRtl ? "الهيكل التنظيمي" : "Organization chart"}</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => void load()}>
            <IconRefresh className="me-2 h-4 w-4" />
            {isRtl ? "إعادة المحاولة" : "Retry"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const statsCards = [
    {
      title: isRtl ? "الموظفون ضمن الشجرة" : "Employees in chart",
      value: data.stats.employeesCount,
      icon: IconUsers,
      tone: "bg-sky-500/10 text-sky-600"
    },
    {
      title: isRtl ? "الجذور الإدارية" : "Leadership roots",
      value: data.stats.leadersCount,
      icon: IconHierarchy,
      tone: "bg-emerald-500/10 text-emerald-600"
    },
    {
      title: isRtl ? "الأقسام" : "Departments",
      value: data.stats.departmentsCount,
      icon: IconBuilding,
      tone: "bg-amber-500/10 text-amber-600"
    },
    {
      title: isRtl ? "مشكلات الربط" : "Hierarchy issues",
      value: data.stats.employeeHierarchyIssues + data.stats.departmentHierarchyIssues,
      icon: IconAlertTriangle,
      tone: "bg-rose-500/10 text-rose-600"
    }
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="text-xl font-semibold tracking-tight">
            {isRtl ? "شجرة الإدارة والتنظيم" : "Reporting and organization chart"}
          </h3>
          <p className="text-muted-foreground text-sm">
            {isRtl
              ? "عرض مترابط للمديرين والتابعين المباشرين مع هيكل الأقسام داخل نفس المساحة."
              : "A connected view of reporting lines and department hierarchy in one workspace."}
          </p>
        </div>

        <Button variant="outline" onClick={() => void load()}>
          <IconRefresh className="me-2 h-4 w-4" />
          {isRtl ? "تحديث الشجرة" : "Refresh chart"}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statsCards.map((card) => {
          const Icon = card.icon;

          return (
            <Card key={card.title} className="border-border/70 shadow-sm">
              <CardHeader className="space-y-3 pb-4">
                <div className="flex items-center justify-between gap-3">
                  <CardDescription className="text-xs font-semibold tracking-[0.08em] uppercase">
                    {card.title}
                  </CardDescription>
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${card.tone}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <CardTitle className="text-3xl font-semibold">{card.value}</CardTitle>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>{isRtl ? "سلسلة التقارير الإدارية" : "Reporting lines"}</CardTitle>
            <CardDescription>
              {isRtl
                ? "كل بطاقة تمثل موظفًا ويمكنك فتح ملفه مباشرة من الشجرة."
                : "Each card represents an employee and links directly to their profile."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.employeeTree.length === 0 ? (
              <div className="text-muted-foreground rounded-2xl border border-dashed p-4 text-sm">
                {isRtl
                  ? "لا توجد بيانات كافية لبناء الشجرة الإدارية بعد."
                  : "There is not enough data to build the reporting chart yet."}
              </div>
            ) : (
              <div className="space-y-4">
                {data.employeeTree.map((node) => (
                  <EmployeeTreeCard key={node.id} node={node} locale={locale} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>{isRtl ? "تدرج الأقسام" : "Department hierarchy"}</CardTitle>
            <CardDescription>
              {isRtl
                ? "يعرض الأقسام الرئيسية والفرعية مع المدير المسؤول وعدد الموظفين."
                : "Shows parent and child departments with managers and employee counts."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.departmentTree.length === 0 ? (
              <div className="text-muted-foreground rounded-2xl border border-dashed p-4 text-sm">
                {isRtl ? "لا توجد أقسام معرفة بعد." : "No departments have been defined yet."}
              </div>
            ) : (
              <div className="space-y-4">
                {data.departmentTree.map((node) => (
                  <DepartmentTreeCard key={node.id} node={node} locale={locale} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function EmployeeTreeCard({
  node,
  locale,
  depth = 0
}: {
  node: EmployeeTreeNode;
  locale: "ar" | "en";
  depth?: number;
}) {
  const isRtl = locale === "ar";
  const name = getEmployeeFullName(node, locale);

  return (
    <div className={depth > 0 ? "border-border/70 ms-5 border-s border-dashed ps-4" : ""}>
      <div className="border-border/70 bg-card/80 rounded-2xl border p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={node.avatar || undefined} alt={name} />
              <AvatarFallback>{initials(node)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <Link
                href={`/dashboard/employees/${node.id}`}
                className="hover:text-primary block truncate font-medium transition-colors hover:underline">
                {name}
              </Link>
              <p className="text-muted-foreground truncate text-sm">
                {node.jobTitle?.nameAr || node.jobTitle?.name || (isRtl ? "بدون مسمى" : "No title")}
              </p>
              <p className="text-muted-foreground truncate text-xs">
                {node.department?.nameAr ||
                  node.department?.name ||
                  (isRtl ? "بدون قسم" : "No department")}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
              {node.employeeNumber || "-"}
            </Badge>
            <EmployeeStatusBadge status={toUiEmployeeStatus(node.status)} />
            {node.hasHierarchyIssue ? (
              <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-700">
                {isRtl ? "ربط غير مكتمل" : "Needs cleanup"}
              </Badge>
            ) : null}
          </div>
        </div>

        <div className="text-muted-foreground mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span>
            {isRtl ? "التابعون المباشرون:" : "Direct reports:"} {node.directReportsCount}
          </span>
          {node.branch ? <span>• {node.branch.nameAr || node.branch.name}</span> : null}
        </div>
      </div>

      {node.directReports.length > 0 ? (
        <div className="mt-3 space-y-3">
          {node.directReports.map((child) => (
            <EmployeeTreeCard key={child.id} node={child} locale={locale} depth={depth + 1} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function DepartmentTreeCard({
  node,
  locale,
  depth = 0
}: {
  node: DepartmentTreeNode;
  locale: "ar" | "en";
  depth?: number;
}) {
  const isRtl = locale === "ar";
  const managerName = node.manager ? getEmployeeFullName(node.manager, locale) : null;

  return (
    <div className={depth > 0 ? "border-border/70 ms-5 border-s border-dashed ps-4" : ""}>
      <div className="border-border/70 bg-card/80 rounded-2xl border p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate font-medium">{node.nameAr || node.name}</p>
              {node.code ? (
                <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[11px]">
                  {node.code}
                </Badge>
              ) : null}
              {node.hasHierarchyIssue ? (
                <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-700">
                  {isRtl ? "يحتاج مراجعة" : "Needs review"}
                </Badge>
              ) : null}
            </div>
            <p className="text-muted-foreground mt-1 text-sm">
              {managerName
                ? `${isRtl ? "المدير:" : "Manager:"} ${managerName}`
                : isRtl
                  ? "بدون مدير قسم محدد"
                  : "No department manager assigned"}
            </p>
          </div>

          <div className="text-muted-foreground flex shrink-0 items-center gap-2 text-xs">
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              {isRtl ? `مباشر ${node.employeesCount}` : `${node.employeesCount} direct`}
            </Badge>
            <Badge variant="outline" className="rounded-full px-3 py-1">
              {isRtl
                ? `إجمالي ${node.descendantEmployeeCount}`
                : `${node.descendantEmployeeCount} total`}
            </Badge>
          </div>
        </div>
      </div>

      {node.children.length > 0 ? (
        <div className="mt-3 space-y-3">
          {node.children.map((child) => (
            <DepartmentTreeCard key={child.id} node={child} locale={locale} depth={depth + 1} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
