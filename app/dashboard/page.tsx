import { SectionCards } from "@/components/section-cards";
import { TenantControls } from "@/components/tenant-controls";
import { TenantBadge } from "@/components/tenant-badge";
import { RecentActivities } from "@/components/recent-activities";
import { ChartAreaInteractiveClient } from "./chart-area-interactive-client";
import { DashboardQuickActions } from "@/components/dashboard-quick-actions";
import { DashboardGreeting } from "@/components/dashboard-greeting";

import { Metadata } from "next";
import { generateMeta } from "@/lib/utils";
import { getAppLocale } from "@/lib/i18n/locale";
import { getText } from "@/lib/i18n/text";
import { requireTenantAccess } from "@/lib/auth";
import { getDashboardActivities, getDashboardCharts, getDashboardStats } from "@/lib/dashboard";

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

  const [stats, charts, activities] = await Promise.all([
    getDashboardStats(user.tenantId).catch(() => ({
      totalEmployees: 0,
      activeEmployees: 0,
      departments: 0,
      todayAttendance: 0,
      attendanceRate: 0,
      pendingLeaves: 0,
      onLeaveToday: 0,
      newHiresThisMonth: 0
    })),
    getDashboardCharts({ tenantId: user.tenantId, period: "week" }).catch(() => ({
      attendance: [],
      departments: [],
      leaves: []
    })),
    getDashboardActivities({ tenantId: user.tenantId, limit: 10 }).catch(() => [])
  ]);

  const userName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "User";

  return (
    <>
      <div className="flex items-center justify-between">
        <DashboardGreeting name={userName} locale={locale} headingLabel={t.dashboard.heading} />
        <div className="flex items-center gap-3">
          <TenantBadge />
          <TenantControls />
        </div>
      </div>
      <DashboardQuickActions
        locale={locale}
        pendingLeaves={stats.pendingLeaves}
        role={user.role}
      />
      <SectionCards locale={locale} stats={stats} />
      <div className="grid grid-cols-1 gap-4 @5xl/main:grid-cols-2">
        <ChartAreaInteractiveClient locale={locale} initialAttendance={charts.attendance} />
        <RecentActivities locale={locale} activities={activities} />
      </div>
    </>
  );
}
