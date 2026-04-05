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

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function TenantDetailsPage({ params }: PageProps) {
  const [id, setId] = React.useState<string | null>(null);
  const [tenant, setTenant] = React.useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

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
      try {
        const res = await tenantsService.getById(id);
        if (!mounted) return;
        if (res.success && res.data) {
          setTenant(res.data);
        } else {
          setTenant(null);
          setError(res.error || "تعذر تحميل بيانات الشركة");
        }
      } catch (e) {
        if (!mounted) return;
        setTenant(null);
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
                قائمة المستخدمين المسجلين في هذه الشركة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-8">
                سيتم إضافة جدول المستخدمين لاحقًا
              </p>
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
            <CardContent>
              <div className="space-y-4">
                {/* Mock audit entries */}
                <div className="flex items-start gap-4 border-b pb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    <Building2 className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">تم إنشاء الشركة</p>
                    <p className="text-sm text-muted-foreground">
                      بواسطة Super Admin
                    </p>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {new Date(tenant.createdAt).toLocaleString("ar-SA")}
                  </span>
                </div>
                {tenant.suspendedAt && (
                  <div className="flex items-start gap-4 border-b pb-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive/10">
                      <Building2 className="h-4 w-4 text-destructive" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">تم إيقاف الشركة</p>
                      <p className="text-sm text-muted-foreground">
                        السبب: {tenant.suspendedReason}
                      </p>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(tenant.suspendedAt).toLocaleString("ar-SA")}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
