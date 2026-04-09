/**
 * Super Admin Dashboard
 * لوحة تحكم الـ Super Admin
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Users, Clock, AlertCircle, TrendingUp, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getAppLocale } from "@/lib/i18n/locale";
import { getText } from "@/lib/i18n/text";

export default async function SuperAdminPage() {
  const locale = await getAppLocale();
  const t = getText(locale);
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    // Keep the page non-disclosing and consistent with admin APIs.
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-border/60 bg-card/80 p-5 shadow-sm">
          <h1 className="text-2xl font-semibold tracking-tight">{t.superAdmin.pUnauthorized}</h1>
          <p className="mt-1 text-muted-foreground">{t.superAdmin.onlyForAdmin}</p>
        </div>
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
      <section className="rounded-2xl border border-border/60 bg-card/80 p-5 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/70">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">{t.superAdmin.title}</h1>
            <p className="text-sm text-muted-foreground">{t.superAdmin.subtitle}</p>
          </div>
          <Button asChild className="min-w-36">
            <Link href="/dashboard/super-admin/tenants/new">
              <Building2 className="h-4 w-4" />
              {t.common.add}
            </Link>
          </Button>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/60 bg-card/85 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.superAdmin.totalTenants}</CardTitle>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Building2 className="h-4 w-4" />
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTenants}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeTenants} {t.superAdmin.pActive}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/85 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.superAdmin.totalUsers}</CardTitle>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Users className="h-4 w-4" />
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">{t.superAdmin.acrossAllTenants}</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/85 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.superAdmin.pendingRequests}</CardTitle>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300">
              <Clock className="h-4 w-4" />
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingRequests}</div>
            <p className="text-xs text-muted-foreground">{t.superAdmin.awaitingReview}</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/85 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.superAdmin.monthlyGrowth}</CardTitle>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
              <TrendingUp className="h-4 w-4" />
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+15%</div>
            <p className="text-xs text-muted-foreground">{t.superAdmin.vsLastMonth}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/60 bg-card/85 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {t.superAdmin.recentTenants}
            </CardTitle>
            <CardDescription>{t.superAdmin.recentTenantsDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTenants.map((tenant) => (
                <div
                  key={tenant.id}
                  className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/25 p-3 transition-colors hover:bg-muted/40"
                >
                  <div className="space-y-1">
                    <Link
                      href={`/dashboard/super-admin/tenants/${tenant.id}`}
                      className="font-medium hover:text-primary"
                    >
                      {tenant.nameAr ?? tenant.name}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      /t/{tenant.slug} • {tenant._count.users} {t.superAdmin.pUser}
                    </p>
                  </div>
                  <Badge
                    variant={tenant.status === "ACTIVE" ? "default" : "secondary"}
                    className="gap-1"
                  >
                    {tenant.status === "ACTIVE" ? (
                      <>
                        <CheckCircle2 className="h-3 w-3" />
                        {t.common.active}
                      </>
                    ) : (
                      <>
                        <Clock className="h-3 w-3" />
                        {t.common.pending}
                      </>
                    )}
                  </Badge>
                </div>
              ))}
            </div>
            <Link
              href="/dashboard/super-admin/tenants"
              className="mt-4 inline-flex text-sm font-medium text-primary hover:underline"
            >
              {t.superAdmin.viewAllTenants}
            </Link>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/85 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              {t.superAdmin.pendingSubscriptions}
            </CardTitle>
            <CardDescription>{t.superAdmin.pendingApproval}</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingRequests.length > 0 ? (
              <div className="space-y-4">
                {pendingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/25 p-3 transition-colors hover:bg-muted/40"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{request.companyNameAr ?? request.companyName}</p>
                      <p className="text-sm text-muted-foreground">
                        {request.contactEmail}
                      </p>
                    </div>
                    <Button asChild size="sm" className="h-8">
                      <Link href={`/dashboard/super-admin/requests/${request.id}`}>
                        {t.common.review}
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                <CheckCircle2 className="mb-2 h-8 w-8" />
                <p>{t.superAdmin.noPendingRequests}</p>
              </div>
            )}
            <Link
              href="/dashboard/super-admin/requests"
              className="mt-4 inline-flex text-sm font-medium text-primary hover:underline"
            >
              {t.superAdmin.viewAllRequests}
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60 bg-card/85 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {t.superAdmin.linkage}
          </CardTitle>
          <CardDescription>{t.superAdmin.linkageDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Link href="/help-center" className="group rounded-xl border border-border/60 bg-background/70 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/[0.06]">
              <p className="font-medium">{t.superAdmin.helpCenter}</p>
              <p className="mt-1 text-sm text-muted-foreground transition-colors group-hover:text-foreground/80">{t.superAdmin.helpCenterDesc}</p>
            </Link>
            <Link href="/careers" className="group rounded-xl border border-border/60 bg-background/70 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/[0.06]">
              <p className="font-medium">{t.superAdmin.careersPortal}</p>
              <p className="mt-1 text-sm text-muted-foreground transition-colors group-hover:text-foreground/80">{t.superAdmin.careersPortalDesc}</p>
            </Link>
            <Link href="/pricing" className="group rounded-xl border border-border/60 bg-background/70 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/[0.06]">
              <p className="font-medium">{t.superAdmin.pricing}</p>
              <p className="mt-1 text-sm text-muted-foreground transition-colors group-hover:text-foreground/80">{t.superAdmin.pricingDesc}</p>
            </Link>
            <Link href="/dashboard/support" className="group rounded-xl border border-border/60 bg-background/70 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/[0.06]">
              <p className="font-medium">{t.superAdmin.supportTickets}</p>
              <p className="mt-1 text-sm text-muted-foreground transition-colors group-hover:text-foreground/80">{t.superAdmin.supportTicketsDesc}</p>
            </Link>
            <Link href="/dashboard/help-center" className="group rounded-xl border border-border/60 bg-background/70 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/[0.06]">
              <p className="font-medium">{t.superAdmin.internalHelp}</p>
              <p className="mt-1 text-sm text-muted-foreground transition-colors group-hover:text-foreground/80">{t.superAdmin.internalHelpDesc}</p>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
