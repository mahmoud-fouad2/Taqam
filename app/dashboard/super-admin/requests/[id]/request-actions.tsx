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

export function RequestActions({
  requestId,
  status,
}: {
  requestId: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | string;
}) {
  const [isActing, setIsActing] = React.useState(false);
  const [showRejectDialog, setShowRejectDialog] = React.useState(false);
  const [rejectReason, setRejectReason] = React.useState("");

  const canAct = status === "PENDING";

  const approve = async () => {
    setIsActing(true);
    try {
      const res = await tenantsService.approveRequest(requestId, {});
      if (!res.success) {
        toast.error(res.error || "تعذر قبول الطلب");
        return;
      }
      toast.success("تم قبول الطلب وإنشاء الشركة");
      window.location.reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "تعذر قبول الطلب");
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
        toast.error(res.error || "تعذر رفض الطلب");
        return;
      }
      toast.success("تم رفض الطلب");
      window.location.reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "تعذر رفض الطلب");
    } finally {
      setIsActing(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => void approve()} disabled={!canAct || isActing}>
          قبول وإنشاء شركة
        </Button>
        <Button variant="outline" onClick={reject} disabled={!canAct || isActing}>
          رفض
        </Button>
      </div>

      <Dialog open={showRejectDialog} onOpenChange={(open) => { if (!open) setShowRejectDialog(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>رفض الطلب</DialogTitle>
            <DialogDescription>يمكنك إدخال سبب الرفض أدناه (اختياري).</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="request-reject-reason">سبب الرفض</Label>
            <Input
              id="request-reject-reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="سبب الرفض..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>إلغاء</Button>
            <Button variant="destructive" onClick={() => void confirmReject()}>رفض</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
