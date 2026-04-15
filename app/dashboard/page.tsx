import { SectionCards } from "@/components/section-cards";
import { RecentActivities } from "@/components/recent-activities";
import { ChartAreaInteractiveClient } from "./chart-area-interactive-client";
import { DashboardSecondaryChartsClient } from "./dashboard-secondary-charts-client";
import { DashboardQuickActions } from "@/components/dashboard-quick-actions";
import { DashboardGreeting } from "@/components/dashboard-greeting";
import { SmartAlertsWidget } from "@/components/smart-alerts-widget";
import {
  DashboardGettingStarted,
  buildGettingStartedSteps
} from "@/components/dashboard-getting-started";

import { Metadata } from "next";
import { generateMeta } from "@/lib/utils";
import { getAppLocale } from "@/lib/i18n/locale";
import { getText } from "@/lib/i18n/text";
import { requireTenantAccess } from "@/lib/auth";
import { getDashboardActivities, getDashboardCharts, getDashboardStats } from "@/lib/dashboard";
import prisma from "@/lib/db";
import { getSmartAlerts } from "@/lib/smart-alerts";

const GETTING_STARTED_LOOKBACK_MS = 30 * 24 * 60 * 60 * 1000;

function wasSetupCompletedRecently(setupCompletedAt: Date | null | undefined) {
  if (!setupCompletedAt) {
    return false;
  }

  return Date.now() - setupCompletedAt.getTime() <= GETTING_STARTED_LOOKBACK_MS;
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getAppLocale();
  const t = getText(locale);
  return generateMeta({
    title: t.dashboard.metaTitle,
    description: t.dashboard.metaDescription
  });
}

export default async function Page() {
  const locale = await getAppLocale();
  const t = getText(locale);
  const user = await requireTenantAccess();

  const [stats, charts, activities, smartAlerts] = await Promise.all([
    getDashboardStats(user.tenantId).catch(() => ({
      totalEmployees: 0,
      activeEmployees: 0,
      departments: 0,
      todayAttendance: 0,
      attendanceRate: 0,
      pendingLeaves: 0,
      onLeaveToday: 0,
      newHiresThisMonth: 0,
      monthlyPayrollTotal: 0,
      activeJobOpenings: 0
    })),
    getDashboardCharts({ tenantId: user.tenantId, period: "week" }).catch(() => ({
      attendance: [],
      departments: [],
      leaves: []
    })),
    getDashboardActivities({ tenantId: user.tenantId, limit: 10 }).catch(() => []),
    getSmartAlerts(user.tenantId).catch(() => [])
  ]);

  const userName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "User";
  const workspaceLabel =
    locale === "ar"
      ? user.tenant?.nameAr || user.tenant?.name || null
      : user.tenant?.name || user.tenant?.nameAr || null;

  // Show getting-started only for tenant admins with recently completed setup
  let showGettingStarted = false;
  let gettingStartedSteps: ReturnType<typeof buildGettingStartedSteps> = [];
  if (user.tenantId && user.role === "TENANT_ADMIN") {
    const tenantMeta = await prisma.tenant.findUnique({
      where: { id: user.tenantId },
      select: { setupCompletedAt: true, name: true, nameAr: true }
    });
    const recentTenant =
      tenantMeta && wasSetupCompletedRecently(tenantMeta.setupCompletedAt) ? tenantMeta : null;

    if (recentTenant) {
      showGettingStarted = true;
      const [hasPayroll, hasAttendance] = await Promise.all([
        prisma.payrollPeriod
          .count({ where: { tenantId: user.tenantId } })
          .then((c: number) => c > 0),
        prisma.attendanceRecord
          .count({ where: { tenantId: user.tenantId } })
          .then((c: number) => c > 0)
      ]);
      gettingStartedSteps = buildGettingStartedSteps({
        tenantName:
          locale === "ar"
            ? recentTenant.nameAr ?? recentTenant.name
            : recentTenant.name ?? recentTenant.nameAr,
        hasEmployees: stats.totalEmployees > 0,
        hasPayroll,
        hasAttendance,
        hasDepartments: stats.departments > 0
      });
    }
  }

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <DashboardGreeting
          name={userName}
          locale={locale}
          headingLabel={t.dashboard.heading}
          workspaceLabel={workspaceLabel}
        />
      </div>
      {showGettingStarted && gettingStartedSteps.length > 0 && (
        <DashboardGettingStarted
          tenantName={workspaceLabel ?? (locale === "ar" ? "شركتك" : "Your workspace")}
          steps={gettingStartedSteps}
          locale={locale}
        />
      )}
      <DashboardQuickActions locale={locale} pendingLeaves={stats.pendingLeaves} role={user.role} />
      <SmartAlertsWidget locale={locale} initialAlerts={smartAlerts} />
      <SectionCards locale={locale} stats={stats} />
      <div className="grid grid-cols-1 gap-4 @5xl/main:grid-cols-2">
        <ChartAreaInteractiveClient locale={locale} initialAttendance={charts.attendance} />
        <RecentActivities locale={locale} activities={activities} />
      </div>
      <DashboardSecondaryChartsClient
        locale={locale}
        departments={charts.departments}
        leaves={charts.leaves}
      />
    </>
  );
}
