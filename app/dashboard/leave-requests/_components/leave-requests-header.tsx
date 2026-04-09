"use client";

import { IconPlus } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { useClientLocale } from "@/lib/i18n/use-client-locale";
import { getText } from "@/lib/i18n/text";

const t = getText("ar");

export function LeaveRequestsHeader({ onAdd }: { onAdd: () => void }) {
  const locale = useClientLocale();
  const t = getText(locale);
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold">{t.helpCenter.leaveRequests}</h2>
        <p className="text-muted-foreground">{t.leaveRequests.pManageAndTrackLeaveRequests}</p>
      </div>
      <Button onClick={onAdd}>
        <IconPlus className="ms-2 h-4 w-4" />{t.leaveRequests.newRequest}</Button>
    </div>
  );
}
