"use client";

import Link from "next/link";
import { UserPlus, CalendarOff, Clock, DollarSign, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

type Props = {
  locale: string;
  pendingLeaves: number;
  role: string;
  t: {
    pendingApprovalsBanner: (n: number) => string;
    reviewRequests: string;
    quickActions: string;
    addEmployee: string;
    requestLeave: string;
    recordAttendance: string;
    runPayroll: string;
  };
};

export function DashboardQuickActions({ locale, pendingLeaves, role, t }: Props) {
  const isManager = ["SUPER_ADMIN", "TENANT_ADMIN", "HR_MANAGER", "MANAGER"].includes(role);
  const isHrOrAdmin = ["SUPER_ADMIN", "TENANT_ADMIN", "HR_MANAGER"].includes(role);
  const prefix = locale === "en" ? "/en" : "";

  const actions = [
    ...(isHrOrAdmin
      ? [
          {
            href: `${prefix}/dashboard/employees/new`,
            label: t.addEmployee,
            icon: UserPlus,
          },
        ]
      : []),
    {
      href: `${prefix}/dashboard/my-requests`,
      label: t.requestLeave,
      icon: CalendarOff,
    },
    {
      href: `${prefix}/dashboard/attendance`,
      label: t.recordAttendance,
      icon: Clock,
    },
    ...(isHrOrAdmin
      ? [
          {
            href: `${prefix}/dashboard/payroll`,
            label: t.runPayroll,
            icon: DollarSign,
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-3 rounded-2xl border bg-card p-3 sm:p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          {t.quickActions}
        </p>
        {isManager && pendingLeaves > 0 ? (
          <Button asChild size="sm" variant="outline" className="h-8 rounded-lg">
            <Link href={`${prefix}/dashboard/requests`}>{t.reviewRequests}</Link>
          </Button>
        ) : null}
      </div>

      {isManager && pendingLeaves > 0 && (
        <Alert className="border-amber-200/70 bg-amber-50/70 dark:border-amber-800 dark:bg-amber-950/30">
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertDescription className="text-sm font-medium text-amber-900 dark:text-amber-200">
            {t.pendingApprovalsBanner(pendingLeaves)}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <Button
              key={action.href}
              asChild
              variant="outline"
              className="h-10 justify-between rounded-xl border-border/70 bg-background px-3 hover:bg-muted/60"
            >
              <Link href={action.href}>
                <span className="truncate text-sm font-medium">{action.label}</span>
                <Icon className="h-4 w-4 shrink-0 opacity-80" />
              </Link>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
