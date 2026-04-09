"use client";

import * as React from "react";
import { toast } from "sonner";

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
import { tenantsService } from "@/lib/api";
import { useClientLocale } from "@/lib/i18n/use-client-locale";
import { getText } from "@/lib/i18n/text";

export function RequestActions({
  requestId,
  status,
}: {
  requestId: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | string;
}) {
  const locale = useClientLocale();
  const t = getText(locale);
  const [isActing, setIsActing] = React.useState(false);
  const [showRejectDialog, setShowRejectDialog] = React.useState(false);
  const [rejectReason, setRejectReason] = React.useState("");

  const canAct = status === "PENDING";

  const approve = async () => {
    setIsActing(true);
    try {
      const res = await tenantsService.approveRequest(requestId, {});
      if (!res.success) {
        toast.error(res.error || t.requests.acceptFailed);
        return;
      }
      toast.success(t.superAdmin.pRequestAcceptedAndCompanyCreat);
      window.location.reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t.requests.acceptFailed);
    } finally {
      setIsActing(false);
    }
  };

  const reject = () => {
    setRejectReason("");
    setShowRejectDialog(true);
  };

  const confirmReject = async () => {
    setShowRejectDialog(false);
    setIsActing(true);
    try {
      const res = await tenantsService.rejectRequest(requestId, rejectReason);
      if (!res.success) {
        toast.error(res.error || t.requests.rejectFailed);
        return;
      }
      toast.success(t.leaveRequests.rejectedSuccess);
      window.location.reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t.requests.rejectFailed);
    } finally {
      setIsActing(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => void approve()} disabled={!canAct || isActing}>
          {t.superAdmin.pAcceptAndCreateCompany}
        </Button>
        <Button variant="outline" onClick={reject} disabled={!canAct || isActing}>{t.common.reject}</Button>
      </div>

      <Dialog open={showRejectDialog} onOpenChange={(open) => { if (!open) setShowRejectDialog(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.common.reject}</DialogTitle>
            <DialogDescription>{t.common.rejectReasonOptional}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="request-reject-reason">{t.common.reason}</Label>
            <Input
              id="request-reject-reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder={t.common.rejectReason}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>{t.common.cancel}</Button>
            <Button variant="destructive" onClick={() => void confirmReject()}>{t.common.reject}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
