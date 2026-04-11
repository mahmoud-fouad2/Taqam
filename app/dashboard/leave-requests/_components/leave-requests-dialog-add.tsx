"use client";

import { IconSend } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

import { cn } from "@/lib/utils";
import { getLeaveTheme } from "@/lib/ui/leave-color";

import type { ApiLeaveType } from "./leave-requests-types";
import { useClientLocale } from "@/lib/i18n/use-client-locale";
import { getText } from "@/lib/i18n/text";

const t = getText("ar");

export function LeaveRequestsAddDialog({
  open,
  onOpenChange,
  employees,
  leaveTypes,
  formData,
  onFormDataChange,
  calculateDays,
  onSubmit
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: Array<{ id: string; firstName: string; lastName: string; employeeNumber: string }>;
  leaveTypes: ApiLeaveType[];
  formData: {
    employeeId: string;
    leaveTypeId: string;
    startDate: string;
    endDate: string;
    reason: string;
    isHalfDay: boolean;
    halfDayPeriod: "morning" | "afternoon";
    delegateEmployeeId: string;
    emergencyContact: string;
    emergencyPhone: string;
  };
  onFormDataChange: (next: {
    employeeId: string;
    leaveTypeId: string;
    startDate: string;
    endDate: string;
    reason: string;
    isHalfDay: boolean;
    halfDayPeriod: "morning" | "afternoon";
    delegateEmployeeId: string;
    emergencyContact: string;
    emergencyPhone: string;
  }) => void;
  calculateDays: (start: string, end: string, isHalfDay: boolean) => number;
  onSubmit: () => void;
}) {
  const locale = useClientLocale();
  const t = getText(locale);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t.leaveRequests.newRequest}</DialogTitle>
          <DialogDescription>{t.leaveRequests.createForEmployee}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{t.common.selectEmployee}</Label>
              <Select
                value={formData.employeeId}
                onValueChange={(value) => onFormDataChange({ ...formData, employeeId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder={t.common.selectEmployee} />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} - {emp.employeeNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t.leaveRequests.leaveTypeRequired}</Label>
              <Select
                value={formData.leaveTypeId}
                onValueChange={(value) => onFormDataChange({ ...formData, leaveTypeId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder={t.leaveRequests.selectLeaveType} />
                </SelectTrigger>
                <SelectContent>
                  {leaveTypes
                    .filter((t) => t.isActive)
                    .map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className={cn("h-3 w-3 rounded-full", getLeaveTheme(type.color).dot)}
                          />
                          {type.name}
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{t.leaveRequests.startDateRequired}</Label>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => onFormDataChange({ ...formData, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t.leaveRequests.endDateRequired}</Label>
              <Input
                type="date"
                value={formData.endDate}
                onChange={(e) => onFormDataChange({ ...formData, endDate: e.target.value })}
                min={formData.startDate}
              />
            </div>
          </div>

          {formData.startDate && formData.endDate && (
            <div className="bg-muted rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">{t.leaveRequests.daysCount}</span>
                <Badge variant="secondary">
                  {calculateDays(formData.startDate, formData.endDate, formData.isHalfDay)}{" "}
                  {formData.isHalfDay ? t.leaveRequests.halfDay : t.common.day}
                </Badge>
              </div>
            </div>
          )}

          <div className="flex items-center gap-4">
            <Switch
              checked={formData.isHalfDay}
              onCheckedChange={(checked) => onFormDataChange({ ...formData, isHalfDay: checked })}
            />
            <Label>{t.leaveRequests.halfDayOnly}</Label>

            {formData.isHalfDay && (
              <Select
                value={formData.halfDayPeriod}
                onValueChange={(value: "morning" | "afternoon") =>
                  onFormDataChange({ ...formData, halfDayPeriod: value })
                }>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">{t.leaveRequests.morningPeriod}</SelectItem>
                  <SelectItem value="afternoon">{t.leaveRequests.afternoonPeriod}</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label>{t.leaveRequests.leaveReasonRequired}</Label>
            <Textarea
              value={formData.reason}
              onChange={(e) => onFormDataChange({ ...formData, reason: e.target.value })}
              placeholder={t.leaveRequests.reasonPlaceholder}
              rows={3}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>{t.leaveRequests.delegateEmployee}</Label>
            <Select
              value={formData.delegateEmployeeId}
              onValueChange={(value) =>
                onFormDataChange({ ...formData, delegateEmployeeId: value })
              }>
              <SelectTrigger>
                <SelectValue placeholder={t.leaveRequests.selectDelegate} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t.leaveRequests.noDelegate}</SelectItem>
                {employees
                  .filter((e) => e.id !== formData.employeeId)
                  .map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t.common.cancel}
          </Button>
          <Button
            onClick={onSubmit}
            disabled={
              !formData.employeeId ||
              !formData.leaveTypeId ||
              !formData.startDate ||
              !formData.endDate ||
              !formData.reason
            }>
            <IconSend className="ms-2 h-4 w-4" />
            {t.leaveRequests.pSubmitRequest}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
