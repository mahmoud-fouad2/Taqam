import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { cn } from "@/lib/utils";
import type { DashboardActivity } from "@/lib/dashboard";
import { getText } from "@/lib/i18n/text";
import type { AppLocale } from "@/lib/i18n/types";

function formatDateTime(locale: AppLocale, date: Date) {
  const localeForDates = locale === "ar" ? "ar-SA" : "en-US";
  return new Intl.DateTimeFormat(localeForDates, {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function initials(firstName?: string, lastName?: string) {
  const first = firstName?.trim()?.[0] ?? "";
  const last = lastName?.trim()?.[0] ?? "";
  const s = `${first}${last}`.trim();
  return s || "U";
}

const STATUS_LABELS: Record<string, { ar: string; en: string; className: string }> = {
  APPROVED: {
    ar: "موافق",
    en: "Approved",
    className:
      "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400"
  },
  PENDING: {
    ar: "قيد الانتظار",
    en: "Pending",
    className:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400"
  },
  REJECTED: {
    ar: "مرفوض",
    en: "Rejected",
    className:
      "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400"
  }
};

export function RecentActivities({
  locale,
  activities
}: {
  locale: AppLocale;
  activities: DashboardActivity[];
}) {
  const t = getText(locale);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.dashboardActivities.title}</CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <Empty className="border-0 p-0">
            <EmptyHeader>
              <EmptyTitle>{t.dashboardActivities.title}</EmptyTitle>
              <EmptyDescription>{t.dashboardActivities.empty}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                {activity.user ? (
                  <Avatar className="mt-0.5 h-8 w-8">
                    <AvatarImage src={activity.user.avatar ?? undefined} alt="" />
                    <AvatarFallback className="text-xs">
                      {initials(activity.user.firstName, activity.user.lastName)}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="bg-muted text-muted-foreground mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs">
                    {activity.type.slice(0, 1)}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="truncate text-sm font-medium">{activity.title}</div>
                    {activity.status && STATUS_LABELS[activity.status] ? (
                      <Badge
                        variant="outline"
                        className={cn(
                          "shrink-0 text-xs",
                          STATUS_LABELS[activity.status].className
                        )}>
                        {locale === "ar"
                          ? STATUS_LABELS[activity.status].ar
                          : STATUS_LABELS[activity.status].en}
                      </Badge>
                    ) : null}
                  </div>

                  <div className="text-muted-foreground line-clamp-2 text-sm">
                    {activity.description}
                  </div>

                  <div className="text-muted-foreground mt-1 text-xs">
                    {formatDateTime(locale, activity.createdAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
