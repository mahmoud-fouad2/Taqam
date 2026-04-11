"use client";

import { Calendar, Edit, Plus } from "lucide-react";

import type { Dispatch, SetStateAction } from "react";

import type { LeaveTypeConfig } from "@/lib/types/settings";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useClientLocale } from "@/lib/i18n/use-client-locale";
import { getText } from "@/lib/i18n/text";

const t = getText("ar");

export function LeaveTypesSection({
  leaveTypes,
  setLeaveTypes,
  isLoading,
  error
}: {
  leaveTypes: LeaveTypeConfig[];
  setLeaveTypes: Dispatch<SetStateAction<LeaveTypeConfig[]>>;
  isLoading: boolean;
  error: string | null;
}) {
  const locale = useClientLocale();
  const t = getText(locale);
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {t.leaveSettings.title}
            </CardTitle>
            <CardDescription>{t.leaveSettings.pageDesc}</CardDescription>
          </div>
          <Button disabled>
            <Plus className="ms-2 h-4 w-4" />
            {t.leaveSettings.newType}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="text-muted-foreground py-10 text-center">{t.common.loading}</div>
        ) : (
          <div className="space-y-4">
            {leaveTypes.map((leaveType) => (
              <div
                key={leaveType.id}
                className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-4">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      leaveType.isActive ? "bg-green-100" : "bg-gray-100"
                    }`}>
                    <Calendar
                      className={`h-5 w-5 ${
                        leaveType.isActive ? "text-green-600" : "text-gray-600"
                      }`}
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold">{leaveType.name}</h4>
                    <div className="text-muted-foreground flex items-center gap-2 text-sm">
                      <span>
                        {leaveType.annualEntitlement} {t.leaveSettings.daysPerYear}
                      </span>
                      <span>•</span>
                      <span>
                        {leaveType.isPaid ? t.leaveSettings.paid : t.leaveSettings.unpaid}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant={leaveType.isActive ? "default" : "secondary"}>
                    {leaveType.isActive ? t.leaveSettings.active : t.leaveSettings.inactive}
                  </Badge>
                  <Switch
                    checked={leaveType.isActive}
                    onCheckedChange={async (checked) => {
                      const previous = leaveTypes;
                      setLeaveTypes(
                        leaveTypes.map((lt) =>
                          lt.id === leaveType.id ? { ...lt, isActive: checked } : lt
                        )
                      );

                      try {
                        const res = await fetch(
                          `/api/leave-types/${encodeURIComponent(leaveType.id)}`,
                          {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ isActive: checked })
                          }
                        );
                        const json = (await res.json()) as { data?: any; error?: string };
                        if (!res.ok) {
                          throw new Error(json.error || t.leaveTypes.statusUpdateFailed);
                        }
                      } catch (err) {
                        setLeaveTypes(previous);
                        toast.error(
                          err instanceof Error ? err.message : t.leaveTypes.statusUpdateFailed
                        );
                      }
                    }}
                  />
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
