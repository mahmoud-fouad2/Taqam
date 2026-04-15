"use client";

import { useEffect, useState } from "react";
import { AlertCircle, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SmartAlert } from "@/lib/smart-alerts";
import type { AppLocale } from "@/lib/i18n/types";

type AlertsResponse = { data: SmartAlert[]; count: number };

const DISMISS_KEY_PREFIX = "taqam:dashboard:smart-alerts";

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

function getDismissStorageKey() {
  const dateKey = new Date().toISOString().slice(0, 10);
  return `${DISMISS_KEY_PREFIX}:${dateKey}`;
}

function readDismissedIds(storageKey: string) {
  if (typeof window === "undefined") {
    return [] as string[];
  }

  try {
    const stored = window.sessionStorage.getItem(storageKey);
    return stored ? ((JSON.parse(stored) as string[]) ?? []) : [];
  } catch {
    return [] as string[];
  }
}

export function SmartAlertsWidget({
  locale,
  initialAlerts
}: {
  locale: AppLocale;
  initialAlerts: SmartAlert[];
}) {
  const [alerts, setAlerts] = useState<SmartAlert[]>(initialAlerts);
  const [dismissedRuntime, setDismissedRuntime] = useState<Record<string, string[]>>({});
  const storageKey = getDismissStorageKey();
  const dismissedIds = new Set([
    ...readDismissedIds(storageKey),
    ...(dismissedRuntime[storageKey] ?? [])
  ]);

  useEffect(() => {
    let active = true;

    fetch("/api/smart-alerts")
      .then((r) => (r.ok ? (r.json() as Promise<AlertsResponse>) : Promise.reject()))
      .then((res) => {
        if (active) {
          setAlerts(res.data ?? []);
        }
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);

  const dismissAlert = (id: string) => {
    setDismissedRuntime((prev) => {
      const nextIds = Array.from(new Set([...(prev[storageKey] ?? []), id]));

      try {
        window.sessionStorage.setItem(storageKey, JSON.stringify(nextIds));
      } catch {
        // Ignore storage issues and keep runtime dismiss state only.
      }

      return {
        ...prev,
        [storageKey]: nextIds
      };
    });
  };

  const visible = alerts.filter((a) => !dismissedIds.has(a.id));

  if (visible.length === 0) return null;

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
            <div className="min-w-0 flex-1">
              <p className="text-foreground leading-snug font-medium">
                {locale === "ar" ? alert.titleAr : alert.titleEn}
              </p>
              <p className="text-muted-foreground mt-0.5 text-xs">
                {locale === "ar" ? alert.descriptionAr : alert.descriptionEn}
              </p>
            </div>
            <button
              type="button"
              onClick={() => dismissAlert(alert.id)}
              className="text-muted-foreground hover:text-foreground mt-0.5 shrink-0 transition-colors">
              <X className="h-3.5 w-3.5" />
              <span className="sr-only">{locale === "ar" ? "إخفاء" : "Dismiss"}</span>
            </button>
          </div>
        );
      })}
      {visible.length > 5 && (
        <p className="text-muted-foreground text-center text-xs">
          {locale === "ar"
            ? `و ${visible.length - 5} تنبيه آخر`
            : `${visible.length - 5} more alert${visible.length - 5 === 1 ? "" : "s"}`}
        </p>
      )}
    </div>
  );
}
