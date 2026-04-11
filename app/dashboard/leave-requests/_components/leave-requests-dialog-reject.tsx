"use client";

import { IconX } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useClientLocale } from "@/lib/i18n/use-client-locale";
import { getText } from "@/lib/i18n/text";

const t = getText("ar");

export function LeaveRequestsRejectDialog({
  open,
  onOpenChange,
  rejectionReason,
  onRejectionReasonChange,
  onReject
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rejectionReason: string;
  onRejectionReasonChange: (value: string) => void;
  onReject: () => void;
}) {
  const locale = useClientLocale();
  const t = getText(locale);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.leaveRequests.pRejectLeaveRequest}</DialogTitle>
          <DialogDescription>{t.leaveRequests.pPleaseExplainTheReasonForRejec}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>{t.leaveRequests.rejectionReasonLabel}</Label>
            <Textarea
              value={rejectionReason}
              onChange={(e) => onRejectionReasonChange(e.target.value)}
              placeholder={t.leaveRequests.pEnterRejectionReason}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t.common.cancel}
          </Button>
          <Button onClick={onReject} variant="destructive" disabled={!rejectionReason}>
            <IconX className="ms-2 h-4 w-4" />
            {t.applicants.rejectApplication}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
