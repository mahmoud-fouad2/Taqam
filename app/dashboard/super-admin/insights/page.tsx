import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import {
  Building2,
  CircleAlert,
  CircleCheckBig,
  CreditCard,
  ShieldCheck,
  Smartphone,
  Users
} from "lucide-react";

import { authOptions } from "@/lib/auth";
import { deriveSystemHealthSnapshot } from "@/lib/health";
import { prisma } from "@/lib/db";
import { getAppLocale } from "@/lib/i18n/locale";
import { buildMobileDiagnosticsSummary } from "@/lib/mobile-diagnostics";
import { getRuntimeIntegrationReport } from "@/lib/runtime-integrations";

export default async function SuperAdminInsightsPage() {
  const locale = await getAppLocale();
  const isAr = locale === "ar";
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  const [
    tenants,
    users,
    openTickets,
    activeTenants,
    enterpriseTenants,
    recentMobileDiagnosticsLogs,
    mobileEventsLast7Days,
    mobileFatalEventsLast7Days,
    mobileAffectedTenants
  ] = await Promise.all([
    prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        plan: true,
        createdAt: true,
        _count: {
          select: {
            users: true,
            employees: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    }),
    prisma.user.count(),
    prisma.supportTicket.count({
      where: {
        status: {
          in: ["OPEN", "IN_PROGRESS", "WAITING_CUSTOMER"]
        }
      }
    }),
    prisma.tenant.count({
      where: {
        status: "ACTIVE"
      }
    }),
    prisma.tenant.count({
      where: {
        plan: "ENTERPRISE"
      }
    }),
    prisma.auditLog.findMany({
      where: {
        action: {
          in: ["MOBILE_APP_ERROR", "MOBILE_APP_CRASH"]
        }
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 6
    }),
    prisma.auditLog.count({
      where: {
        action: {
          in: ["MOBILE_APP_ERROR", "MOBILE_APP_CRASH"]
        }
      }
    }),
    prisma.auditLog.count({
      where: {
        action: "MOBILE_APP_CRASH"
      }
    }),
    prisma.auditLog.findMany({
      where: {
        action: {
          in: ["MOBILE_APP_ERROR", "MOBILE_APP_CRASH"]
        },
        tenantId: {
          not: null
        }
      },
      select: {
        tenantId: true
      },
      distinct: ["tenantId"]
    })
  ]);

  const pendingTenants = tenants.filter((tenant) => tenant.status === "PENDING").length;
  const suspendedTenants = tenants.filter((tenant) => tenant.status === "SUSPENDED").length;
  const basicTenants = tenants.filter((tenant) => tenant.plan === "BASIC").length;
  const professionalTenants = tenants.filter((tenant) => tenant.plan === "PROFESSIONAL").length;
  const totalEmployees = tenants.reduce((sum, tenant) => sum + tenant._count.employees, 0);
  const runtimeReport = getRuntimeIntegrationReport();
  const healthSnapshot = deriveSystemHealthSnapshot({
    databaseStatus: "connected",
    runtimeReport
  });
  const mobileDiagnostics = buildMobileDiagnosticsSummary({
    logs: recentMobileDiagnosticsLogs.map((log) => ({
      id: log.id,
      action: log.action,
      tenantId: log.tenantId,
      createdAt: log.createdAt,
      newData: log.newData as Record<string, unknown> | null,
      user: log.user
        ? {
            id: log.user.id,
            name: `${log.user.firstName ?? ""} ${log.user.lastName ?? ""}`.trim() || null,
            email: log.user.email
          }
        : null
    })),
    locale,
    totalEventsLast7Days: mobileEventsLast7Days,
    fatalEventsLast7Days: mobileFatalEventsLast7Days,
    affectedTenantsCount: mobileAffectedTenants.length,
    tenantNameById: Object.fromEntries(tenants.map((tenant) => [tenant.id, tenant.name]))
  });
  const formatter = new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
    dateStyle: "medium"
  });

  const metrics = [
    {
      title: isAr ? "إجمالي الشركات" : "Total tenants",
      value: tenants.length,
      description: isAr ? "كل العملاء النشطين وقيد الإعداد" : "All active and onboarding customers",
      icon: Building2
    },
    {
      title: isAr ? "الشركات النشطة" : "Active tenants",
      value: activeTenants,
      description: isAr
        ? "القواعد العاملة حاليًا على المنصة"
        : "Accounts currently operating on the platform",
      icon: CircleCheckBig
    },
    {
      title: isAr ? "إجمالي المستخدمين" : "Platform users",
      value: users,
      description: isAr ? "كل مسؤولي وموظفي العملاء" : "All customer admins and employee users",
      icon: Users
    },
    {
      title: isAr ? "تذاكر الدعم المفتوحة" : "Open support tickets",
      value: openTickets,
      description: isAr ? "تحتاج متابعة مركزية" : "Need centralized follow-up",
      icon: CircleAlert
    }
  ];

  const distribution = [
    { label: isAr ? "أساسي" : "Basic", value: basicTenants },
    { label: isAr ? "احترافي" : "Professional", value: professionalTenants },
    { label: isAr ? "مؤسسي" : "Enterprise", value: enterpriseTenants },
    { label: isAr ? "معلّق" : "Suspended", value: suspendedTenants }
  ];

  return (
    <div className="space-y-6">
      <section className="bg-card rounded-3xl border p-6 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">
          {isAr ? "رؤية تشغيلية على مستوى المنصة" : "Platform-wide operational insight"}
        </h1>
        <p className="text-muted-foreground mt-2 max-w-3xl text-sm leading-6">
          {isAr
            ? "هذه اللوحة تمنح السوبر أدمن متابعة موحدة للصحة التشغيلية، تنوع الباقات، أحجام العملاء، والضغط الحالي على الدعم."
            : "This page gives super admins a unified view of operational health, plan mix, tenant scale, and current support pressure."}
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.title} className="bg-card rounded-2xl border p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground text-sm">{metric.title}</p>
                <Icon className="text-primary size-5" />
              </div>
              <p className="mt-4 text-3xl font-semibold tracking-tight">
                {metric.value.toLocaleString()}
              </p>
              <p className="text-muted-foreground mt-2 text-sm leading-6">{metric.description}</p>
            </div>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="bg-card rounded-2xl border p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <CreditCard className="text-primary size-5" />
            <h2 className="font-semibold">
              {isAr ? "توزيع الباقات والحالات" : "Plan and status distribution"}
            </h2>
          </div>
          <div className="space-y-4">
            {distribution.map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>{item.label}</span>
                  <span className="font-medium">{item.value}</span>
                </div>
                <div className="bg-muted h-2 rounded-full">
                  <div
                    className={`bg-primary h-2 rounded-full ${progressWidthClass(
                      tenants.length === 0 ? 0 : (item.value / tenants.length) * 100
                    )}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-2xl border p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <ShieldCheck className="text-primary size-5" />
            <h2 className="font-semibold">
              {isAr ? "ملخص الجاهزية التشغيلية" : "Operational readiness summary"}
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <InsightStat
              label={isAr ? "شركات بانتظار التفعيل" : "Pending activation"}
              value={pendingTenants}
            />
            <InsightStat
              label={isAr ? "إجمالي الموظفين المسجلين" : "Tracked employees"}
              value={totalEmployees}
            />
            <InsightStat
              label={isAr ? "عملاء Enterprise" : "Enterprise customers"}
              value={enterpriseTenants}
            />
            <InsightStat
              label={isAr ? "ضغط الدعم الحالي" : "Current support load"}
              value={openTickets}
            />
          </div>
        </div>
      </section>

      <section className="bg-card rounded-2xl border p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-primary size-5" />
            <h2 className="font-semibold">
              {isAr ? "صحة التشغيل الحالية" : "Current system health"}
            </h2>
          </div>
          <span className={healthBadgeClassName(healthSnapshot.status)}>
            {formatHealthStatus(healthSnapshot.status, isAr)}
          </span>
        </div>

        <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="grid gap-4 sm:grid-cols-2">
            <InsightStat
              label={isAr ? "قاعدة البيانات" : "Database"}
              valueLabel={isAr ? "متصلة" : "Connected"}
            />
            <InsightStat
              label={isAr ? "الخدمات المهيأة" : "Configured services"}
              value={runtimeReport.summary.configured}
            />
            <InsightStat
              label={isAr ? "خدمات تحتاج استكمال" : "Partial services"}
              value={runtimeReport.summary.partial}
            />
            <InsightStat
              label={isAr ? "خدمات غير مهيأة" : "Missing services"}
              value={runtimeReport.summary.missing}
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {runtimeReport.items.map((item) => (
              <div key={item.id} className="bg-muted/20 rounded-2xl border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-muted-foreground mt-1 text-xs leading-5">
                      {item.features.join(isAr ? "، " : ", ")}
                    </p>
                  </div>
                  <span className={runtimeModeBadgeClassName(item.mode)}>
                    {formatRuntimeMode(item.mode, isAr)}
                  </span>
                </div>

                {item.missing.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.missing.map((entry) => (
                      <span
                        key={entry}
                        className="bg-background text-muted-foreground rounded-md px-2 py-1 font-mono text-[11px]">
                        {entry}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-card rounded-2xl border p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Smartphone className="text-primary size-5" />
            <h2 className="font-semibold">
              {isAr ? "رؤية أخطاء الموبايل" : "Mobile crash and error visibility"}
            </h2>
          </div>
          <span
            className={
              mobileDiagnostics.fatalEventsLast7Days > 0
                ? healthBadgeClassName("error")
                : healthBadgeClassName("ok")
            }>
            {isAr
              ? `${mobileDiagnostics.fatalEventsLast7Days} حرجة مسجلة`
              : `${mobileDiagnostics.fatalEventsLast7Days} fatal reported`}
          </span>
        </div>

        <div className="grid gap-4 lg:grid-cols-[0.7fr_1.3fr]">
          <div className="grid gap-4 sm:grid-cols-2">
            <InsightStat
              label={isAr ? "كل الأحداث المسجلة" : "All reported events"}
              value={mobileDiagnostics.totalEventsLast7Days}
            />
            <InsightStat
              label={isAr ? "الأخطاء الحرجة" : "Fatal crashes"}
              value={mobileDiagnostics.fatalEventsLast7Days}
            />
            <InsightStat
              label={isAr ? "شركات متأثرة" : "Affected tenants"}
              value={mobileDiagnostics.affectedTenantsCount}
            />
            <InsightStat
              label={isAr ? "أحدث إصدار ظاهر" : "Latest reported version"}
              valueLabel={mobileDiagnostics.latestAppVersion ?? (isAr ? "غير متاح" : "Unavailable")}
            />
          </div>

          <div className="space-y-3">
            {mobileDiagnostics.recentEvents.length === 0 ? (
              <div className="text-muted-foreground rounded-2xl border border-dashed p-6 text-sm">
                {isAr
                  ? "لا توجد تقارير أخطاء موبايل مسجلة بعد."
                  : "No mobile crash reports have been recorded yet."}
              </div>
            ) : (
              mobileDiagnostics.recentEvents.map((entry) => (
                <div key={entry.id} className="bg-muted/20 rounded-2xl border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={
                            entry.severityLabel === (isAr ? "انهيار" : "Crash")
                              ? runtimeModeBadgeClassName("missing")
                              : runtimeModeBadgeClassName("partial")
                          }>
                          {entry.severityLabel}
                        </span>
                        <span className="text-sm font-medium">{entry.message}</span>
                      </div>
                      <p className="text-muted-foreground text-xs">
                        {entry.sourceLabel}
                        {entry.route ? ` • ${entry.route}` : ""}
                        {entry.appVersion ? ` • v${entry.appVersion}` : ""}
                        {entry.deviceLabel ? ` • ${entry.deviceLabel}` : ""}
                      </p>
                    </div>
                    <span className="text-muted-foreground text-xs">
                      {new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
                        dateStyle: "medium",
                        timeStyle: "short"
                      }).format(new Date(entry.createdAt))}
                    </span>
                  </div>
                  <p className="text-muted-foreground mt-3 text-xs">
                    {isAr ? `الشركة: ${entry.tenantLabel}` : `Tenant: ${entry.tenantLabel}`}
                    {isAr ? ` • المستخدم: ${entry.actorLabel}` : ` • User: ${entry.actorLabel}`}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="bg-card rounded-2xl border p-5 shadow-sm">
        <h2 className="font-semibold">
          {isAr ? "أحدث الشركات المنضمة" : "Newest tenant accounts"}
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="text-muted-foreground border-b text-left">
                <th className="px-3 py-3 font-medium">{isAr ? "الشركة" : "Tenant"}</th>
                <th className="px-3 py-3 font-medium">{isAr ? "الحالة" : "Status"}</th>
                <th className="px-3 py-3 font-medium">{isAr ? "الباقة" : "Plan"}</th>
                <th className="px-3 py-3 font-medium">{isAr ? "المستخدمون" : "Users"}</th>
                <th className="px-3 py-3 font-medium">{isAr ? "الموظفون" : "Employees"}</th>
                <th className="px-3 py-3 font-medium">{isAr ? "تاريخ الإنشاء" : "Created"}</th>
              </tr>
            </thead>
            <tbody>
              {tenants.slice(0, 8).map((tenant) => (
                <tr key={tenant.id} className="border-b last:border-b-0">
                  <td className="px-3 py-3">
                    <div className="font-medium">{tenant.name}</div>
                    <div className="text-muted-foreground text-xs">/{tenant.slug}</div>
                  </td>
                  <td className="px-3 py-3">{tenant.status}</td>
                  <td className="px-3 py-3">{tenant.plan}</td>
                  <td className="px-3 py-3">{tenant._count.users}</td>
                  <td className="px-3 py-3">{tenant._count.employees}</td>
                  <td className="text-muted-foreground px-3 py-3">
                    {formatter.format(tenant.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function formatHealthStatus(status: "ok" | "degraded" | "error", isAr: boolean) {
  if (status === "ok") {
    return isAr ? "سليم" : "Healthy";
  }

  if (status === "degraded") {
    return isAr ? "متدهور" : "Degraded";
  }

  return isAr ? "خطأ" : "Error";
}

function formatRuntimeMode(mode: "configured" | "partial" | "missing", isAr: boolean) {
  if (mode === "configured") {
    return isAr ? "مهيأ" : "Configured";
  }

  if (mode === "partial") {
    return isAr ? "جزئي" : "Partial";
  }

  return isAr ? "غير مهيأ" : "Missing";
}

function healthBadgeClassName(status: "ok" | "degraded" | "error") {
  if (status === "ok") {
    return "rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400";
  }

  if (status === "degraded") {
    return "rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-400";
  }

  return "rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-medium text-red-700 dark:text-red-400";
}

function runtimeModeBadgeClassName(mode: "configured" | "partial" | "missing") {
  if (mode === "configured") {
    return "rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400";
  }

  if (mode === "partial") {
    return "rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-400";
  }

  return "rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-medium text-red-700 dark:text-red-400";
}

function InsightStat({
  label,
  value,
  valueLabel
}: {
  label: string;
  value?: number;
  valueLabel?: string;
}) {
  return (
    <div className="bg-muted/20 rounded-2xl border p-4">
      <p className="text-muted-foreground text-sm">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{valueLabel ?? value?.toLocaleString() ?? "0"}</p>
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
