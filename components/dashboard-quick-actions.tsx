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

  return (
    <div className="flex flex-col gap-3">
      {isManager && pendingLeaves > 0 && (
        <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertDescription className="flex items-center justify-between gap-4">
            <span className="text-amber-800 dark:text-amber-300 text-sm font-medium">
              {t.pendingApprovalsBanner(pendingLeaves)}
            </span>
            <Button asChild size="sm" variant="outline" className="shrink-0 border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/50">
              <Link href={`${prefix}/dashboard/requests`}>{t.reviewRequests}</Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground me-1">{t.quickActions}</span>
        {isHrOrAdmin && (
          <Button asChild size="sm" variant="outline" className="h-8 gap-1.5 rounded-full border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-300 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-400 dark:hover:bg-blue-900/50">
            <Link href={`${prefix}/dashboard/employees/new`}>
              <UserPlus className="h-3.5 w-3.5" />
              {t.addEmployee}
            </Link>
          </Button>
        )}
        <Button asChild size="sm" variant="outline" className="h-8 gap-1.5 rounded-full border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:border-amber-300 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400 dark:hover:bg-amber-900/50">
          <Link href={`${prefix}/dashboard/my-requests`}>
            <CalendarOff className="h-3.5 w-3.5" />
            {t.requestLeave}
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline" className="h-8 gap-1.5 rounded-full border-green-200 bg-green-50 text-green-700 hover:bg-green-100 hover:border-green-300 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400 dark:hover:bg-green-900/50">
          <Link href={`${prefix}/dashboard/attendance`}>
            <Clock className="h-3.5 w-3.5" />
            {t.recordAttendance}
          </Link>
        </Button>
        {isHrOrAdmin && (
          <Button asChild size="sm" variant="outline" className="h-8 gap-1.5 rounded-full border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 hover:border-purple-300 dark:border-purple-800 dark:bg-purple-950/30 dark:text-purple-400 dark:hover:bg-purple-900/50">
            <Link href={`${prefix}/dashboard/payroll`}>
              <DollarSign className="h-3.5 w-3.5" />
              {t.runPayroll}
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
