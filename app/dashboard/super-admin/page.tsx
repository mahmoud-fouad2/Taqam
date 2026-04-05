/**
 * Super Admin Dashboard
 * لوحة تحكم الـ Super Admin
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, Clock, AlertCircle, TrendingUp, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function SuperAdminPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    // Keep the page non-disclosing and consistent with admin APIs.
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">غير مصرح</h1>
        <p className="text-muted-foreground">هذه الصفحة مخصصة للسوبر أدمن فقط.</p>
      </div>
    );
  }

  const [
    totalTenants,
    activeTenants,
    pendingRequestsCount,
    totalUsers,
    recentTenants,
    pendingRequests,
  ] = await Promise.all([
    prisma.tenant.count(),
    prisma.tenant.count({ where: { status: "ACTIVE" } }),
    prisma.tenantRequest.count({ where: { status: "PENDING" } }),
    prisma.user.count(),
    prisma.tenant.findMany({
      orderBy: { createdAt: "desc" },
      take: 3,
      include: { _count: { select: { users: true } } },
    }),
    prisma.tenantRequest.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const stats = {
    totalTenants,
    activeTenants,
    pendingRequests: pendingRequestsCount,
    totalUsers,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">لوحة تحكم Super Admin</h1>
          <p className="text-muted-foreground">إدارة الشركات والمستأجرين</p>
        </div>
        <Link
          href="/dashboard/super-admin/tenants/new"
          className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Building2 className="h-4 w-4" />
          إنشاء شركة جديدة
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الشركات</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTenants}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeTenants} نشطة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المستخدمين</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              عبر جميع الشركات
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">طلبات معلقة</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingRequests}</div>
            <p className="text-xs text-muted-foreground">
              بانتظار المراجعة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">النمو الشهري</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+15%</div>
            <p className="text-xs text-muted-foreground">
              مقارنة بالشهر السابق
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Tenants */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              أحدث الشركات
            </CardTitle>
            <CardDescription>آخر الشركات المضافة للمنصة</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTenants.map((tenant) => (
                <div
                  key={tenant.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                >
                  <div className="space-y-1">
                    <Link
                      href={`/dashboard/super-admin/tenants/${tenant.id}`}
                      className="font-medium hover:text-primary"
                    >
                      {tenant.nameAr ?? tenant.name}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      /t/{tenant.slug} • {tenant._count.users} مستخدم
                    </p>
                  </div>
                  <Badge
                    variant={tenant.status === "ACTIVE" ? "default" : "secondary"}
                  >
                    {tenant.status === "ACTIVE" ? (
                      <><CheckCircle2 className="h-3 w-3 me-1" /> نشط</>
                    ) : (
                      <><Clock className="h-3 w-3 me-1" /> معلق</>
                    )}
                  </Badge>
                </div>
              ))}
            </div>
            <Link
              href="/dashboard/super-admin/tenants"
              className="mt-4 block text-center text-sm text-primary hover:underline"
            >
              عرض جميع الشركات →
            </Link>
          </CardContent>
        </Card>

        {/* Pending Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              طلبات الاشتراك المعلقة
            </CardTitle>
            <CardDescription>طلبات بانتظار الموافقة</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingRequests.length > 0 ? (
              <div className="space-y-4">
                {pendingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{request.companyNameAr ?? request.companyName}</p>
                      <p className="text-sm text-muted-foreground">
                        {request.contactEmail}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/dashboard/super-admin/requests/${request.id}`}
                        className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                      >
                        مراجعة
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                <CheckCircle2 className="mb-2 h-8 w-8" />
                <p>لا توجد طلبات معلقة</p>
              </div>
            )}
            <Link
              href="/dashboard/super-admin/requests"
              className="mt-4 block text-center text-sm text-primary hover:underline"
            >
              عرض جميع الطلبات →
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            الربط بين الواجهة والمنصة
          </CardTitle>
          <CardDescription>روابط مباشرة بين الواجهة العامة ولوحات التشغيل الداخلية</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Link href="/help-center" className="rounded-xl border p-4 transition-colors hover:bg-muted/40">
              <p className="font-medium">مركز المساعدة العام</p>
              <p className="mt-1 text-sm text-muted-foreground">راجع المحتوى العام وقنوات التواصل كما يراها العميل.</p>
            </Link>
            <Link href="/careers" className="rounded-xl border p-4 transition-colors hover:bg-muted/40">
              <p className="font-medium">بوابة الوظائف العامة</p>
              <p className="mt-1 text-sm text-muted-foreground">راجع الوظائف المجمعة وصفحات الشركات العامة كما يراها المرشحون.</p>
            </Link>
            <Link href="/pricing" className="rounded-xl border p-4 transition-colors hover:bg-muted/40">
              <p className="font-medium">الأسعار والباقات</p>
              <p className="mt-1 text-sm text-muted-foreground">تحقق من توافق الباقات العامة مع إعدادات المنصة الداخلية.</p>
            </Link>
            <Link href="/dashboard/support" className="rounded-xl border p-4 transition-colors hover:bg-muted/40">
              <p className="font-medium">تذاكر الدعم</p>
              <p className="mt-1 text-sm text-muted-foreground">متابعة الحالات المفتوحة من الشركات داخل الداشبورد.</p>
            </Link>
            <Link href="/dashboard/help-center" className="rounded-xl border p-4 transition-colors hover:bg-muted/40">
              <p className="font-medium">مساعدة داخلية</p>
              <p className="mt-1 text-sm text-muted-foreground">اختصارات التشغيل والتمييز بين صلاحيات الشركة والسوبر أدمن.</p>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
