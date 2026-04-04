import { IconPaperclip } from "@tabler/icons-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import type { LeaveRequestStatus } from "@/lib/types/leave";

import type { UiLeaveRequest } from "./leave-requests-types";

export function LeaveRequestsViewDialog({
  open,
  onOpenChange,
  request,
  employees,
  getStatusBadge,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: UiLeaveRequest | null;
  employees: Array<{ id: string; firstName: string; lastName: string }>;
  getStatusBadge: (status: LeaveRequestStatus) => React.ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-2xl">
        <DialogHeader>
          <DialogTitle>تفاصيل طلب الإجازة</DialogTitle>
        </DialogHeader>

        {request && (
          <div className="space-y-6 py-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg">{request.employeeName.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-semibold">{request.employeeName}</h3>
                <p className="text-muted-foreground">{request.departmentName}</p>
                <p className="text-sm text-muted-foreground">الرقم الوظيفي: {request.employeeNumber}</p>
              </div>
              <div className="ms-auto">{getStatusBadge(request.status)}</div>
            </div>

            <Separator />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">نوع الإجازة</p>
                <p className="font-medium">{request.leaveTypeName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">المدة</p>
                <p className="font-medium">
                  {request.totalDays} {request.totalDays === 1 ? "يوم" : "أيام"}
                  {request.isHalfDay && " (نصف يوم)"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">تاريخ البداية</p>
                <p className="font-medium">{new Date(request.startDate).toLocaleDateString("ar-SA")}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">تاريخ النهاية</p>
                <p className="font-medium">{new Date(request.endDate).toLocaleDateString("ar-SA")}</p>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">السبب</p>
              <p className="rounded-lg bg-muted p-3">{request.reason}</p>
            </div>

            {request.delegateEmployeeId && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">الموظف البديل</p>
                <p className="font-medium">
                  {(() => {
                    const emp = employees.find((e) => e.id === request.delegateEmployeeId);
                    return emp ? `${emp.firstName} ${emp.lastName}` : "غير معروف";
                  })()}
                </p>
              </div>
            )}

            {(request.approvedAt || request.rejectionReason) && (
              <div className="space-y-2">
                <p className="font-medium">معلومات الاعتماد</p>
                {request.approvedAt && (
                  <div className="rounded-lg border p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">تاريخ الإجراء</span>
                      <span>{new Date(request.approvedAt).toLocaleDateString("ar-SA")}</span>
                    </div>
                    {request.approvedById && (
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-muted-foreground">المعتمد</span>
                        <span className="font-mono text-xs">{request.approvedById}</span>
                      </div>
                    )}
                  </div>
                )}
                {request.rejectionReason && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {request.rejectionReason}
                  </div>
                )}
              </div>
            )}

            {request.attachmentUrl && (
              <div className="space-y-2">
                <p className="font-medium">المرفق</p>
                <a
                  href={request.attachmentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 hover:bg-muted"
                >
                  <IconPaperclip className="h-4 w-4" />
                  <span className="text-sm">فتح المرفق</span>
                </a>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إغلاق
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
