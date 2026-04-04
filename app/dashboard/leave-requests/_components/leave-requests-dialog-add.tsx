import { IconSend } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

import { cn } from "@/lib/utils";
import { getLeaveTheme } from "@/lib/ui/leave-color";

import type { ApiLeaveType } from "./leave-requests-types";

export function LeaveRequestsAddDialog({
  open,
  onOpenChange,
  employees,
  leaveTypes,
  formData,
  onFormDataChange,
  calculateDays,
  onSubmit,
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-2xl">
        <DialogHeader>
          <DialogTitle>طلب إجازة جديد</DialogTitle>
          <DialogDescription>إنشاء طلب إجازة للموظف</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>الموظف *</Label>
              <Select
                value={formData.employeeId}
                onValueChange={(value) => onFormDataChange({ ...formData, employeeId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الموظف" />
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
              <Label>نوع الإجازة *</Label>
              <Select
                value={formData.leaveTypeId}
                onValueChange={(value) => onFormDataChange({ ...formData, leaveTypeId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع الإجازة" />
                </SelectTrigger>
                <SelectContent>
                  {leaveTypes
                    .filter((t) => t.isActive)
                    .map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        <div className="flex items-center gap-2">
                          <div className={cn("h-3 w-3 rounded-full", getLeaveTheme(type.color).dot)} />
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
              <Label>تاريخ البداية *</Label>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => onFormDataChange({ ...formData, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>تاريخ النهاية *</Label>
              <Input
                type="date"
                value={formData.endDate}
                onChange={(e) => onFormDataChange({ ...formData, endDate: e.target.value })}
                min={formData.startDate}
              />
            </div>
          </div>

          {formData.startDate && formData.endDate && (
            <div className="rounded-lg bg-muted p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">عدد الأيام:</span>
                <Badge variant="secondary">
                  {calculateDays(formData.startDate, formData.endDate, formData.isHalfDay)}{" "}
                  {formData.isHalfDay ? "نصف يوم" : "يوم"}
                </Badge>
              </div>
            </div>
          )}

          <div className="flex items-center gap-4">
            <Switch
              checked={formData.isHalfDay}
              onCheckedChange={(checked) => onFormDataChange({ ...formData, isHalfDay: checked })}
            />
            <Label>نصف يوم فقط</Label>

            {formData.isHalfDay && (
              <Select
                value={formData.halfDayPeriod}
                onValueChange={(value: "morning" | "afternoon") =>
                  onFormDataChange({ ...formData, halfDayPeriod: value })
                }
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">الفترة الصباحية</SelectItem>
                  <SelectItem value="afternoon">الفترة المسائية</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label>سبب الإجازة *</Label>
            <Textarea
              value={formData.reason}
              onChange={(e) => onFormDataChange({ ...formData, reason: e.target.value })}
              placeholder="أدخل سبب الإجازة..."
              rows={3}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>الموظف البديل (اختياري)</Label>
            <Select
              value={formData.delegateEmployeeId}
              onValueChange={(value) => onFormDataChange({ ...formData, delegateEmployeeId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر الموظف البديل" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">بدون بديل</SelectItem>
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
            إلغاء
          </Button>
          <Button
            onClick={onSubmit}
            disabled={
              !formData.employeeId ||
              !formData.leaveTypeId ||
              !formData.startDate ||
              !formData.endDate ||
              !formData.reason
            }
          >
            <IconSend className="ms-2 h-4 w-4" />
            إرسال الطلب
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
