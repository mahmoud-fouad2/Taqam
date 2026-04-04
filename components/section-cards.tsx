import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Users, Clock, CalendarOff, UserPlus } from "lucide-react";
import type { AppLocale } from "@/lib/i18n/types";
import { getText } from "@/lib/i18n/text";
import type { DashboardStats } from "@/lib/dashboard";

export function SectionCards({
  locale,
  stats,
}: {
  locale: AppLocale;
  stats: DashboardStats;
}) {
  const t = getText(locale);
  const num = (n: number) => n.toLocaleString(locale === "ar" ? "ar-SA" : "en-US");

  return (
    <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {/* Total Employees */}
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-50 to-blue-100/50 shadow-sm dark:from-blue-950/40 dark:to-blue-900/20">
        <div className="absolute end-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/15">
          <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        <CardHeader className="pb-2">
          <CardDescription className="text-blue-700/70 dark:text-blue-300/70 text-xs font-medium uppercase tracking-wide">
            {t.sectionCards.totalEmployees}
          </CardDescription>
          <CardTitle className="text-3xl font-bold tabular-nums text-blue-900 dark:text-blue-100">
            {num(stats.totalEmployees)}
          </CardTitle>
          <div className="flex items-center gap-1.5 text-xs text-blue-600/80 dark:text-blue-400/80">
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-green-500" />
            {t.sectionCards.activeEmployees}: <span className="font-semibold">{num(stats.activeEmployees)}</span>
          </div>
        </CardHeader>
      </Card>

      {/* Attendance Rate */}
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-green-50 to-green-100/50 shadow-sm dark:from-green-950/40 dark:to-green-900/20">
        <div className="absolute end-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-green-500/15">
          <Clock className="h-5 w-5 text-green-600 dark:text-green-400" />
        </div>
        <CardHeader className="pb-2">
          <CardDescription className="text-green-700/70 dark:text-green-300/70 text-xs font-medium uppercase tracking-wide">
            {t.sectionCards.attendanceRate}
          </CardDescription>
          <CardTitle className="text-3xl font-bold tabular-nums text-green-900 dark:text-green-100">
            {stats.attendanceRate}%
          </CardTitle>
          <div className="flex items-center gap-1.5 text-xs text-green-600/80 dark:text-green-400/80">
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-green-500" />
            {t.sectionCards.todayAttendance}: <span className="font-semibold">{num(stats.todayAttendance)}</span>
          </div>
        </CardHeader>
      </Card>

      {/* Pending Leaves */}
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-amber-50 to-amber-100/50 shadow-sm dark:from-amber-950/40 dark:to-amber-900/20">
        <div className="absolute end-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/15">
          <CalendarOff className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        </div>
        <CardHeader className="pb-2">
          <CardDescription className="text-amber-700/70 dark:text-amber-300/70 text-xs font-medium uppercase tracking-wide">
            {t.sectionCards.pendingLeaves}
          </CardDescription>
          <CardTitle className="text-3xl font-bold tabular-nums text-amber-900 dark:text-amber-100">
            {num(stats.pendingLeaves)}
          </CardTitle>
          <div className="flex items-center gap-1.5 text-xs text-amber-600/80 dark:text-amber-400/80">
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-amber-500" />
            {t.sectionCards.onLeaveToday}: <span className="font-semibold">{num(stats.onLeaveToday)}</span>
          </div>
        </CardHeader>
      </Card>

      {/* New Hires */}
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-purple-50 to-purple-100/50 shadow-sm dark:from-purple-950/40 dark:to-purple-900/20">
        <div className="absolute end-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/15">
          <UserPlus className="h-5 w-5 text-purple-600 dark:text-purple-400" />
        </div>
        <CardHeader className="pb-2">
          <CardDescription className="text-purple-700/70 dark:text-purple-300/70 text-xs font-medium uppercase tracking-wide">
            {t.sectionCards.newHiresThisMonth}
          </CardDescription>
          <CardTitle className="text-3xl font-bold tabular-nums text-purple-900 dark:text-purple-100">
            {num(stats.newHiresThisMonth)}
          </CardTitle>
          <div className="flex items-center gap-1.5 text-xs text-purple-600/80 dark:text-purple-400/80">
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-purple-500" />
            {t.sectionCards.departments}: <span className="font-semibold">{num(stats.departments)}</span>
          </div>
        </CardHeader>
      </Card>
    </div>
  )
}
