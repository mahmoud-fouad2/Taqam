"use client";

import Link from "next/link";
import { Users, Wallet, CalendarCheck2, Building2, X, Rocket } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type GettingStartedStep = {
  id: string;
  titleAr: string;
  descriptionAr: string;
  href: string;
  icon: React.ElementType;
  done: boolean;
};

type Props = {
  tenantName: string;
  steps: GettingStartedStep[];
};

export function DashboardGettingStarted({ tenantName, steps }: Props) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  const doneCount = steps.filter((s) => s.done).length;
  const percent = Math.round((doneCount / steps.length) * 100);
  const allDone = doneCount === steps.length;

  return (
    <div className="bg-card border-border/60 relative overflow-hidden rounded-2xl border p-5 shadow-sm">
      {/* dismiss */}
      <button
        onClick={() => setDismissed(true)}
        className="text-muted-foreground hover:text-foreground absolute top-4 left-4 rounded-lg p-1 transition-colors">
        <X className="h-4 w-4" />
        <span className="sr-only">إغلاق</span>
      </button>

      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
          <Rocket className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-bold">
            {allDone ? `أحسنت! مساحة العمل مكتملة ✓` : "خطوات البدء السريع"}
          </h2>
          <p className="text-muted-foreground mt-0.5 text-xs">
            {allDone
              ? `${tenantName} جاهزة بالكامل لاستخدام طاقم`
              : `${doneCount} من ${steps.length} خطوات مكتملة`}
          </p>
        </div>
      </div>

      {/* Progress */}
      {!allDone && (
        <div className="mb-5">
          <Progress value={percent} className="h-1.5" />
        </div>
      )}

      {/* Steps */}
      <div className="grid gap-2 sm:grid-cols-2">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <Link
              key={step.id}
              href={step.done ? "#" : step.href}
              className={cn(
                "flex items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-all",
                step.done
                  ? "pointer-events-none border-emerald-200 bg-emerald-50/50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-400"
                  : "border-border hover:border-primary/40 hover:bg-muted/30"
              )}>
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  step.done ? "text-emerald-500" : "text-muted-foreground"
                )}
              />
              <div className="min-w-0 flex-1">
                <p className={cn("font-medium", step.done && "line-through opacity-60")}>
                  {step.titleAr}
                </p>
                {!step.done && (
                  <p className="text-muted-foreground mt-0.5 truncate text-xs">
                    {step.descriptionAr}
                  </p>
                )}
              </div>
              {step.done && (
                <span className="shrink-0 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  ✓
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {allDone && (
        <div className="mt-4 text-center">
          <Button variant="outline" size="sm" onClick={() => setDismissed(true)}>
            إخفاء هذه البطاقة
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Static step definitions (evaluated server-side and passed as props) ───────

export type GettingStartedData = {
  tenantName: string;
  hasEmployees: boolean;
  hasPayroll: boolean;
  hasAttendance: boolean;
  hasDepartments: boolean;
};

export function buildGettingStartedSteps(data: GettingStartedData): GettingStartedStep[] {
  return [
    {
      id: "company-setup",
      titleAr: "إعداد الشركة",
      descriptionAr: "أكمل بيانات ملف الشركة الأساسية",
      href: "/dashboard/setup",
      icon: Building2,
      done: true // always true here since we only show this after setup complete
    },
    {
      id: "add-employees",
      titleAr: "إضافة الموظفين",
      descriptionAr: "أضف أعضاء فريقك إلى النظام",
      href: "/dashboard/employees",
      icon: Users,
      done: data.hasEmployees
    },
    {
      id: "departments",
      titleAr: "الأقسام والهياكل",
      descriptionAr: "تنظيم هيكل الشركة والأقسام",
      href: "/dashboard/settings",
      icon: Building2,
      done: data.hasDepartments
    },
    {
      id: "attendance",
      titleAr: "تسجيل الحضور",
      descriptionAr: "ابدأ متابعة حضور وانصراف الفريق",
      href: "/dashboard/attendance",
      icon: CalendarCheck2,
      done: data.hasAttendance
    },
    {
      id: "payroll",
      titleAr: "إعداد الرواتب",
      descriptionAr: "ضبط إعدادات الرواتب والـ WPS",
      href: "/dashboard/settings",
      icon: Wallet,
      done: data.hasPayroll
    }
  ];
}
