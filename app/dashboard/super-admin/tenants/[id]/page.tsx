/**
 * Tenant Details Page
 * صفحة تفاصيل الشركة
 */

"use client";

import Link from "next/link";
import * as React from "react";
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
import { buildTenantUrl } from "@/lib/tenant";
import { tenantsService } from "@/lib/api";

const statusConfig: Record<TenantStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "نشط", variant: "default" },
  pending: { label: "معلق", variant: "secondary" },
  suspended: { label: "موقوف", variant: "destructive" },
  cancelled: { label: "ملغاة", variant: "outline" },
  deleted: { label: "محذوف", variant: "outline" },
};

function getStatusMeta(status: string) {
  return (
    statusConfig[status as TenantStatus] ?? {
      label: status,
      variant: "outline" as const,
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

type TenantAuditLog = {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
};

const userStatusConfig: Record<string, { label: string; variant: BadgeVariant }> = {
  ACTIVE: { label: "نشط", variant: "default" },
  INACTIVE: { label: "غير نشط", variant: "secondary" },
  SUSPENDED: { label: "موقوف", variant: "destructive" },
  PENDING_VERIFICATION: { label: "بانتظار التفعيل", variant: "outline" },
};

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: "مدير المنصة",
  TENANT_ADMIN: "مدير الشركة",
  HR_MANAGER: "مدير الموارد البشرية",
  MANAGER: "مدير",
  EMPLOYEE: "موظف",
};

const rolePriority: Record<string, number> = {
  TENANT_ADMIN: 0,
  HR_MANAGER: 1,
  MANAGER: 2,
  EMPLOYEE: 3,
  SUPER_ADMIN: 4,
};

const auditActionLabels: Record<string, string> = {
  LOGIN: "تسجيل دخول",
  LOGOUT: "تسجيل خروج",
  LOGIN_FAILED: "محاولة دخول فاشلة",
  PASSWORD_CHANGED: "تغيير كلمة المرور",
  PASSWORD_RESET: "إعادة تعيين كلمة المرور",
  TOKEN_REFRESH: "تجديد الجلسة",
  USER_CREATE: "إنشاء مستخدم",
  USER_UPDATE: "تحديث مستخدم",
  USER_DELETE: "حذف مستخدم",
  USER_SUSPEND: "إيقاف مستخدم",
  USER_ACTIVATE: "تفعيل مستخدم",
  EMPLOYEE_CREATE: "إنشاء موظف",
  EMPLOYEE_UPDATE: "تحديث موظف",
  EMPLOYEE_DELETE: "حذف موظف",
  EMPLOYEE_BULK_IMPORT: "استيراد جماعي للموظفين",
  EMPLOYEE_STATUS_CHANGE: "تغيير حالة موظف",
  DATA_IMPORT: "استيراد بيانات",
  DATA_EXPORT: "تصدير بيانات",
  SETTINGS_UPDATE: "تحديث الإعدادات",
  PAYROLL_PROCESS: "معالجة الرواتب",
};

const auditEntityLabels: Record<string, string> = {
  User: "المستخدم",
  Employee: "الموظف",
  Tenant: "الشركة",
  DevelopmentPlan: "خطة التطوير",
  PayrollPeriod: "فترة الرواتب",
  MobileSession: "جلسة الجوال",
  MobileRefreshToken: "جلسة الجوال",
  Settings: "الإعدادات",
};

function getUserStatusMeta(status: string) {
  return userStatusConfig[status] ?? { label: status, variant: "outline" as const };
}

function getUserDisplayName(user: Pick<TenantUser, "firstName" | "lastName" | "email">) {
  const fullName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
  return fullName || user.email;
}

function getRoleLabel(role: string) {
  return roleLabels[role] ?? role;
}

function formatAuditAction(action: string) {
  return auditActionLabels[action] ?? action.replaceAll("_", " ");
}

function formatAuditEntity(entity: string) {
  return auditEntityLabels[entity] ?? entity;
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString("ar-SA");
}

function formatCompactId(value: string | null | undefined) {
  if (!value) return null;
  if (value.length <= 12) return value;
  return `${value.slice(0, 8)}...`;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function TenantDetailsPage({ params }: PageProps) {
  const [id, setId] = React.useState<string | null>(null);
  const [tenant, setTenant] = React.useState<Tenant | null>(null);
  const [tenantUsers, setTenantUsers] = React.useState<TenantUser[]>([]);
  const [auditLogs, setAuditLogs] = React.useState<TenantAuditLog[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [usersError, setUsersError] = React.useState<string | null>(null);
  const [auditError, setAuditError] = React.useState<string | null>(null);

  // Resolve params Promise
  React.useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

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
            params: { tenantId: id, pageSize: 20 },
          }),
        ]);

        if (!mounted) return;

        if (tenantRes.success && tenantRes.data) {
          setTenant(tenantRes.data);
        } else {
          setTenant(null);
          setError(tenantRes.error || "تعذر تحميل بيانات الشركة");
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
          setUsersError(usersRes.error || "تعذر تحميل المستخدمين");
        }

        if (auditRes.success && Array.isArray(auditRes.data)) {
          setAuditLogs(auditRes.data);
        } else {
          setAuditLogs([]);
          setAuditError(auditRes.error || "تعذر تحميل سجل التغييرات");
        }
      } catch (e) {
        if (!mounted) return;
        setTenant(null);
        setTenantUsers([]);
        setAuditLogs([]);
        setError(e instanceof Error ? e.message : "تعذر تحميل بيانات الشركة");
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  if (!id || isLoading) {
    return (
      <div className="flex items-center justify-center py-10 text-muted-foreground">
        جاري تحميل بيانات الشركة...
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-destructive">
          {error}
        </div>
        <Link href="/dashboard/super-admin/tenants" className="text-sm text-primary hover:underline">
          العودة إلى قائمة الشركات
        </Link>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">الشركة غير موجودة.</p>
        <Link href="/dashboard/super-admin/tenants" className="text-sm text-primary hover:underline">
          العودة إلى قائمة الشركات
        </Link>
      </div>
    );
  }

  const activeUsersCount = tenantUsers.filter((user) => user.status === "ACTIVE").length;
  const adminUsersCount = tenantUsers.filter((user) => user.role === "TENANT_ADMIN").length;

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/dashboard/super-admin/tenants" className="hover:text-primary">
              الشركات
            </Link>
            <ArrowRight className="h-4 w-4 rotate-180" />
            <span>{tenant.nameAr}</span>
          </div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            {tenant.nameAr}
            {(() => {
              const meta = getStatusMeta(String((tenant as any)?.status ?? "unknown"));
              return (
                <Badge variant={meta?.variant ?? "outline"} className="ms-2">
                  {meta?.label ?? "—"}
                </Badge>
              );
            })()}
          </h1>
          <p className="text-muted-foreground">{tenant.name}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/super-admin/tenants/${id}/settings`}>
              <Settings className="me-2 h-4 w-4" />
              الإعدادات
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <a
              href={buildTenantUrl(tenant.slug, "/dashboard")}
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink className="me-2 h-4 w-4" />
              فتح لوحة الشركة
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a
              href={buildTenantUrl(tenant.slug, "/careers")}
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink className="me-2 h-4 w-4" />
              بوابة التوظيف العامة
            </a>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المستخدمين</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tenant.usersCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الموظفين</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tenant.employeesCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الباقة</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{tenant.plan}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">تاريخ الإنشاء</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Date(tenant.createdAt).toLocaleDateString("ar-SA")}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="info" className="space-y-4">
        <TabsList>
          <TabsTrigger value="info">المعلومات</TabsTrigger>
          <TabsTrigger value="users">المستخدمين</TabsTrigger>
          <TabsTrigger value="audit">سجل التغييرات</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Company Info */}
            <Card>
              <CardHeader>
                <CardTitle>معلومات الشركة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">رابط لوحة الشركة</p>
                    <p className="font-medium">
                      <code className="rounded bg-muted px-2 py-1">
                        {buildTenantUrl(tenant.slug, "/dashboard")}
                      </code>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">رابط بوابة التوظيف</p>
                    <p className="font-medium">
                      <code className="rounded bg-muted px-2 py-1">
                        {buildTenantUrl(tenant.slug, "/careers")}
                      </code>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">البريد الإلكتروني</p>
                    <p className="font-medium" dir="ltr">{tenant.email || "-"}</p>
                  </div>
                </div>
                {tenant.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">رقم الهاتف</p>
                      <p className="font-medium">{tenant.phone}</p>
                    </div>
                  </div>
                )}
                {tenant.commercialRegister && (
                  <div className="flex items-center gap-3">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">السجل التجاري</p>
                      <p className="font-medium">{tenant.commercialRegister}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Settings */}
            <Card>
              <CardHeader>
                <CardTitle>الإعدادات</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">اللغة الافتراضية</span>
                  <Badge variant="outline">
                    {tenant.defaultLocale === "ar" ? "العربية" : "English"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">الثيم الافتراضي</span>
                  <Badge variant="outline">{tenant.defaultTheme}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">المنطقة الزمنية</span>
                  <Badge variant="outline">{tenant.timezone}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">الدولة</span>
                  <Badge variant="outline">{tenant.country}</Badge>
                </div>
                {tenant.city && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">المدينة</span>
                    <Badge variant="outline">{tenant.city}</Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Suspended Warning */}
          {tenant.status === "suspended" && tenant.suspendedReason && (
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">الشركة موقوفة</CardTitle>
                <CardDescription>
                  تم إيقاف هذه الشركة بتاريخ{" "}
                  {new Date(tenant.suspendedAt!).toLocaleDateString("ar-SA")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p><strong>السبب:</strong> {tenant.suspendedReason}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>مستخدمي الشركة</CardTitle>
              <CardDescription>
                الحسابات المرتبطة بهذه الشركة مع الحالة وآخر تسجيل دخول
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">إجمالي المستخدمين</p>
                  <p className="mt-2 text-2xl font-bold">{tenant.usersCount}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">الحسابات النشطة</p>
                  <p className="mt-2 text-2xl font-bold">{activeUsersCount}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">مدراء الشركة</p>
                  <p className="mt-2 text-2xl font-bold">{adminUsersCount}</p>
                </div>
              </div>

              {usersError && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                  {usersError}
                </div>
              )}

              {!usersError && tenantUsers.length === 0 && (
                <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                  لا توجد حسابات مستخدمين مرتبطة بهذه الشركة حتى الآن.
                </div>
              )}

              {tenantUsers.length > 0 && (
                <div className="space-y-3">
                  {tenantUsers.map((user) => {
                    const meta = getUserStatusMeta(user.status);
                    return (
                      <div key={user.id} className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium">{getUserDisplayName(user)}</p>
                            <Badge variant="outline">{getRoleLabel(user.role)}</Badge>
                            <Badge variant={meta.variant}>{meta.label}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground" dir="ltr">{user.email}</p>
                          {user.employee?.employeeNumber && (
                            <p className="text-xs text-muted-foreground">
                              الرقم الوظيفي: {user.employee.employeeNumber}
                            </p>
                          )}
                        </div>

                        <div className="space-y-1 text-sm text-muted-foreground md:text-end">
                          <p>أضيف الحساب: {formatDateTime(user.createdAt)}</p>
                          <p>
                            {user.lastLoginAt
                              ? `آخر دخول: ${formatDateTime(user.lastLoginAt)}`
                              : "لا يوجد تسجيل دخول بعد"}
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                سجل التغييرات (Audit Log)
              </CardTitle>
              <CardDescription>
                جميع التغييرات التي تمت على هذه الشركة
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {auditError && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                  {auditError}
                </div>
              )}

              {!auditError && auditLogs.length === 0 && (
                <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                  لا توجد أحداث مسجلة لهذه الشركة حتى الآن.
                </div>
              )}

              {auditLogs.length > 0 && (
                <div className="space-y-3">
                  {auditLogs.map((entry) => (
                    <div key={entry.id} className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-start md:justify-between">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                          <History className="h-4 w-4 text-primary" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium">{formatAuditAction(entry.action)}</p>
                            <Badge variant="outline">{formatAuditEntity(entry.entity)}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {entry.user?.name || entry.user?.email
                              ? `بواسطة ${entry.user?.name || entry.user?.email}`
                              : "بدون مستخدم مرتبط"}
                            {entry.entityId ? ` • المعرف: ${formatCompactId(entry.entityId)}` : ""}
                          </p>
                        </div>
                      </div>

                      <span className="text-sm text-muted-foreground md:text-end">
                        {formatDateTime(entry.createdAt)}
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
