import Link from "next/link";
import { getServerSession } from "next-auth";
import {
  AlertCircle,
  BarChart3,
  Building2,
  Clock,
  FilePenLine,
  LifeBuoy,
  ShieldCheck,
  Sparkles,
  Users
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getAppLocale } from "@/lib/i18n/locale";

export default async function SuperAdminPage() {
  const locale = await getAppLocale();
  const isAr = locale === "ar";
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return (
      <div className="space-y-4">
        <div className="bg-card/80 rounded-2xl border p-5 shadow-sm">
          <h1 className="text-2xl font-semibold tracking-tight">
            {isAr ? "غير مصرح" : "Unauthorized"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isAr
              ? "هذه الصفحة مخصصة لإدارة المنصة فقط."
              : "This page is for platform administration only."}
          </p>
        </div>
      </div>
    );
  }

  const [
    totalTenants,
    activeTenants,
    pendingRequests,
    totalUsers,
    openTickets,
    recentTenants,
    pendingSubscriptions,
    enterpriseTenants,
    professionalTenants
  ] = await Promise.all([
    prisma.tenant.count(),
    prisma.tenant.count({ where: { status: "ACTIVE" } }),
    prisma.tenantRequest.count({ where: { status: "PENDING" } }),
    prisma.user.count(),
    prisma.supportTicket.count({
      where: {
        status: {
          in: ["OPEN", "IN_PROGRESS", "WAITING_CUSTOMER"]
        }
      }
    }),
    prisma.tenant.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { _count: { select: { users: true, employees: true } } }
    }),
    prisma.tenantRequest.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      take: 4
    }),
    prisma.tenant.count({ where: { plan: "ENTERPRISE" } }),
    prisma.tenant.count({ where: { plan: "PROFESSIONAL" } })
  ]);

  const cards = [
    {
      title: isAr ? "إجمالي الشركات" : "Total tenants",
      value: totalTenants,
      description: isAr ? "كل العملاء على المنصة" : "All customers on the platform",
      icon: Building2,
      accent: "bg-blue-500/10 text-blue-700 dark:text-blue-300"
    },
    {
      title: isAr ? "المستخدمون" : "Platform users",
      value: totalUsers,
      description: isAr ? "المستخدمون عبر كل البيئات" : "Users across all tenant workspaces",
      icon: Users,
      accent: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
    },
    {
      title: isAr ? "طلبات بانتظار القرار" : "Pending requests",
      value: pendingRequests,
      description: isAr ? "تحتاج مراجعة أو تفعيل" : "Need review or activation",
      icon: Clock,
      accent: "bg-amber-500/10 text-amber-700 dark:text-amber-300"
    },
    {
      title: isAr ? "دعم مفتوح" : "Open support load",
      value: openTickets,
      description: isAr ? "تذاكر تحتاج متابعة مركزية" : "Tickets requiring central follow-up",
      icon: LifeBuoy,
      accent: "bg-rose-500/10 text-rose-700 dark:text-rose-300"
    }
  ];

  const modules = [
    {
      href: "/dashboard/super-admin/insights",
      title: isAr ? "تقارير المنصة" : "Platform insights",
      description: isAr
        ? "تابع الصحة التشغيلية، أحجام العملاء، وحالة الدعم عبر المنصة بالكامل."
        : "Track operational health, customer scale, and support pressure across the platform.",
      icon: BarChart3
    },
    {
      href: "/dashboard/super-admin/content",
      title: isAr ? "المحتوى والسيو" : "Content and SEO",
      description: isAr
        ? "عدّل نصوص الهبوط والأسعار والوظائف ووصف السيو الافتراضي من لوحة واحدة."
        : "Edit landing, pricing, careers copy, and default SEO from one control surface.",
      icon: FilePenLine
    },
    {
      href: "/dashboard/super-admin/tenants",
      title: isAr ? "إدارة الشركات" : "Tenant administration",
      description: isAr
        ? "ادخل على الشركات، تتبع الباقات، وراجع الجاهزية قبل التفعيل."
        : "Inspect tenants, track plans, and review readiness before activation.",
      icon: ShieldCheck
    },
    {
      href: "/dashboard/support",
      title: isAr ? "مكتب الدعم" : "Support desk",
      description: isAr
        ? "راقب البلاغات المفتوحة وتأكد من سرعة الاستجابة وجودة المعالجة."
        : "Monitor open cases and keep response quality and turnaround under control.",
      icon: AlertCircle
    }
  ];

  return (
    <div className="space-y-6">
      <section className="bg-card/85 rounded-3xl border p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              <Sparkles className="me-1 size-3.5" />
              {isAr ? "مركز قيادة الـ SaaS" : "SaaS command center"}
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight">
              {isAr ? "لوحة قيادة السوبر أدمن" : "Super admin control center"}
            </h1>
            <p className="text-muted-foreground max-w-3xl text-sm leading-6">
              {isAr
                ? "من هنا تتابع التوسع التجاري، جودة التشغيل، إدارة المحتوى العام، والدعم المركزي بدون التنقل بين شاشات متفرقة."
                : "Use this surface to monitor commercial growth, operational quality, public-site content, and centralized support without hopping across disconnected screens."}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link href="/dashboard/super-admin/content">
                <FilePenLine className="size-4" />
                {isAr ? "تحرير المحتوى" : "Edit content"}
              </Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard/super-admin/tenants/new">
                <Building2 className="size-4" />
                {isAr ? "إضافة شركة" : "Add tenant"}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="border-border/60 bg-card/85 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <span
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${card.accent}`}>
                  <Icon className="size-4" />
                </span>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold tracking-tight">
                  {card.value.toLocaleString()}
                </div>
                <p className="text-muted-foreground mt-2 text-sm">{card.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-border/60 bg-card/85 shadow-sm">
          <CardHeader>
            <CardTitle>{isAr ? "وحدات التحكم الأساسية" : "Core control modules"}</CardTitle>
            <CardDescription>
              {isAr
                ? "أكثر الشاشات تأثيرًا لإدارة المنصة كخدمة SaaS بشكل يومي."
                : "The highest-impact surfaces to operate the platform as a SaaS product day to day."}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {modules.map((module) => {
              const Icon = module.icon;
              return (
                <Link
                  key={module.href}
                  href={module.href}
                  className="group bg-background/70 hover:border-primary/35 hover:bg-primary/[0.04] rounded-2xl border p-4 shadow-sm transition hover:-translate-y-0.5">
                  <div className="flex items-start gap-3">
                    <span className="bg-primary/10 text-primary inline-flex h-10 w-10 items-center justify-center rounded-xl">
                      <Icon className="size-5" />
                    </span>
                    <div>
                      <p className="font-medium">{module.title}</p>
                      <p className="text-muted-foreground mt-1 text-sm leading-6">
                        {module.description}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/85 shadow-sm">
          <CardHeader>
            <CardTitle>{isAr ? "توزيع العملاء" : "Customer mix"}</CardTitle>
            <CardDescription>
              {isAr
                ? "لقطة سريعة على جودة التوزيع التجاري الحالي."
                : "A quick glance at current commercial distribution."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <MetricRow
              label={isAr ? "شركات نشطة" : "Active tenants"}
              value={activeTenants}
              total={totalTenants}
            />
            <MetricRow
              label={isAr ? "باقات احترافية" : "Professional plans"}
              value={professionalTenants}
              total={totalTenants}
            />
            <MetricRow
              label={isAr ? "باقات Enterprise" : "Enterprise plans"}
              value={enterpriseTenants}
              total={totalTenants}
            />
            <MetricRow
              label={isAr ? "طلبات جديدة" : "Pending requests"}
              value={pendingRequests}
              total={[totalTenants, pendingRequests].reduce((sum, item) => sum + item, 0)}
            />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card className="border-border/60 bg-card/85 shadow-sm">
          <CardHeader>
            <CardTitle>{isAr ? "أحدث الشركات" : "Newest tenants"}</CardTitle>
            <CardDescription>
              {isAr
                ? "متابعة سريعة لآخر الحسابات التي تم إنشاؤها."
                : "Quick follow-up for the most recently created accounts."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentTenants.map((tenant) => (
              <div
                key={tenant.id}
                className="bg-background/70 flex items-center justify-between rounded-2xl border p-4">
                <div>
                  <p className="font-medium">{tenant.nameAr ?? tenant.name}</p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {tenant.plan} • {tenant._count.users} {isAr ? "مستخدم" : "users"} •{" "}
                    {tenant._count.employees} {isAr ? "موظف" : "employees"}
                  </p>
                </div>
                <Badge variant={tenant.status === "ACTIVE" ? "default" : "secondary"}>
                  {tenant.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/85 shadow-sm">
          <CardHeader>
            <CardTitle>{isAr ? "طلبات تحتاج قرارًا" : "Requests needing a decision"}</CardTitle>
            <CardDescription>
              {isAr
                ? "أولوية اليوم لتسريع التحويل والتفعيل."
                : "Today’s priority queue for faster conversion and activation."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingSubscriptions.length > 0 ? (
              pendingSubscriptions.map((request) => (
                <div
                  key={request.id}
                  className="bg-background/70 flex items-center justify-between rounded-2xl border p-4">
                  <div>
                    <p className="font-medium">{request.companyNameAr ?? request.companyName}</p>
                    <p className="text-muted-foreground mt-1 text-sm">{request.contactEmail}</p>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/dashboard/super-admin/requests/${request.id}`}>
                      {isAr ? "مراجعة" : "Review"}
                    </Link>
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-muted-foreground flex min-h-40 items-center justify-center rounded-2xl border border-dashed text-center text-sm">
                {isAr ? "لا توجد طلبات معلقة حاليًا." : "There are no pending requests right now."}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function MetricRow({ label, value, total }: { label: string; value: number; total: number }) {
  const width = total > 0 ? Math.max(8, Math.round((value / total) * 100)) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="font-medium">{value}</span>
      </div>
      <div className="bg-muted h-2 rounded-full">
        <div className={`bg-primary h-2 rounded-full ${progressWidthClass(width)}`} />
      </div>
    </div>
  );
}

function progressWidthClass(percent: number) {
  if (percent <= 0) return "w-0";
  if (percent <= 8) return "w-1/12";
  if (percent <= 16) return "w-1/6";
  if (percent <= 25) return "w-1/4";
  if (percent <= 33) return "w-1/3";
  if (percent <= 42) return "w-5/12";
  if (percent <= 50) return "w-1/2";
  if (percent <= 58) return "w-7/12";
  if (percent <= 66) return "w-2/3";
  if (percent <= 75) return "w-3/4";
  if (percent <= 83) return "w-5/6";
  if (percent <= 91) return "w-11/12";
  return "w-full";
}
