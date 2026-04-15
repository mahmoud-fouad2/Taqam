"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  IconArrowLeft,
  IconArrowRight,
  IconBriefcase,
  IconBuilding,
  IconCamera,
  IconCalendar,
  IconClock,
  IconId,
  IconLoader2,
  IconMail,
  IconMapPin,
  IconPencil,
  IconPhone,
  IconReceipt,
  IconUser,
  IconUsers
} from "@tabler/icons-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
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

type RecentPayslip = {
  id: string;
  status: string;
  netSalary: number;
  currency: string;
  overtimeHours: number;
  payrollPeriod: {
    id: string;
    name: string | null;
    nameAr: string | null;
    startDate: string;
    endDate: string;
    paymentDate: string;
  };
};

type RecentLoan = {
  id: string;
  type: string;
  status: string;
  amount: number;
  remainingAmount: number;
  installments: number;
  paidInstallments: number;
  createdAt: string;
  startDate: string | null;
  endDate: string | null;
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
  overtimeEligible: boolean;
  workLocation: string | null;
  baseSalary: string | null;
  currency: string;
  createdAt: string;
  updatedAt: string;
  department: { id: string; name: string; nameAr: string | null } | null;
  jobTitle: { id: string; name: string; nameAr: string | null } | null;
  branch: { id: string; name: string; nameAr: string | null; city: string | null } | null;
  shift: { id: string; name: string; nameAr: string | null } | null;
  manager:
    | (Nameable & {
        id: string;
        employeeNumber: string | null;
        email: string | null;
        avatar: string | null;
        jobTitle: { name: string; nameAr: string | null } | null;
      })
    | null;
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
  loanSummary: {
    totalCount: number;
    activeCount: number;
    activeRemainingAmount: number;
  };
  recentLoans: RecentLoan[];
  recentPayslips: RecentPayslip[];
};

interface Props {
  employee: EmployeeProfile;
  initialLocale: "ar" | "en";
  canManageAvatar: boolean;
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

function getOvertimeEligibilityLabel(value: boolean, locale: "ar" | "en") {
  if (locale === "ar") {
    return value ? "مفعل لهذا الموظف" : "غير مفعل لهذا الموظف";
  }

  return value ? "Enabled for this employee" : "Disabled for this employee";
}

function getLoanTypeLabel(value: string, locale: "ar" | "en") {
  switch (value) {
    case "SALARY_ADVANCE":
      return locale === "ar" ? "سلفة راتب" : "Salary advance";
    case "PERSONAL_LOAN":
      return locale === "ar" ? "قرض شخصي" : "Personal loan";
    case "EMERGENCY_LOAN":
      return locale === "ar" ? "قرض طارئ" : "Emergency loan";
    case "HOUSING_LOAN":
      return locale === "ar" ? "قرض سكني" : "Housing loan";
    case "CAR_LOAN":
      return locale === "ar" ? "قرض سيارة" : "Car loan";
    case "OTHER":
    default:
      return locale === "ar" ? "أخرى" : "Other";
  }
}

function getLoanStatusLabel(value: string, locale: "ar" | "en") {
  switch (value) {
    case "PENDING":
      return locale === "ar" ? "بانتظار الموافقة" : "Pending";
    case "APPROVED":
      return locale === "ar" ? "تمت الموافقة" : "Approved";
    case "ACTIVE":
      return locale === "ar" ? "نشط" : "Active";
    case "COMPLETED":
      return locale === "ar" ? "مكتمل" : "Completed";
    case "REJECTED":
      return locale === "ar" ? "مرفوض" : "Rejected";
    case "CANCELLED":
      return locale === "ar" ? "ملغي" : "Cancelled";
    default:
      return value;
  }
}

function getLoanStatusClasses(value: string) {
  switch (value) {
    case "ACTIVE":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "PENDING":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "APPROVED":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "COMPLETED":
      return "border-slate-200 bg-slate-50 text-slate-700";
    case "REJECTED":
    case "CANCELLED":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-border bg-muted text-foreground";
  }
}

function getPayslipStatusLabel(value: string, locale: "ar" | "en") {
  switch (value) {
    case "DRAFT":
      return locale === "ar" ? "مسودة" : "Draft";
    case "GENERATED":
      return locale === "ar" ? "تم الإنشاء" : "Generated";
    case "SENT":
      return locale === "ar" ? "تم الإرسال" : "Sent";
    case "VIEWED":
      return locale === "ar" ? "تمت المشاهدة" : "Viewed";
    default:
      return value;
  }
}

function getPayslipStatusClasses(value: string) {
  switch (value) {
    case "VIEWED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "SENT":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "GENERATED":
      return "border-violet-200 bg-violet-50 text-violet-700";
    case "DRAFT":
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function getPayrollPeriodLabel(period: RecentPayslip["payrollPeriod"], locale: "ar" | "en") {
  return (
    (locale === "ar" ? period.nameAr : period.name) ||
    `${formatDate(period.startDate, locale)} - ${formatDate(period.endDate, locale)}`
  );
}

export default function EmployeeDetailsClient({ employee, initialLocale, canManageAvatar }: Props) {
  const locale = useClientLocale(initialLocale);
  const t = getText(locale);
  const isRtl = locale === "ar";
  const ArrowIcon = isRtl ? IconArrowRight : IconArrowLeft;
  const [avatarUrl, setAvatarUrl] = useState(employee.avatar);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const fullName = getEmployeeFullName(employee, locale);
  const managerName = employee.manager ? getEmployeeFullName(employee.manager, locale) : null;
  const directReportsCount = employee.directReports.length;
  const latestPayslip = employee.recentPayslips[0] ?? null;
  const latestLoan = employee.recentLoans[0] ?? null;

  const onAvatarSelected: React.ChangeEventHandler<HTMLInputElement> = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setIsUploadingAvatar(true);
    try {
      const res = await fetch(`/api/employees/${employee.id}/avatar`, {
        method: "POST",
        body: formData
      });
      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.data?.url) {
        throw new Error(
          json?.error ||
            (locale === "ar" ? "تعذر رفع صورة الموظف." : "Failed to upload employee photo.")
        );
      }

      setAvatarUrl(json.data.url);
      toast.success(locale === "ar" ? "تم تحديث صورة الموظف." : "Employee photo updated.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : locale === "ar"
            ? "حدث خطأ أثناء رفع الصورة."
            : "An error occurred while uploading the photo."
      );
    } finally {
      setIsUploadingAvatar(false);
      if (event.target) event.target.value = "";
    }
  };

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
            <div className="relative">
              <Avatar className="border-border/70 h-20 w-20 rounded-3xl border shadow-sm">
                <AvatarImage src={avatarUrl || undefined} alt={fullName} />
                <AvatarFallback className="text-lg font-semibold">
                  {getInitials(employee)}
                </AvatarFallback>
              </Avatar>
              {canManageAvatar ? (
                <>
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="absolute -end-2 -bottom-2 h-8 w-8 rounded-full"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    aria-label={locale === "ar" ? "رفع صورة الموظف" : "Upload employee photo"}>
                    {isUploadingAvatar ? (
                      <IconLoader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <IconCamera className="h-4 w-4" />
                    )}
                  </Button>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    aria-label={locale === "ar" ? "اختر صورة الموظف" : "Choose employee photo"}
                    onChange={onAvatarSelected}
                  />
                </>
              ) : null}
            </div>

            <div className="min-w-0 space-y-2">
              <div>
                <p className="text-muted-foreground text-sm">
                  {isRtl ? "ملف الموظف" : "Employee profile"}
                </p>
                <h1 className="truncate text-2xl font-bold tracking-tight">{fullName}</h1>
                <p className="text-muted-foreground truncate text-sm">
                  {employee.jobTitle?.nameAr || employee.jobTitle?.name || "-"}
                  {employee.department
                    ? ` • ${employee.department.nameAr || employee.department.name}`
                    : ""}
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
              <div className="border-border/70 bg-card/80 rounded-2xl border p-4">
                <p className="text-muted-foreground text-xs font-semibold tracking-[0.08em] uppercase">
                  {t.common.email}
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-xl">
                    <IconMail className="text-primary h-5 w-5" />
                  </div>
                  <p className="min-w-0 truncate text-sm font-medium">{employee.email}</p>
                </div>
              </div>

              <div className="border-border/70 bg-card/80 rounded-2xl border p-4">
                <p className="text-muted-foreground text-xs font-semibold tracking-[0.08em] uppercase">
                  {t.workflows.directManager}
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10">
                    <IconUser className="h-5 w-5 text-sky-600" />
                  </div>
                  <div className="min-w-0">
                    {employee.manager ? (
                      <Link
                        href={`/dashboard/employees/${employee.manager.id}`}
                        className="hover:text-primary block truncate text-sm font-medium transition-colors hover:underline">
                        {managerName}
                      </Link>
                    ) : (
                      <p className="text-sm font-medium">-</p>
                    )}
                    <p className="text-muted-foreground truncate text-xs">
                      {employee.manager?.jobTitle?.nameAr ||
                        employee.manager?.jobTitle?.name ||
                        (isRtl ? "غير محدد" : "Not assigned")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-border/70 bg-card/80 rounded-2xl border p-4">
                <p className="text-muted-foreground text-xs font-semibold tracking-[0.08em] uppercase">
                  {isRtl ? "الفريق التابع" : "Direct reports"}
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
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

              <div className="border-border/70 bg-card/80 rounded-2xl border p-4">
                <p className="text-muted-foreground text-xs font-semibold tracking-[0.08em] uppercase">
                  {t.common.hireDate}
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
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
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
              <TabsTrigger value="overview">{isRtl ? "نظرة عامة" : "Overview"}</TabsTrigger>
              <TabsTrigger value="work">{isRtl ? "العمل" : "Work"}</TabsTrigger>
              <TabsTrigger value="finance">{isRtl ? "المالية" : "Finance"}</TabsTrigger>
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
                  <InfoItem
                    icon={IconId}
                    label={t.employees.employeeNumber}
                    value={employee.employeeNumber}
                  />
                  <InfoItem
                    icon={IconMail}
                    label={t.common.email}
                    value={employee.email}
                    dir="ltr"
                  />
                  <InfoItem
                    icon={IconPhone}
                    label={t.common.phone}
                    value={employee.phone || "-"}
                    dir="ltr"
                  />
                  <InfoItem
                    icon={IconId}
                    label={t.employees.nationalId}
                    value={employee.nationalId || "-"}
                  />
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
                    icon={IconClock}
                    label={isRtl ? "استحقاق الأوفر تايم" : "Overtime eligibility"}
                    value={getOvertimeEligibilityLabel(employee.overtimeEligible, locale)}
                  />
                  <InfoItem
                    icon={IconCalendar}
                    label={isRtl ? "آخر تحديث" : "Last update"}
                    value={formatDate(employee.updatedAt, locale)}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="finance" className="mt-4 space-y-4">
              <Card className="border-border/70 shadow-sm">
                <CardHeader>
                  <CardTitle>{isRtl ? "ملخص مالي" : "Financial snapshot"}</CardTitle>
                  <CardDescription>
                    {isRtl
                      ? "آخر المسيرات والسلف وحالة الأوفر تايم لهذا الموظف"
                      : "Recent payroll, loans, and overtime status for this employee"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <InfoItem
                    icon={IconReceipt}
                    label={isRtl ? "آخر صافي راتب" : "Latest net salary"}
                    value={
                      latestPayslip
                        ? formatCurrency(latestPayslip.netSalary, latestPayslip.currency)
                        : "-"
                    }
                  />
                  <InfoItem
                    icon={IconCalendar}
                    label={isRtl ? "تاريخ آخر صرف" : "Latest payment date"}
                    value={
                      latestPayslip
                        ? formatDate(latestPayslip.payrollPeriod.paymentDate, locale)
                        : "-"
                    }
                  />
                  <InfoItem
                    icon={IconClock}
                    label={isRtl ? "حالة الأوفر تايم" : "Overtime status"}
                    value={getOvertimeEligibilityLabel(employee.overtimeEligible, locale)}
                  />
                  <InfoItem
                    icon={IconBriefcase}
                    label={isRtl ? "المتبقي من السلف النشطة" : "Outstanding active loans"}
                    value={
                      employee.loanSummary.activeRemainingAmount > 0
                        ? formatCurrency(
                            employee.loanSummary.activeRemainingAmount,
                            employee.currency
                          )
                        : "-"
                    }
                  />
                </CardContent>
              </Card>

              <Card className="border-border/70 shadow-sm">
                <CardHeader>
                  <CardTitle>{isRtl ? "آخر المسيرات" : "Recent payslips"}</CardTitle>
                  <CardDescription>
                    {isRtl
                      ? "أحدث المسيرات الجاهزة لهذا الموظف مع صافي الراتب وساعات الأوفر تايم"
                      : "Latest generated payslips for this employee with net salary and overtime hours"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {employee.recentPayslips.length === 0 ? (
                    <div className="text-muted-foreground rounded-2xl border border-dashed p-4 text-sm">
                      {isRtl
                        ? "لا توجد مسيرات محفوظة لهذا الموظف حتى الآن."
                        : "No payslips are stored for this employee yet."}
                    </div>
                  ) : (
                    employee.recentPayslips.map((payslip) => (
                      <div
                        key={payslip.id}
                        className="border-border/70 flex flex-col gap-3 rounded-2xl border p-4 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <div className="bg-primary/10 flex h-9 w-9 items-center justify-center rounded-xl">
                              <IconReceipt className="text-primary h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-medium">
                                {getPayrollPeriodLabel(payslip.payrollPeriod, locale)}
                              </p>
                              <p className="text-muted-foreground text-sm">
                                {isRtl ? "تاريخ الصرف: " : "Payment date: "}
                                {formatDate(payslip.payrollPeriod.paymentDate, locale)}
                              </p>
                            </div>
                          </div>
                          <p className="text-muted-foreground text-sm">
                            {isRtl ? "ساعات الأوفر تايم: " : "Overtime hours: "}
                            {payslip.overtimeHours}
                          </p>
                        </div>

                        <div className="flex shrink-0 flex-col items-start gap-2 md:items-end">
                          <p className="text-lg font-semibold">
                            {formatCurrency(payslip.netSalary, payslip.currency)}
                          </p>
                          <Badge
                            variant="outline"
                            className={`rounded-full ${getPayslipStatusClasses(payslip.status)}`}>
                            {getPayslipStatusLabel(payslip.status, locale)}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}

                  <Button variant="outline" className="w-full justify-between" asChild>
                    <Link href="/dashboard/payslips">
                      <span>{isRtl ? "فتح صفحة المسيرات" : "Open payslips page"}</span>
                      <ArrowIcon className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-border/70 shadow-sm">
                <CardHeader>
                  <CardTitle>{isRtl ? "السلف والقروض" : "Loans and advances"}</CardTitle>
                  <CardDescription>
                    {isRtl
                      ? "ملخص السلف الحالية وآخر الطلبات المتعلقة بهذا الموظف"
                      : "Current outstanding loans and the latest requests tied to this employee"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <InfoItem
                      icon={IconBriefcase}
                      label={isRtl ? "إجمالي الطلبات" : "Total requests"}
                      value={String(employee.loanSummary.totalCount)}
                    />
                    <InfoItem
                      icon={IconBriefcase}
                      label={isRtl ? "السلف النشطة" : "Active loans"}
                      value={String(employee.loanSummary.activeCount)}
                    />
                    <InfoItem
                      icon={IconBriefcase}
                      label={isRtl ? "آخر طلب" : "Latest request"}
                      value={latestLoan ? formatDate(latestLoan.createdAt, locale) : "-"}
                    />
                  </div>

                  {employee.recentLoans.length === 0 ? (
                    <div className="text-muted-foreground rounded-2xl border border-dashed p-4 text-sm">
                      {isRtl
                        ? "لا توجد سلف أو قروض مرتبطة بهذا الموظف حتى الآن."
                        : "No loans or salary advances are linked to this employee yet."}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {employee.recentLoans.map((loan) => (
                        <div
                          key={loan.id}
                          className="border-border/70 flex flex-col gap-3 rounded-2xl border p-4 md:flex-row md:items-start md:justify-between">
                          <div className="min-w-0 space-y-1">
                            <p className="font-medium">{getLoanTypeLabel(loan.type, locale)}</p>
                            <p className="text-muted-foreground text-sm">
                              {isRtl ? "تاريخ الطلب: " : "Requested on: "}
                              {formatDate(loan.createdAt, locale)}
                            </p>
                            <p className="text-muted-foreground text-sm">
                              {isRtl ? "المتبقي: " : "Remaining: "}
                              {formatCurrency(loan.remainingAmount, employee.currency)}
                            </p>
                          </div>

                          <div className="flex shrink-0 flex-col items-start gap-2 md:items-end">
                            <p className="text-lg font-semibold">
                              {formatCurrency(loan.amount, employee.currency)}
                            </p>
                            <Badge
                              variant="outline"
                              className={`rounded-full ${getLoanStatusClasses(loan.status)}`}>
                              {getLoanStatusLabel(loan.status, locale)}
                            </Badge>
                            <p className="text-muted-foreground text-xs">
                              {isRtl ? "الأقساط المسددة: " : "Installments paid: "}
                              {loan.paidInstallments}/{loan.installments}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <Button variant="outline" className="w-full justify-between" asChild>
                    <Link href="/dashboard/loans">
                      <span>{isRtl ? "فتح صفحة السلف والقروض" : "Open loans page"}</span>
                      <ArrowIcon className="h-4 w-4" />
                    </Link>
                  </Button>
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
                      className="border-border/70 hover:bg-muted/40 flex items-center justify-between gap-3 rounded-2xl border p-4 transition-colors">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage
                            src={employee.manager.avatar || undefined}
                            alt={managerName || undefined}
                          />
                          <AvatarFallback>{getInitials(employee.manager)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{managerName}</p>
                          <p className="text-muted-foreground truncate text-sm">
                            {employee.manager.jobTitle?.nameAr ||
                              employee.manager.jobTitle?.name ||
                              "-"}
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
                          className="border-border/70 hover:bg-muted/40 flex items-center justify-between gap-3 rounded-2xl border p-4 transition-colors">
                          <div className="flex min-w-0 items-center gap-3">
                            <Avatar className="h-11 w-11">
                              <AvatarImage
                                src={report.avatar || undefined}
                                alt={getEmployeeFullName(report, locale)}
                              />
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
              <SummaryRow
                label={t.common.department}
                value={employee.department?.nameAr || employee.department?.name || "-"}
              />
              <SummaryRow
                label={t.common.jobTitle}
                value={employee.jobTitle?.nameAr || employee.jobTitle?.name || "-"}
              />
              <SummaryRow label={t.workflows.directManager} value={managerName || "-"} />
              <SummaryRow
                label={isRtl ? "التابعون المباشرون" : "Direct reports"}
                value={String(directReportsCount)}
              />
              <SummaryRow
                label={isRtl ? "نوع التوظيف" : "Employment type"}
                value={getEmploymentTypeLabel(employee.employmentType, locale)}
              />
              <SummaryRow
                label={isRtl ? "الأوفر تايم" : "Overtime"}
                value={getOvertimeEligibilityLabel(employee.overtimeEligible, locale)}
              />
              <SummaryRow
                label={isRtl ? "السلف النشطة" : "Active loans"}
                value={String(employee.loanSummary.activeCount)}
              />
              <SummaryRow
                label={isRtl ? "آخر صافي راتب" : "Latest net salary"}
                value={
                  latestPayslip
                    ? formatCurrency(latestPayslip.netSalary, latestPayslip.currency)
                    : "-"
                }
              />
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

              <Button variant="outline" className="w-full justify-between" asChild>
                <Link href="/dashboard/payslips">
                  <span>{isRtl ? "الانتقال إلى المسيرات" : "Go to payslips"}</span>
                  <ArrowIcon className="h-4 w-4" />
                </Link>
              </Button>

              <Button variant="outline" className="w-full justify-between" asChild>
                <Link href="/dashboard/loans">
                  <span>{isRtl ? "الانتقال إلى السلف والقروض" : "Go to loans"}</span>
                  <ArrowIcon className="h-4 w-4" />
                </Link>
              </Button>
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
    <div className="border-border/70 bg-card/70 flex items-center gap-3 rounded-2xl border p-4">
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
    <div className="border-border/60 flex items-start justify-between gap-3 border-b pb-3 last:border-0 last:pb-0">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="max-w-[60%] text-end text-sm font-medium">{value}</span>
    </div>
  );
}
