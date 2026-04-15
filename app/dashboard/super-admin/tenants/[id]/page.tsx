/**
 * Tenant Details Page
 * صفحة تفاصيل الشركة
 */

"use client";

import Link from "next/link";
import * as React from "react";
import { useParams } from "next/navigation";
import {
  ArrowRight,
  Building2,
  Settings,
  Users,
  Calendar,
  Mail,
  Phone,
  Globe,
  ExternalLink,
  History
} from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Tenant, TenantStatus } from "@/lib/types/tenant";
import {
  buildTenantActivationDiagnostics,
  type TenantActivationAuditLog
} from "@/lib/tenant-activation-diagnostics";
import { buildTenantUrl } from "@/lib/tenant";
import { tenantsService } from "@/lib/api";
import { getText } from "@/lib/i18n/text";
import { useClientLocale } from "@/lib/i18n/use-client-locale";

type LocaleText = ReturnType<typeof getText>;

function getStatusMeta(status: string, t: LocaleText) {
  const statusConfig: Record<
    TenantStatus,
    { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
  > = {
    active: { label: t.common.active, variant: "default" },
    pending: { label: t.common.pending, variant: "secondary" },
    suspended: { label: t.common.suspended, variant: "destructive" },
    cancelled: { label: t.common.cancelled, variant: "outline" },
    deleted: { label: t.common.deleted, variant: "outline" }
  };

  return (
    statusConfig[status as TenantStatus] ?? {
      label: status,
      variant: "outline" as const
    }
  );
}

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

type TenantUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  status: string;
  createdAt: string;
  lastLoginAt: string | null;
  employee: {
    id: string;
    employeeNumber: string;
  } | null;
};

type TenantAuditLog = TenantActivationAuditLog;

const rolePriority: Record<string, number> = {
  TENANT_ADMIN: 0,
  HR_MANAGER: 1,
  MANAGER: 2,
  EMPLOYEE: 3,
  SUPER_ADMIN: 4
};

function getUserStatusMeta(status: string, t: LocaleText) {
  const userStatusConfig: Record<string, { label: string; variant: BadgeVariant }> = {
    ACTIVE: { label: t.common.active, variant: "default" },
    INACTIVE: { label: t.common.inactive, variant: "secondary" },
    SUSPENDED: { label: t.common.suspended, variant: "destructive" },
    PENDING_VERIFICATION: { label: t.common.pendingActivation, variant: "outline" }
  };

  return userStatusConfig[status] ?? { label: status, variant: "outline" as const };
}

function getUserDisplayName(user: Pick<TenantUser, "firstName" | "lastName" | "email">) {
  const fullName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
  return fullName || user.email;
}

function getRoleLabel(role: string, t: LocaleText) {
  const roleLabels: Record<string, string> = {
    SUPER_ADMIN: t.common.superAdmin,
    TENANT_ADMIN: t.common.companyAdmin,
    HR_MANAGER: t.common.hrManager,
    MANAGER: t.common.manager,
    EMPLOYEE: t.common.employee
  };

  return roleLabels[role] ?? role;
}

function formatAuditAction(action: string, t: LocaleText, locale: "ar" | "en") {
  const auditActionLabels: Record<string, string> = {
    LOGIN: t.audit.login,
    LOGOUT: t.audit.logout,
    LOGIN_FAILED: t.audit.loginFailed,
    PASSWORD_CHANGED: t.audit.passwordChanged,
    PASSWORD_RESET: t.audit.passwordReset,
    TOKEN_REFRESH: t.audit.tokenRefresh,
    USER_CREATE: t.common.add,
    USER_UPDATE: t.common.update,
    USER_DELETE: t.common.delete,
    USER_SUSPEND: t.audit.userSuspend,
    USER_ACTIVATE: t.audit.userActivate,
    EMPLOYEE_CREATE: t.employees.addEmployee,
    EMPLOYEE_UPDATE: t.employees.updatedSuccess,
    EMPLOYEE_DELETE: t.audit.employeeDelete,
    EMPLOYEE_BULK_IMPORT: t.audit.employeeBulkImport,
    EMPLOYEE_STATUS_CHANGE: t.audit.employeeStatusChange,
    TENANT_ACTIVATED: t.tenant.activate,
    TENANT_ADMIN_EMPLOYEE_LINKED:
      locale === "ar" ? "ربط مدير الشركة بملف موظف" : "Link admin to employee",
    DATA_IMPORT: t.audit.dataImport,
    DATA_EXPORT: t.common.exportData,
    SETTINGS_UPDATE: t.audit.settingsUpdate,
    PAYROLL_PROCESS: t.audit.payrollProcess,
    SETUP_STEP_SAVED: locale === "ar" ? "حفظ خطوة الإعداد" : "Saved setup step",
    SETUP_STEP_VIEWED: locale === "ar" ? "عرض خطوة الإعداد" : "Viewed setup step",
    SETUP_CHECKLIST_VIEWED: locale === "ar" ? "عرض قائمة الجاهزية" : "Viewed readiness checklist",
    SETUP_DONE_VIEWED: locale === "ar" ? "عرض شاشة الانطلاق" : "Viewed launch screen",
    SETUP_COMPLETED: locale === "ar" ? "اكتمال الإعداد" : "Setup completed",
    MOBILE_APP_ERROR: locale === "ar" ? "خطأ تطبيق الجوال" : "Mobile app error",
    MOBILE_APP_CRASH: locale === "ar" ? "انهيار تطبيق الجوال" : "Mobile app crash"
  };

  return auditActionLabels[action] ?? action.replaceAll("_", " ");
}

function formatAuditEntity(entity: string, t: LocaleText, locale: "ar" | "en") {
  const auditEntityLabels: Record<string, string> = {
    User: t.audit.entityUser,
    Employee: t.common.employee,
    Tenant: t.audit.entityTenant,
    SetupWizard: locale === "ar" ? "رحلة التفعيل" : "Activation flow",
    DevelopmentPlan: t.audit.entityDevPlan,
    PayrollPeriod: t.audit.entityPayrollPeriod,
    MobileSession: t.audit.entityMobileSession,
    MobileRefreshToken: t.audit.entityMobileSession,
    MobileApp: locale === "ar" ? "تطبيق الجوال" : "Mobile app",
    Settings: t.common.options
  };

  return auditEntityLabels[entity] ?? entity;
}

function formatDateTime(value: string | null | undefined, locale: "ar" | "en") {
  if (!value) return "—";
  return new Date(value).toLocaleString(locale === "ar" ? "ar-SA" : "en-US");
}

function formatCompactId(value: string | null | undefined) {
  if (!value) return null;
  if (value.length <= 12) return value;
  return `${value.slice(0, 8)}...`;
}

export default function TenantDetailsPage() {
  const locale = useClientLocale();
  const t = getText(locale);
  const params = useParams<{ id?: string | string[] }>();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const [tenant, setTenant] = React.useState<Tenant | null>(null);
  const [tenantUsers, setTenantUsers] = React.useState<TenantUser[]>([]);
  const [auditLogs, setAuditLogs] = React.useState<TenantAuditLog[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [usersError, setUsersError] = React.useState<string | null>(null);
  const [auditError, setAuditError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!id) return;
    let mounted = true;
    (async () => {
      setIsLoading(true);
      setError(null);
      setUsersError(null);
      setAuditError(null);
      try {
        const [tenantRes, usersRes, auditRes] = await Promise.all([
          tenantsService.getById(id),
          apiClient.get<TenantUser[]>(`/admin/tenants/${id}/users`),
          apiClient.get<TenantAuditLog[]>("/audit-logs", {
            params: { tenantId: id, pageSize: 50 }
          })
        ]);

        if (!mounted) return;

        if (tenantRes.success && tenantRes.data) {
          setTenant(tenantRes.data);
        } else {
          setTenant(null);
          setError(tenantRes.error || t.organization.fetchCompanyError);
        }

        if (usersRes.success && Array.isArray(usersRes.data)) {
          setTenantUsers(
            [...usersRes.data].sort((left, right) => {
              const roleDelta = (rolePriority[left.role] ?? 99) - (rolePriority[right.role] ?? 99);
              if (roleDelta !== 0) return roleDelta;
              return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
            })
          );
        } else {
          setTenantUsers([]);
          setUsersError(usersRes.error || t.tenant.pFailedToLoadUsers);
        }

        if (auditRes.success && Array.isArray(auditRes.data)) {
          setAuditLogs(auditRes.data);
        } else {
          setAuditLogs([]);
          setAuditError(auditRes.error || t.tenant.pFailedToLoadChangeLog);
        }
      } catch (e) {
        if (!mounted) return;
        setTenant(null);
        setTenantUsers([]);
        setAuditLogs([]);
        setError(e instanceof Error ? e.message : t.organization.fetchCompanyError);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [
    id,
    t.organization.fetchCompanyError,
    t.tenant.pFailedToLoadChangeLog,
    t.tenant.pFailedToLoadUsers
  ]);

  if (!id || isLoading) {
    return (
      <div className="border-border/60 bg-card/80 text-muted-foreground flex items-center justify-center rounded-2xl border py-10 shadow-sm">
        {t.tenant.loading}
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="border-destructive/30 bg-destructive/5 text-destructive rounded-lg border p-4">
          {error}
        </div>
        <Link
          href="/dashboard/super-admin/tenants"
          className="border-border/60 bg-background text-foreground hover:bg-muted inline-flex h-9 items-center rounded-md border px-3 text-sm font-medium shadow-sm transition-colors">
          {t.tenant.backToList}
        </Link>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">{t.tenant.notFound}</p>
        <Link
          href="/dashboard/super-admin/tenants"
          className="border-border/60 bg-background text-foreground hover:bg-muted inline-flex h-9 items-center rounded-md border px-3 text-sm font-medium shadow-sm transition-colors">
          {t.tenant.backToList}
        </Link>
      </div>
    );
  }

  const activeUsersCount = tenantUsers.filter((user) => user.status === "ACTIVE").length;
  const adminUsersCount = tenantUsers.filter((user) => user.role === "TENANT_ADMIN").length;
  const activationDiagnostics = buildTenantActivationDiagnostics({
    auditLogs,
    locale,
    setupStep: tenant.setupStep ?? 0,
    setupCompletedAt: tenant.setupCompletedAt
  });

  return (
    <div className="space-y-6">
      <section className="border-border/60 bg-card/80 supports-[backdrop-filter]:bg-card/70 rounded-2xl border p-5 shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Link
                href="/dashboard/super-admin/tenants"
                className="hover:text-primary font-medium">
                {t.common.companies}
              </Link>
              <ArrowRight className="h-4 w-4 rotate-180" />
              <span>{tenant.nameAr}</span>
            </div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
              <Building2 className="h-6 w-6" />
              {tenant.nameAr}
              {(() => {
                const meta = getStatusMeta(String((tenant as any)?.status ?? "unknown"), t);
                return (
                  <Badge variant={meta?.variant ?? "outline"} className="ms-2">
                    {meta?.label ?? "—"}
                  </Badge>
                );
              })()}
            </h1>
            <p className="text-muted-foreground text-sm">{tenant.name}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href={`/dashboard/super-admin/tenants/${id}/settings`}>
                <Settings className="me-2 h-4 w-4" />
                {t.common.settings}
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <a href={buildTenantUrl(tenant.slug, "/dashboard")} target="_blank" rel="noreferrer">
                <ExternalLink className="me-2 h-4 w-4" />
                {t.common.open}
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href={buildTenantUrl(tenant.slug, "/careers")} target="_blank" rel="noreferrer">
                <ExternalLink className="me-2 h-4 w-4" />
                {t.tenant.careersPortal}
              </a>
            </Button>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/60 bg-card/85 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.common.users}</CardTitle>
            <Users className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tenant.usersCount}</div>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card/85 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.common.employees}</CardTitle>
            <Users className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tenant.employeesCount}</div>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card/85 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.common.type}</CardTitle>
            <Building2 className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{tenant.plan}</div>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card/85 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.common.createdAt}</CardTitle>
            <Calendar className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Date(tenant.createdAt).toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US")}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="info" className="space-y-4">
        <TabsList className="bg-card/80">
          <TabsTrigger value="info">{t.common.info}</TabsTrigger>
          <TabsTrigger value="users">{t.common.users}</TabsTrigger>
          <TabsTrigger value="audit">{t.audit.auditLog}</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Company Info */}
            <Card className="border-border/60 bg-card/85 shadow-sm">
              <CardHeader>
                <CardTitle>{t.organization.companySection}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Globe className="text-muted-foreground h-4 w-4" />
                  <div>
                    <p className="text-muted-foreground text-sm">{t.tenant.dashboardLink}</p>
                    <p className="font-medium">
                      <code className="bg-muted rounded px-2 py-1">
                        {buildTenantUrl(tenant.slug, "/dashboard")}
                      </code>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Globe className="text-muted-foreground h-4 w-4" />
                  <div>
                    <p className="text-muted-foreground text-sm">{t.tenant.careersLink}</p>
                    <p className="font-medium">
                      <code className="bg-muted rounded px-2 py-1">
                        {buildTenantUrl(tenant.slug, "/careers")}
                      </code>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="text-muted-foreground h-4 w-4" />
                  <div>
                    <p className="text-muted-foreground text-sm">{t.common.email}</p>
                    <p className="font-medium" dir="ltr">
                      {tenant.email || "-"}
                    </p>
                  </div>
                </div>
                {tenant.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="text-muted-foreground h-4 w-4" />
                    <div>
                      <p className="text-muted-foreground text-sm">{t.common.phone}</p>
                      <p className="font-medium">{tenant.phone}</p>
                    </div>
                  </div>
                )}
                {tenant.commercialRegister && (
                  <div className="flex items-center gap-3">
                    <Building2 className="text-muted-foreground h-4 w-4" />
                    <div>
                      <p className="text-muted-foreground text-sm">
                        {t.organization.commercialReg}
                      </p>
                      <p className="font-medium">{tenant.commercialRegister}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Settings */}
            <Card className="border-border/60 bg-card/85 shadow-sm">
              <CardHeader>
                <CardTitle>{t.common.options}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t.common.options}</span>
                  <Badge variant="outline">
                    {tenant.defaultLocale === "ar" ? t.tenant.pArabic : "English"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t.tenant.defaultTheme}</span>
                  <Badge variant="outline">{tenant.defaultTheme}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t.tenant.timezone}</span>
                  <Badge variant="outline">{tenant.timezone}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t.common.country}</span>
                  <Badge variant="outline">{tenant.country}</Badge>
                </div>
                {tenant.city && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t.common.city}</span>
                    <Badge variant="outline">{tenant.city}</Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Activation State */}
          <Card className="border-border/60 bg-card/85 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                حالة التفعيل
                {tenant.setupCompletedAt ? (
                  <Badge variant="default" className="text-xs">
                    مكتمل
                  </Badge>
                ) : (tenant.setupStep ?? 0) > 0 ? (
                  <Badge variant="secondary" className="text-xs">
                    جارٍ الإعداد
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    لم يبدأ
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">خطوة الإعداد</span>
                <span className="font-semibold">
                  {tenant.setupCompletedAt ? "✓ مكتمل" : `${tenant.setupStep ?? 0} / 5`}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">تاريخ الاكتمال</span>
                <span className="text-sm font-semibold">
                  {tenant.setupCompletedAt
                    ? new Date(tenant.setupCompletedAt).toLocaleDateString(
                        locale === "ar" ? "ar-SA" : "en-US"
                      )
                    : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">رابط المتابعة</span>
                {!tenant.setupCompletedAt ? (
                  <a
                    href={buildTenantUrl(tenant.slug, "/dashboard/setup")}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary flex items-center gap-1 text-sm font-medium hover:underline">
                    <ExternalLink className="h-3 w-3" />
                    فتح wizard
                  </a>
                ) : (
                  <span className="text-muted-foreground text-sm">—</span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/85 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <History className="h-4 w-4" />
                {locale === "ar" ? "تشخيص رحلة التفعيل" : "Activation diagnostics"}
              </CardTitle>
              <CardDescription>
                {locale === "ar"
                  ? "ملخص زمني لأهم أحداث التفعيل والإعداد لمساعدة الدعم والمراجعة التشغيلية."
                  : "A timeline of the key activation and setup events for support and operations review."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border p-4">
                  <p className="text-muted-foreground text-sm">
                    {locale === "ar" ? "آخر حدث" : "Latest event"}
                  </p>
                  <p className="mt-2 text-sm font-semibold">
                    {activationDiagnostics.latestActivationEvent
                      ? formatDateTime(
                          activationDiagnostics.latestActivationEvent.createdAt,
                          locale
                        )
                      : "—"}
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-muted-foreground text-sm">
                    {locale === "ar" ? "أحداث التفعيل" : "Activation events"}
                  </p>
                  <p className="mt-2 text-2xl font-bold">
                    {activationDiagnostics.activationEventCount}
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-muted-foreground text-sm">
                    {locale === "ar" ? "آخر تقدم مسجل" : "Latest recorded progress"}
                  </p>
                  <p className="mt-2 text-2xl font-bold">
                    {activationDiagnostics.latestActivationProgress}%
                  </p>
                </div>
              </div>

              {activationDiagnostics.activationEventCount === 0 ? (
                <div className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm">
                  {locale === "ar"
                    ? "لا توجد أحداث تفعيل مسجلة بعد لهذه الشركة."
                    : "No activation events have been recorded for this tenant yet."}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-muted-foreground flex items-center justify-between text-xs">
                    <span>
                      {locale === "ar"
                        ? `خطوات محفوظة: ${activationDiagnostics.savedSetupStepCount}`
                        : `Saved steps: ${activationDiagnostics.savedSetupStepCount}`}
                    </span>
                    <span>
                      {locale === "ar"
                        ? `المعروض: ${activationDiagnostics.timeline.length} من ${activationDiagnostics.activationEventCount}`
                        : `Showing ${activationDiagnostics.timeline.length} of ${activationDiagnostics.activationEventCount}`}
                    </span>
                  </div>

                  {activationDiagnostics.timeline.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-start md:justify-between">
                      <div className="flex items-start gap-3">
                        <div className="bg-primary/10 mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full">
                          <History className="text-primary h-4 w-4" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium">{entry.title}</p>
                            <Badge variant="outline">
                              {formatAuditEntity(entry.entity, t, locale)}
                            </Badge>
                          </div>
                          {entry.summary ? (
                            <p className="text-muted-foreground text-sm">{entry.summary}</p>
                          ) : null}
                          <p className="text-muted-foreground text-xs">
                            {locale === "ar"
                              ? `بواسطة ${entry.actorLabel}`
                              : `By ${entry.actorLabel}`}
                          </p>
                        </div>
                      </div>

                      <span className="text-muted-foreground text-sm md:text-end">
                        {formatDateTime(entry.createdAt, locale)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Suspended Warning */}
          {tenant.status === "suspended" && tenant.suspendedReason && (
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">{t.tenant.suspended}</CardTitle>
                <CardDescription>
                  {t.tenant.pThisCompanyWasSuspendedOn}{" "}
                  {new Date(tenant.suspendedAt!).toLocaleDateString(
                    locale === "ar" ? "ar-SA" : "en-US"
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>
                  <strong>{t.common.reason}</strong> {tenant.suspendedReason}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="users">
          <Card className="border-border/60 bg-card/85 shadow-sm">
            <CardHeader>
              <CardTitle>{t.tenant.users}</CardTitle>
              <CardDescription>{t.tenant.usersDescription}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-lg border p-4">
                  <p className="text-muted-foreground text-sm">{t.superAdmin.totalUsers}</p>
                  <p className="mt-2 text-2xl font-bold">{tenant.usersCount}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-muted-foreground text-sm">{t.tenant.activeAccounts}</p>
                  <p className="mt-2 text-2xl font-bold">{activeUsersCount}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-muted-foreground text-sm">{t.tenant.admins}</p>
                  <p className="mt-2 text-2xl font-bold">{adminUsersCount}</p>
                </div>
              </div>

              {usersError && (
                <div className="border-destructive/30 bg-destructive/5 text-destructive rounded-lg border p-4 text-sm">
                  {usersError}
                </div>
              )}

              {!usersError && tenantUsers.length === 0 && (
                <div className="text-muted-foreground rounded-lg border border-dashed p-8 text-center">
                  {t.tenant.noUsers}
                </div>
              )}

              {tenantUsers.length > 0 && (
                <div className="space-y-3">
                  {tenantUsers.map((user) => {
                    const meta = getUserStatusMeta(user.status, t);
                    return (
                      <div
                        key={user.id}
                        className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium">{getUserDisplayName(user)}</p>
                            <Badge variant="outline">{getRoleLabel(user.role, t)}</Badge>
                            <Badge variant={meta.variant}>{meta.label}</Badge>
                          </div>
                          <p className="text-muted-foreground text-sm" dir="ltr">
                            {user.email}
                          </p>
                          {user.employee?.employeeNumber && (
                            <p className="text-muted-foreground text-xs">
                              {t.tenant.pEmployeeNumber} {user.employee.employeeNumber}
                            </p>
                          )}
                        </div>

                        <div className="text-muted-foreground space-y-1 text-sm md:text-end">
                          <p>
                            {t.tenant.pAccountAdded} {formatDateTime(user.createdAt, locale)}
                          </p>
                          <p>
                            {user.lastLoginAt
                              ? `${t.tenant.pLastLogin} ${formatDateTime(user.lastLoginAt, locale)}`
                              : t.tenant.pNoLoginRecordedYet}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card className="border-border/60 bg-card/85 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                {t.audit.auditLog}
              </CardTitle>
              <CardDescription>{t.audit.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {auditError && (
                <div className="border-destructive/30 bg-destructive/5 text-destructive rounded-lg border p-4 text-sm">
                  {auditError}
                </div>
              )}

              {!auditError && auditLogs.length === 0 && (
                <div className="text-muted-foreground rounded-lg border border-dashed p-8 text-center">
                  {t.audit.noEvents}
                </div>
              )}

              {auditLogs.length > 0 && (
                <div className="space-y-3">
                  {auditLogs.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-start md:justify-between">
                      <div className="flex items-start gap-3">
                        <div className="bg-primary/10 mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full">
                          <History className="text-primary h-4 w-4" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium">
                              {formatAuditAction(entry.action, t, locale)}
                            </p>
                            <Badge variant="outline">
                              {formatAuditEntity(entry.entity, t, locale)}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground text-sm">
                            {entry.user?.name || entry.user?.email
                              ? `${t.tenant.pBy} ${entry.user?.name || entry.user?.email}`
                              : t.tenant.pNoLinkedUser}
                            {entry.entityId
                              ? ` • ${t.tenant.pId} ${formatCompactId(entry.entityId)}`
                              : ""}
                          </p>
                        </div>
                      </div>

                      <span className="text-muted-foreground text-sm md:text-end">
                        {formatDateTime(entry.createdAt, locale)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
