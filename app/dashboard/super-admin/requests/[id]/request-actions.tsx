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
import { tenantsService } from "@/lib/api";
import { useClientLocale } from "@/lib/i18n/use-client-locale";
import { getText } from "@/lib/i18n/text";

export function RequestActions({
  requestId,
  status
}: {
  requestId: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | string;
}) {
  const locale = useClientLocale();
  const t = getText(locale);
  const [isActing, setIsActing] = React.useState(false);
  const [showRejectDialog, setShowRejectDialog] = React.useState(false);
  const [rejectReason, setRejectReason] = React.useState("");
  const [approveSlug, setApproveSlug] = React.useState("");
  const [approvePlan, setApprovePlan] = React.useState<
    "trial" | "starter" | "business" | "enterprise" | undefined
  >(undefined);
  const [approveMaxEmployees, setApproveMaxEmployees] = React.useState("");
  const [approveExpiryDate, setApproveExpiryDate] = React.useState("");

  const canAct = status === "PENDING";

  const approve = async () => {
    setIsActing(true);
    try {
      const payload: any = {};

      const slug = approveSlug.trim();
      if (slug) payload.slug = slug;

      if (approvePlan) payload.plan = approvePlan;

      const maxEmployees = Number.parseInt(approveMaxEmployees, 10);
      if (Number.isFinite(maxEmployees) && maxEmployees > 0) {
        payload.maxEmployees = maxEmployees;
      }

      if (approveExpiryDate) {
        payload.planExpiresAt = approveExpiryDate;
      }

      const res = await tenantsService.approveRequest(requestId, payload);
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
      <div className="border-border/60 bg-background/60 grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="request-approve-plan">
            {t.pricingPlans.planType} ({t.common.optional})
          </Label>
          <Select value={approvePlan} onValueChange={(v) => setApprovePlan(v as any)}>
            <SelectTrigger id="request-approve-plan">
              <SelectValue placeholder={t.tenant.planPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="trial">{t.pricingPlans.trial}</SelectItem>
              <SelectItem value="starter">{t.common.basic}</SelectItem>
              <SelectItem value="business">{t.pricingPlans.professional}</SelectItem>
              <SelectItem value="enterprise">{t.common.institutions}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="request-approve-slug">
            {t.tenants.slugColumn} ({t.common.optional})
          </Label>
          <Input
            id="request-approve-slug"
            value={approveSlug}
            onChange={(e) => setApproveSlug(e.target.value)}
            placeholder={t.tenant.slugExample}
            autoCapitalize="none"
            autoCorrect="off"
            inputMode="text"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="request-approve-max-employees">
            {t.platformSettings.maxEmployees} ({t.common.optional})
          </Label>
          <Input
            id="request-approve-max-employees"
            value={approveMaxEmployees}
            onChange={(e) => setApproveMaxEmployees(e.target.value)}
            placeholder="25"
            inputMode="numeric"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="request-approve-expiry">
            {t.common.expiryDate} ({t.common.optional})
          </Label>
          <Input
            id="request-approve-expiry"
            type="date"
            value={approveExpiryDate}
            onChange={(e) => setApproveExpiryDate(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => void approve()} disabled={!canAct || isActing}>
          {t.superAdmin.pAcceptAndCreateCompany}
        </Button>
        <Button variant="outline" onClick={reject} disabled={!canAct || isActing}>
          {t.common.reject}
        </Button>
      </div>

      <Dialog
        open={showRejectDialog}
        onOpenChange={(open) => {
          if (!open) setShowRejectDialog(false);
        }}>
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
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              {t.common.cancel}
            </Button>
            <Button variant="destructive" onClick={() => void confirmReject()}>
              {t.common.reject}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
