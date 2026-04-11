"use client";

import type { ChangeEvent } from "react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useClientLocale } from "@/lib/i18n/use-client-locale";
import { getText } from "@/lib/i18n/text";

export function ChangePasswordForm({ locale: _locale }: { locale: "ar" | "en" }) {
  const locale = useClientLocale();
  const t = getText(locale);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const copy = useMemo(() => {
    if (locale === "ar") {
      return {
        title: t.common.pUpdatePassword,
        current: t.common.currentPassword,
        next: t.common.pNewPassword,
        confirm: t.common.pConfirmNewPassword,
        save: t.common.save,
        saving: t.common.saving,
        required: t.common.fillAllFields,
        mismatch: t.common.pPasswordsDoNotMatch,
        success: t.common.pPasswordChangedSuccessfully,
        minLength: "كلمة المرور يجب أن تكون 6 أحرف على الأقل."
      };
    }

    return {
      title: "Update password",
      current: "Current password",
      next: "New password",
      confirm: "Confirm new password",
      save: "Save",
      saving: "Saving...",
      required: "Please fill in all fields.",
      mismatch: "Passwords do not match.",
      success: "Password changed successfully.",
      minLength: "Password must be at least 6 characters."
    };
  }, [
    locale,
    t.common.currentPassword,
    t.common.fillAllFields,
    t.common.pConfirmNewPassword,
    t.common.pNewPassword,
    t.common.pPasswordChangedSuccessfully,
    t.common.pPasswordsDoNotMatch,
    t.common.pUpdatePassword,
    t.common.save,
    t.common.saving
  ]);

  const onSave = async () => {
    if (!current || !next || !confirm) {
      toast.error(copy.required);
      return;
    }

    if (next.length < 6) {
      toast.error(copy.minLength);
      return;
    }

    if (next !== confirm) {
      toast.error(copy.mismatch);
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/account/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: current,
          newPassword: next
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to change password");
      }

      toast.success(copy.success);
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (error: any) {
      toast.error(error.message || (locale === "ar" ? t.common.saveFailed : "Could not save."));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{copy.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="current">{copy.current}</Label>
          <Input
            id="current"
            type="password"
            autoComplete="current-password"
            value={current}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setCurrent(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="next">{copy.next}</Label>
          <Input
            id="next"
            type="password"
            autoComplete="new-password"
            value={next}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setNext(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm">{copy.confirm}</Label>
          <Input
            id="confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setConfirm(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          <Button type="button" onClick={onSave} disabled={isSaving}>
            {isSaving ? copy.saving : copy.save}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
