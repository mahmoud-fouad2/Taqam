"use client";

import { useEffect, useState } from "react";
import { AlertCircle, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SmartAlert } from "@/lib/smart-alerts";

type AlertsResponse = { data: SmartAlert[]; count: number };

const SEVERITY_STYLES = {
  urgent: {
    container: "border-red-200 bg-red-50 dark:border-red-800/60 dark:bg-red-950/20",
    icon: "text-red-600 dark:text-red-400",
    Icon: AlertCircle
  },
  warning: {
    container: "border-amber-200 bg-amber-50 dark:border-amber-800/60 dark:bg-amber-950/20",
    icon: "text-amber-600 dark:text-amber-400",
    Icon: AlertTriangle
  },
  info: {
    container: "border-blue-200 bg-blue-50 dark:border-blue-800/60 dark:bg-blue-950/20",
    icon: "text-blue-600 dark:text-blue-400",
    Icon: Info
  }
} as const;

export function SmartAlertsWidget() {
  const [alerts, setAlerts] = useState<SmartAlert[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/smart-alerts")
      .then((r) => (r.ok ? (r.json() as Promise<AlertsResponse>) : Promise.reject()))
      .then((res) => setAlerts(res.data ?? []))
      .catch(() => setAlerts([]))
      .finally(() => setLoading(false));
  }, []);

  const visible = alerts.filter((a) => !dismissed.has(a.id));

  if (loading || visible.length === 0) return null;

  // Show max 5 alerts, prioritised by severity
  const shown = visible.slice(0, 5);

  return (
    <div className="space-y-2">
      {shown.map((alert) => {
        const style = SEVERITY_STYLES[alert.severity];
        const { Icon } = style;
        return (
          <div
            key={alert.id}
            className={cn(
              "flex items-start gap-3 rounded-xl border px-4 py-3 text-sm",
              style.container
            )}>
            <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", style.icon)} />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground leading-snug">{alert.titleAr}</p>
              <p className="text-muted-foreground text-xs mt-0.5">{alert.descriptionAr}</p>
            </div>
            <button
              type="button"
              onClick={() => setDismissed((prev) => new Set([...prev, alert.id]))}
              className="shrink-0 text-muted-foreground hover:text-foreground transition-colors mt-0.5">
              <X className="h-3.5 w-3.5" />
              <span className="sr-only">إخفاء</span>
            </button>
          </div>
        );
      })}
      {visible.length > 5 && (
        <p className="text-xs text-muted-foreground text-center">
          و {visible.length - 5} تنبيه آخر
        </p>
      )}
    </div>
  );
}
