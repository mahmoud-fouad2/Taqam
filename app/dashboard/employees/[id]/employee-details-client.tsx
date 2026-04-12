"use client";

import Link from "next/link";
import {
  IconArrowLeft,
  IconArrowRight,
  IconBriefcase,
  IconBuilding,
  IconCalendar,
  IconClock,
  IconId,
  IconMail,
  IconMapPin,
  IconPencil,
  IconPhone,
  IconUser,
  IconUsers
} from "@tabler/icons-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmployeeStatusBadge } from "../_components/employee-status-badge";
import { getEmployeeFullName } from "@/lib/types/core-hr";
import { formatCurrency } from "@/lib/types/payroll";
import { useClientLocale } from "@/lib/i18n/use-client-locale";
import { getText } from "@/lib/i18n/text";

type Nameable = {
  firstName: string;
  firstNameAr?: string;
  lastName: string;
  lastNameAr?: string;
};

type EmployeeProfile = Nameable & {
  id: string;
  employeeNumber: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  nationalId: string | null;
  hireDate: string;
  employmentType: string;
  status: "active" | "on_leave" | "terminated" | "onboarding";
  workLocation: string | null;
  baseSalary: string | null;
  currency: string;
  createdAt: string;
  updatedAt: string;
  department: { id: string; name: string; nameAr: string | null } | null;
  jobTitle: { id: string; name: string; nameAr: string | null } | null;
  branch: { id: string; name: string; nameAr: string | null; city: string | null } | null;
  shift: { id: string; name: string; nameAr: string | null } | null;
  manager: (Nameable & {
    id: string;
    employeeNumber: string | null;
    email: string | null;
    avatar: string | null;
    jobTitle: { name: string; nameAr: string | null } | null;
  }) | null;
  directReports: Array<
    Nameable & {
      id: string;
      employeeNumber: string | null;
      email: string | null;
      avatar: string | null;
      status: "active" | "on_leave" | "terminated" | "onboarding";
      jobTitle: { name: string; nameAr: string | null } | null;
    }
  >;
  user: {
    id: string;
    email: string | null;
    role: string;
    status: string;
  } | null;
};

interface Props {
  employee: EmployeeProfile;
  initialLocale: "ar" | "en";
}

function formatDate(iso: string, locale: "ar" | "en") {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

function getInitials(person: Nameable) {
  return `${person.firstName?.[0] || ""}${person.lastName?.[0] || ""}`.toUpperCase();
}

function getEmploymentTypeLabel(value: string, locale: "ar" | "en") {
  switch (value) {
    case "PART_TIME":
      return locale === "ar" ? "دوام جزئي" : "Part-time";
    case "CONTRACT":
      return locale === "ar" ? "عقد" : "Contract";
    case "INTERN":
      return locale === "ar" ? "تدريب" : "Internship";
    case "TEMPORARY":
      return locale === "ar" ? "مؤقت" : "Temporary";
    case "FULL_TIME":
    default:
      return locale === "ar" ? "دوام كامل" : "Full-time";
  }
}

function getUserStatusLabel(value: string, locale: "ar" | "en") {
  switch (value) {
    case "ACTIVE":
      return locale === "ar" ? "نشط" : "Active";
    case "PENDING_VERIFICATION":
      return locale === "ar" ? "بانتظار التفعيل" : "Pending activation";
    case "SUSPENDED":
      return locale === "ar" ? "موقوف" : "Suspended";
    case "INACTIVE":
      return locale === "ar" ? "غير نشط" : "Inactive";
    default:
      return value;
  }
}

function getRoleLabel(value: string, locale: "ar" | "en") {
  if (locale === "en") return value;

  switch (value) {
    case "TENANT_ADMIN":
      return "مدير الشركة";
    case "HR_MANAGER":
      return "مدير الموارد البشرية";
    case "MANAGER":
      return "مدير";
    case "EMPLOYEE":
      return "موظف";
    default:
      return value;
  }
}

export default function EmployeeDetailsClient({ employee, initialLocale }: Props) {
  const locale = useClientLocale(initialLocale);
  const t = getText(locale);
  const isRtl = locale === "ar";
  const ArrowIcon = isRtl ? IconArrowRight : IconArrowLeft;
  const fullName = getEmployeeFullName(employee, locale);
  const managerName = employee.manager ? getEmployeeFullName(employee.manager, locale) : null;
  const directReportsCount = employee.directReports.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" aria-label={t.common.back} asChild>
            <Link href="/dashboard/employees">
              <ArrowIcon className="h-5 w-5" />
            </Link>
          </Button>

          <div className="flex min-w-0 items-start gap-4">
            <Avatar className="h-20 w-20 rounded-3xl border border-border/70 shadow-sm">
              <AvatarImage src={employee.avatar || undefined} alt={fullName} />
              <AvatarFallback className="text-lg font-semibold">
                {getInitials(employee)}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 space-y-2">
              <div>
                <p className="text-muted-foreground text-sm">
                  {isRtl ? "ملف الموظف" : "Employee profile"}
                </p>
                <h1 className="truncate text-2xl font-bold tracking-tight">{fullName}</h1>
                <p className="text-muted-foreground truncate text-sm">
                  {employee.jobTitle?.nameAr || employee.jobTitle?.name || "-"}
                  {employee.department ? ` • ${employee.department.nameAr || employee.department.name}` : ""}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
                  {employee.employeeNumber}
                </Badge>
                <EmployeeStatusBadge status={employee.status} />
                {employee.user ? (
                  <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs">
                    {getRoleLabel(employee.user.role, locale)}
                  </Badge>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/employees?edit=${employee.id}`}>
              <IconPencil className="me-2 h-4 w-4" />
              {t.common.edit}
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_340px]">
        <div className="space-y-4">
          <Card className="border-border/70 shadow-sm">
            <CardContent className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-border/70 bg-card/80 p-4">
                <p className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.08em]">
                  {t.common.email}
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-xl">
                    <IconMail className="text-primary h-5 w-5" />
                  </div>
                  <p className="min-w-0 truncate text-sm font-medium">{employee.email}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-border/70 bg-card/80 p-4">
                <p className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.08em]">
                  {t.workflows.directManager}
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="bg-sky-500/10 flex h-10 w-10 items-center justify-center rounded-xl">
                    <IconUser className="h-5 w-5 text-sky-600" />
                  </div>
                  <div className="min-w-0">
                    {employee.manager ? (
                      <Link
                        href={`/dashboard/employees/${employee.manager.id}`}
                        className="block truncate text-sm font-medium transition-colors hover:text-primary hover:underline">
                        {managerName}
                      </Link>
                    ) : (
                      <p className="text-sm font-medium">-</p>
                    )}
                    <p className="text-muted-foreground truncate text-xs">
                      {employee.manager?.jobTitle?.nameAr || employee.manager?.jobTitle?.name ||
                        (isRtl ? "غير محدد" : "Not assigned")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border/70 bg-card/80 p-4">
                <p className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.08em]">
                  {isRtl ? "الفريق التابع" : "Direct reports"}
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="bg-emerald-500/10 flex h-10 w-10 items-center justify-center rounded-xl">
                    <IconUsers className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold">{directReportsCount}</p>
                    <p className="text-muted-foreground text-xs">
                      {isRtl ? "موظفون يرفعون له مباشرة" : "Employees reporting directly"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border/70 bg-card/80 p-4">
                <p className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.08em]">
                  {t.common.hireDate}
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="bg-amber-500/10 flex h-10 w-10 items-center justify-center rounded-xl">
                    <IconCalendar className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{formatDate(employee.hireDate, locale)}</p>
                    <p className="text-muted-foreground text-xs">
                      {getEmploymentTypeLabel(employee.employmentType, locale)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">{isRtl ? "نظرة عامة" : "Overview"}</TabsTrigger>
              <TabsTrigger value="work">{isRtl ? "العمل" : "Work"}</TabsTrigger>
              <TabsTrigger value="team">{isRtl ? "الفريق" : "Team"}</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4 space-y-4">
              <Card className="border-border/70 shadow-sm">
                <CardHeader>
                  <CardTitle>{isRtl ? "البيانات الأساسية" : "Core details"}</CardTitle>
                  <CardDescription>
                    {isRtl
                      ? "البيانات الشخصية والحسابية المرتبطة بالموظف"
                      : "Personal and account-linked employee details"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <InfoItem icon={IconId} label={t.employees.employeeNumber} value={employee.employeeNumber} />
                  <InfoItem icon={IconMail} label={t.common.email} value={employee.email} dir="ltr" />
                  <InfoItem icon={IconPhone} label={t.common.phone} value={employee.phone || "-"} dir="ltr" />
                  <InfoItem icon={IconId} label={t.employees.nationalId} value={employee.nationalId || "-"} />
                  <InfoItem
                    icon={IconBuilding}
                    label={t.common.department}
                    value={employee.department?.nameAr || employee.department?.name || "-"}
                  />
                  <InfoItem
                    icon={IconBriefcase}
                    label={t.common.jobTitle}
                    value={employee.jobTitle?.nameAr || employee.jobTitle?.name || "-"}
                  />
                </CardContent>
              </Card>

              <Card className="border-border/70 shadow-sm">
                <CardHeader>
                  <CardTitle>{isRtl ? "حالة الحساب" : "Account status"}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <InfoItem
                    icon={IconUser}
                    label={isRtl ? "الدور" : "Role"}
                    value={employee.user ? getRoleLabel(employee.user.role, locale) : "-"}
                  />
                  <InfoItem
                    icon={IconClock}
                    label={t.common.status}
                    value={employee.user ? getUserStatusLabel(employee.user.status, locale) : "-"}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="work" className="mt-4 space-y-4">
              <Card className="border-border/70 shadow-sm">
                <CardHeader>
                  <CardTitle>{isRtl ? "بيانات العمل" : "Work details"}</CardTitle>
                  <CardDescription>
                    {isRtl
                      ? "القسم، الفرع، موقع العمل، الوردية، والراتب الأساسي"
                      : "Department, branch, work location, shift, and base salary"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <InfoItem
                    icon={IconCalendar}
                    label={t.common.hireDate}
                    value={formatDate(employee.hireDate, locale)}
                  />
                  <InfoItem
                    icon={IconBriefcase}
                    label={t.employees.contractType}
                    value={getEmploymentTypeLabel(employee.employmentType, locale)}
                  />
                  <InfoItem
                    icon={IconBuilding}
                    label={isRtl ? "الفرع" : "Branch"}
                    value={employee.branch?.nameAr || employee.branch?.name || "-"}
                  />
                  <InfoItem
                    icon={IconMapPin}
                    label={isRtl ? "مدينة الفرع" : "Branch city"}
                    value={employee.branch?.city || "-"}
                  />
                  <InfoItem
                    icon={IconMapPin}
                    label={isRtl ? "موقع العمل" : "Work location"}
                    value={employee.workLocation || "-"}
                  />
                  <InfoItem
                    icon={IconClock}
                    label={isRtl ? "الوردية" : "Shift"}
                    value={employee.shift?.nameAr || employee.shift?.name || "-"}
                  />
                  <InfoItem
                    icon={IconBriefcase}
                    label={t.employees.basicSalary}
                    value={
                      employee.baseSalary
                        ? formatCurrency(Number(employee.baseSalary), employee.currency)
                        : "-"
                    }
                  />
                  <InfoItem
                    icon={IconCalendar}
                    label={isRtl ? "آخر تحديث" : "Last update"}
                    value={formatDate(employee.updatedAt, locale)}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="team" className="mt-4 space-y-4">
              <Card className="border-border/70 shadow-sm">
                <CardHeader>
                  <CardTitle>{t.workflows.directManager}</CardTitle>
                  <CardDescription>
                    {isRtl
                      ? "المسؤول المباشر عن الموظف داخل الهيكل الإداري الحالي"
                      : "The employee's direct reporting line in the current organization structure"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {employee.manager ? (
                    <Link
                      href={`/dashboard/employees/${employee.manager.id}`}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 p-4 transition-colors hover:bg-muted/40">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={employee.manager.avatar || undefined} alt={managerName || undefined} />
                          <AvatarFallback>{getInitials(employee.manager)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{managerName}</p>
                          <p className="text-muted-foreground truncate text-sm">
                            {employee.manager.jobTitle?.nameAr || employee.manager.jobTitle?.name || "-"}
                          </p>
                          <p className="text-muted-foreground truncate text-xs" dir="ltr">
                            {employee.manager.email || "-"}
                          </p>
                        </div>
                      </div>
                      <span className="text-muted-foreground text-xs">
                        {isRtl ? "عرض الملف" : "Open profile"}
                      </span>
                    </Link>
                  ) : (
                    <div className="text-muted-foreground rounded-2xl border border-dashed p-4 text-sm">
                      {isRtl
                        ? "لم يتم تعيين مدير مباشر لهذا الموظف بعد."
                        : "No direct manager is assigned to this employee yet."}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/70 shadow-sm">
                <CardHeader>
                  <CardTitle>{isRtl ? "التابعون المباشرون" : "Direct reports"}</CardTitle>
                  <CardDescription>
                    {isRtl
                      ? "الموظفون الذين يرفعون لهذا الموظف مباشرة"
                      : "Employees who currently report to this employee"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {employee.directReports.length === 0 ? (
                    <div className="text-muted-foreground rounded-2xl border border-dashed p-4 text-sm">
                      {isRtl
                        ? "لا يوجد تابعون مباشرون لهذا الموظف حاليًا."
                        : "This employee currently has no direct reports."}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {employee.directReports.map((report) => (
                        <Link
                          key={report.id}
                          href={`/dashboard/employees/${report.id}`}
                          className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 p-4 transition-colors hover:bg-muted/40">
                          <div className="flex min-w-0 items-center gap-3">
                            <Avatar className="h-11 w-11">
                              <AvatarImage src={report.avatar || undefined} alt={getEmployeeFullName(report, locale)} />
                              <AvatarFallback>{getInitials(report)}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="truncate font-medium">
                                {getEmployeeFullName(report, locale)}
                              </p>
                              <p className="text-muted-foreground truncate text-sm">
                                {report.jobTitle?.nameAr || report.jobTitle?.name || "-"}
                              </p>
                              <p className="text-muted-foreground truncate text-xs" dir="ltr">
                                {report.email || "-"}
                              </p>
                            </div>
                          </div>

                          <div className="flex shrink-0 items-center gap-2">
                            <EmployeeStatusBadge status={report.status} />
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-4">
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle>{isRtl ? "ملخص سريع" : "Quick summary"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <SummaryRow label={t.common.department} value={employee.department?.nameAr || employee.department?.name || "-"} />
              <SummaryRow label={t.common.jobTitle} value={employee.jobTitle?.nameAr || employee.jobTitle?.name || "-"} />
              <SummaryRow label={t.workflows.directManager} value={managerName || "-"} />
              <SummaryRow label={isRtl ? "التابعون المباشرون" : "Direct reports"} value={String(directReportsCount)} />
              <SummaryRow label={isRtl ? "نوع التوظيف" : "Employment type"} value={getEmploymentTypeLabel(employee.employmentType, locale)} />
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle>{isRtl ? "روابط سريعة" : "Quick links"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-between" asChild>
                <Link href="/dashboard/employees">
                  <span>{isRtl ? "العودة إلى الموظفين" : "Back to employees"}</span>
                  <ArrowIcon className="h-4 w-4" />
                </Link>
              </Button>

              {employee.manager ? (
                <Button variant="outline" className="w-full justify-between" asChild>
                  <Link href={`/dashboard/employees/${employee.manager.id}`}>
                    <span>{isRtl ? "فتح ملف المدير" : "Open manager profile"}</span>
                    <ArrowIcon className="h-4 w-4" />
                  </Link>
                </Button>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
  dir
}: {
  icon: typeof IconUser;
  label: string;
  value: string;
  dir?: "ltr" | "rtl";
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card/70 p-4">
      <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-xl">
        <Icon className="text-muted-foreground h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-muted-foreground text-sm">{label}</p>
        <p className="truncate font-medium" dir={dir}>
          {value}
        </p>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-3 last:border-0 last:pb-0">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="max-w-[60%] text-end text-sm font-medium">{value}</span>
    </div>
  );
}