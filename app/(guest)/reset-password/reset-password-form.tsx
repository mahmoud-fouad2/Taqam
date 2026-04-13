"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, CheckCircle2, Loader2, LockKeyhole } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ResetPasswordForm({
  locale,
  token
}: {
  locale: "ar" | "en";
  token: string | null;
}) {
  const isAr = locale === "ar";
  const p = locale === "en" ? "/en" : "";
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [mode, setMode] = useState<"password-reset" | "tenant-admin-activation" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!token) {
      setError(isAr ? "رابط غير صالح أو ناقص" : "Invalid or incomplete link");
      return;
    }

    if (newPassword.length < 8) {
      setError(
        isAr ? "كلمة المرور يجب ألا تقل عن 8 أحرف" : "Password must be at least 8 characters"
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(isAr ? "تأكيد كلمة المرور غير متطابق" : "Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          data?.error ||
            (isAr
              ? "تعذر إكمال العملية بهذا الرابط"
              : "Unable to complete the request with this link")
        );
      }

      setMode(data?.mode ?? "password-reset");
      setSuccess(true);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : isAr
            ? "تعذر إكمال العملية"
            : "Unable to complete the request"
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-card rounded-3xl border p-8 shadow-sm">
        <div className="mx-auto flex max-w-md flex-col items-center text-center">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-green-500/10">
            <CheckCircle2 className="h-7 w-7 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold">
            {mode === "tenant-admin-activation"
              ? isAr
                ? "تم تفعيل الحساب"
                : "Account activated"
              : isAr
                ? "تم تحديث كلمة المرور"
                : "Password updated"}
          </h2>
          <p className="text-muted-foreground mt-3 text-sm leading-7">
            {mode === "tenant-admin-activation"
              ? isAr
                ? "تم إنشاء كلمة المرور وتفعيل حساب مدير الشركة ومساحة الشركة بنجاح. يمكنك تسجيل الدخول الآن."
                : "Your company admin account and workspace are now active and ready for sign-in."
              : isAr
                ? "تم حفظ كلمة المرور الجديدة. يمكنك تسجيل الدخول فورًا."
                : "Your new password has been saved. You can sign in right away."}
          </p>
          <Link href={`${p}/login`} className="mt-6">
            <Button variant="brand" className="gap-2">
              {isAr ? "الانتقال لتسجيل الدخول" : "Go to login"}
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card rounded-3xl border p-8 shadow-sm">
      <div className="bg-primary/5 text-muted-foreground mb-6 flex items-center gap-3 rounded-2xl px-4 py-3 text-sm">
        <LockKeyhole className="text-primary h-4 w-4" />
        <span>
          {isAr
            ? "استخدم كلمة مرور قوية وفريدة لهذا الحساب."
            : "Use a strong, unique password for this account."}
        </span>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="newPassword">{isAr ? "كلمة المرور الجديدة" : "New password"}</Label>
          <Input
            id="newPassword"
            type="password"
            autoComplete="new-password"
            required
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            className="bg-muted/40 h-11 rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">{isAr ? "تأكيد كلمة المرور" : "Confirm password"}</Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="bg-muted/40 h-11 rounded-xl"
          />
        </div>
      </div>

      {error ? (
        <div className="border-destructive/25 bg-destructive/5 text-destructive mt-4 rounded-xl border px-4 py-3 text-sm">
          {error}
        </div>
      ) : null}

      <Button
        type="submit"
        variant="brand"
        size="lg"
        className="mt-6 h-11 w-full gap-2"
        disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {isAr ? "جارٍ الحفظ..." : "Saving..."}
          </>
        ) : isAr ? (
          "حفظ كلمة المرور"
        ) : (
          "Save password"
        )}
      </Button>
    </form>
  );
}
