"use client";

import { IconCheck } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useClientLocale } from "@/lib/i18n/use-client-locale";
import { getText } from "@/lib/i18n/text";

const t = getText("ar");

export function LeaveRequestsApproveDialog({
  open,
  onOpenChange,
  approvalComment,
  onApprovalCommentChange,
  onApprove,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  approvalComment: string;
  onApprovalCommentChange: (value: string) => void;
  onApprove: () => void;
}) {
  const locale = useClientLocale();
  const t = getText(locale);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.leaveRequests.pApproveLeaveRequest}</DialogTitle>
          <DialogDescription>{t.leaveRequests.pAreYouSureYouWantToApproveThis}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>{t.leaveRequests.pCommentOptional}</Label>
            <Textarea
              value={approvalComment}
              onChange={(e) => onApprovalCommentChange(e.target.value)}
              placeholder={t.leaveRequests.pAddAComment}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t.common.cancel}</Button>
          <Button onClick={onApprove} className="bg-green-600 hover:bg-green-700">
            <IconCheck className="ms-2 h-4 w-4" />{t.common.accept}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
