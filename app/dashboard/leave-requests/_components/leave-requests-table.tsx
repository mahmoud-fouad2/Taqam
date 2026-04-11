"use client";

import { useState } from "react";
import { IconCheck, IconCheckbox, IconEye, IconTrash, IconX } from "@tabler/icons-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import type { LeaveRequestStatus } from "@/lib/types/leave";
import { formatDateRange } from "@/lib/types/leave";

import type { UiLeaveRequest } from "./leave-requests-types";
import { useClientLocale } from "@/lib/i18n/use-client-locale";
import { getText } from "@/lib/i18n/text";

const t = getText("ar");

export function LeaveRequestsTable({
  requests,
  getLeaveTypeCode,
  getStatusBadge,
  onView,
  onApprove,
  onReject,
  onCancel,
  onBulkApprove,
  onBulkReject
}: {
  requests: UiLeaveRequest[];
  getLeaveTypeCode: (leaveTypeId: string) => string;
  getStatusBadge: (status: LeaveRequestStatus) => React.ReactNode;
  onView: (request: UiLeaveRequest) => void;
  onApprove: (request: UiLeaveRequest) => void;
  onReject: (request: UiLeaveRequest) => void;
  onCancel: (requestId: string) => void;
  onBulkApprove?: (ids: string[]) => void;
  onBulkReject?: (ids: string[]) => void;
}) {
  const locale = useClientLocale();
  const t = getText(locale);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const allPendingSelected =
    pendingRequests.length > 0 && pendingRequests.every((r) => selectedIds.has(r.id));

  const toggleAll = () => {
    if (allPendingSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingRequests.map((r) => r.id)));
    }
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkApprove = () => {
    if (onBulkApprove && selectedIds.size > 0) {
      onBulkApprove(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  const handleBulkReject = () => {
    if (onBulkReject && selectedIds.size > 0) {
      onBulkReject(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  return (
    <div className="space-y-2">
      {selectedIds.size > 0 && (onBulkApprove || onBulkReject) && (
        <div className="bg-muted/50 flex items-center gap-2 rounded-lg border px-4 py-2">
          <span className="text-sm font-medium">
            {t.leaveRequests.pSelected} {selectedIds.size} {t.leaveRequests.pRequest}
          </span>
          <div className="ms-auto flex gap-2">
            {onBulkApprove && (
              <Button size="sm" variant="default" className="gap-1.5" onClick={handleBulkApprove}>
                <IconCheck className="h-3.5 w-3.5" />
                {t.leaveRequests.pBulkApprove}
              </Button>
            )}
            {onBulkReject && (
              <Button
                size="sm"
                variant="destructive"
                className="gap-1.5"
                onClick={handleBulkReject}>
                <IconX className="h-3.5 w-3.5" />
                {t.leaveRequests.pBulkRejection}
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>
              {t.leaveRequests.pCancelSelection}
            </Button>
          </div>
        </div>
      )}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {pendingRequests.length > 0 && (
                <TableHead className="w-[40px]">
                  <Checkbox
                    checked={allPendingSelected}
                    onCheckedChange={toggleAll}
                    aria-label={t.leaveRequests.selectAllPending}
                  />
                </TableHead>
              )}
              <TableHead>{t.common.employee}</TableHead>
              <TableHead>{t.common.type}</TableHead>
              <TableHead>{t.leaveRequests.period}</TableHead>
              <TableHead>{t.trainingCourses.durationHours}</TableHead>
              <TableHead>{t.common.status}</TableHead>
              <TableHead className="w-[120px]">{t.common.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center">
                  <p className="text-muted-foreground">{t.requests.noRequests}</p>
                </TableCell>
              </TableRow>
            ) : (
              requests.map((request) => (
                <TableRow key={request.id} data-selected={selectedIds.has(request.id)}>
                  <TableCell className="w-[40px]">
                    {request.status === "pending" ? (
                      <Checkbox
                        checked={selectedIds.has(request.id)}
                        onCheckedChange={() => toggleOne(request.id)}
                        aria-label={`${t.leaveRequests.selectRequest} ${request.employeeName}`}
                      />
                    ) : (
                      <span />
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback>{request.employeeName.slice(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{request.employeeName}</div>
                        <div className="text-muted-foreground text-sm">
                          {request.departmentName}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{request.leaveTypeName}</div>
                      <div className="text-muted-foreground text-sm">
                        {getLeaveTypeCode(request.leaveTypeId)
                          ? `${t.leaveRequests.pCode} ${getLeaveTypeCode(request.leaveTypeId)}`
                          : ""}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {formatDateRange(request.startDate, request.endDate)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {request.totalDays} {request.totalDays === 1 ? t.common.day : t.common.days}
                      {request.isHalfDay && ` ${t.leaveRequests.pHalfDay}`}
                    </Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          {t.leaveRequests.pActions}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onView(request)}>
                          <IconEye className="ms-2 h-4 w-4" />
                          {t.common.viewDetails}
                        </DropdownMenuItem>
                        {request.status === "pending" && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-green-600"
                              onClick={() => onApprove(request)}>
                              <IconCheck className="ms-2 h-4 w-4" />
                              {t.common.accept}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => onReject(request)}>
                              <IconX className="ms-2 h-4 w-4" />
                              {t.common.reject}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onCancel(request.id)}>
                              <IconTrash className="ms-2 h-4 w-4" />
                              {t.myRequests.cancelRequest}
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
