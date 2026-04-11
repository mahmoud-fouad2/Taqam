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

export function ChangeEmailForm({ locale: _locale }: { locale: "ar" | "en" }) {
  const locale = useClientLocale();
  const t = getText(locale);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const copy = useMemo(() => {
    if (locale === "ar") {
      return {
        title: t.common.pUpdateEmail,
        currentPassword: t.common.currentPassword,
        newEmail: t.common.pNewEmail,
        save: t.common.save,
        saving: t.common.saving,
        required: t.common.fillAllFields,
        success: t.common.pEmailChangedSuccessfully
      };
    }

    return {
      title: "Update email",
      currentPassword: "Current password",
      newEmail: "New email",
      save: "Save",
      saving: "Saving...",
      required: "Please fill in all fields.",
      success: "Email changed successfully."
    };
  }, [
    locale,
    t.common.currentPassword,
    t.common.fillAllFields,
    t.common.pEmailChangedSuccessfully,
    t.common.pNewEmail,
    t.common.pUpdateEmail,
    t.common.save,
    t.common.saving
  ]);

  const onSave = async () => {
    if (!currentPassword || !newEmail) {
      toast.error(copy.required);
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/account/change-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newEmail
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to change email");
      }

      toast.success(copy.success);
      setCurrentPassword("");
      setNewEmail("");

      // NextAuth session might keep old email until refresh.
      window.location.reload();
    } catch (error: any) {
      toast.error(error?.message || (locale === "ar" ? t.common.saveFailed : "Could not save."));
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
          <Label htmlFor="newEmail">{copy.newEmail}</Label>
          <Input
            id="newEmail"
            type="email"
            inputMode="email"
            dir="ltr"
            value={newEmail}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setNewEmail(e.target.value)}
            placeholder="name@company.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="currentPassword">{copy.currentPassword}</Label>
          <Input
            id="currentPassword"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setCurrentPassword(e.target.value)}
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
