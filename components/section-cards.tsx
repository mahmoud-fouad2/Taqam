import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Clock, CalendarOff, UserPlus, Banknote, Briefcase } from "lucide-react";
import type { AppLocale } from "@/lib/i18n/types";
import { getText } from "@/lib/i18n/text";
import type { DashboardStats } from "@/lib/dashboard";

export function SectionCards({ locale, stats }: { locale: AppLocale; stats: DashboardStats }) {
  const t = getText(locale);
  const num = (n: number) => n.toLocaleString(locale === "ar" ? "ar-SA" : "en-US");

  const currency = (n: number) =>
    n === 0
      ? "—"
      : n.toLocaleString(locale === "ar" ? "ar-SA" : "en-US", {
          style: "currency",
          currency: "SAR",
          maximumFractionDigits: 0
        });

  const cards = [
    {
      title: t.sectionCards.totalEmployees,
      value: num(stats.totalEmployees),
      subtitle: `${t.sectionCards.activeEmployees}: ${num(stats.activeEmployees)}`,
      icon: Users,
      iconClassName: "bg-sky-500/10 text-sky-600 dark:text-sky-400"
    },
    {
      title: t.sectionCards.attendanceRate,
      value: `${stats.attendanceRate}%`,
      subtitle: `${t.sectionCards.todayAttendance}: ${num(stats.todayAttendance)}`,
      icon: Clock,
      iconClassName: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
    },
    {
      title: t.sectionCards.pendingLeaves,
      value: num(stats.pendingLeaves),
      subtitle: `${t.sectionCards.onLeaveToday}: ${num(stats.onLeaveToday)}`,
      icon: CalendarOff,
      iconClassName: "bg-amber-500/10 text-amber-600 dark:text-amber-400"
    },
    {
      title: t.sectionCards.newHiresThisMonth,
      value: num(stats.newHiresThisMonth),
      subtitle: `${t.sectionCards.departments}: ${num(stats.departments)}`,
      icon: UserPlus,
      iconClassName: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
    },
    {
      title: t.sectionCards.monthlyPayrollTotal,
      value: currency(stats.monthlyPayrollTotal),
      subtitle: t.sectionCards.lastPayrollPeriod,
      icon: Banknote,
      iconClassName: "bg-violet-500/10 text-violet-600 dark:text-violet-400"
    },
    {
      title: t.sectionCards.activeJobOpenings,
      value: num(stats.activeJobOpenings),
      subtitle: `${num(stats.activeJobOpenings)} ${t.sectionCards.openPositions}`,
      icon: Briefcase,
      iconClassName: "bg-rose-500/10 text-rose-600 dark:text-rose-400"
    }
  ];

  return (
    <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <Card key={card.title} className="border-border/70 bg-card shadow-sm">
            <CardHeader className="space-y-3 pb-4">
              <div className="flex items-center justify-between gap-3">
                <CardDescription className="text-muted-foreground text-xs font-semibold tracking-[0.08em] uppercase">
                  {card.title}
                </CardDescription>
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-lg ${card.iconClassName}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <CardTitle className="text-3xl font-semibold tabular-nums">{card.value}</CardTitle>
              <p className="text-muted-foreground text-xs font-medium">{card.subtitle}</p>
            </CardHeader>
          </Card>
        );
      })}
    </div>
  );
}
