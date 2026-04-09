"use client";

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
import { useClientLocale } from "@/lib/i18n/use-client-locale";
import { getText } from "@/lib/i18n/text";

const t = getText("ar");

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
  const locale = useClientLocale();
  const t = getText(locale);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t.leaveRequests.pLeaveRequestDetails}</DialogTitle>
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
                <p className="text-sm text-muted-foreground">{t.leaveRequests.pEmployeeNumber} {request.employeeNumber}</p>
              </div>
              <div className="ms-auto">{getStatusBadge(request.status)}</div>
            </div>

            <Separator />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t.common.type}</p>
                <p className="font-medium">{request.leaveTypeName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t.trainingCourses.durationHours}</p>
                <p className="font-medium">
                  {request.totalDays} {request.totalDays === 1 ? t.common.day : t.common.days}
                  {request.isHalfDay && " {t.leaveRequests.pHalfDay}"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t.common.startDate}</p>
                <p className="font-medium">{new Date(request.startDate).toLocaleDateString("ar-SA")}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t.leaveRequests.pEndDate}</p>
                <p className="font-medium">{new Date(request.endDate).toLocaleDateString("ar-SA")}</p>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{t.common.reason}</p>
              <p className="rounded-lg bg-muted p-3">{request.reason}</p>
            </div>

            {request.delegateEmployeeId && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t.leaveRequests.pSubstituteEmployee}</p>
                <p className="font-medium">
                  {(() => {
                    const emp = employees.find((e) => e.id === request.delegateEmployeeId);
                    return emp ? `${emp.firstName} ${emp.lastName}` : t.common.unknown;
                  })()}
                </p>
              </div>
            )}

            {(request.approvedAt || request.rejectionReason) && (
              <div className="space-y-2">
                <p className="font-medium">{t.leaveRequests.pApprovalInformation}</p>
                {request.approvedAt && (
                  <div className="rounded-lg border p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{t.leaveRequests.pActionDate}</span>
                      <span>{new Date(request.approvedAt).toLocaleDateString("ar-SA")}</span>
                    </div>
                    {request.approvedById && (
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-muted-foreground">{t.leaveRequests.pApprover}</span>
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
                <p className="font-medium">{t.leaveRequests.pAttachment}</p>
                <a
                  href={request.attachmentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 hover:bg-muted"
                >
                  <IconPaperclip className="h-4 w-4" />
                  <span className="text-sm">{t.leaveRequests.pOpenAttachment}</span>
                </a>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t.common.close}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
