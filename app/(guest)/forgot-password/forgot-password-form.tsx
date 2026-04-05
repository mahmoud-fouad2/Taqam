"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ForgotPasswordForm({ locale }: { locale: "ar" | "en" }) {
  const isAr = locale === "ar";
  const p = locale === "en" ? "/en" : "";
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error(isAr ? "تعذر إرسال الطلب الآن" : "Unable to send the request right now");
      }

      setSuccess(true);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : isAr
            ? "تعذر إرسال الطلب الآن"
            : "Unable to send the request right now"
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-3xl border bg-card p-8 shadow-sm">
        <div className="mx-auto flex max-w-md flex-col items-center text-center">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <MailCheck className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">{isAr ? "تم إرسال الرابط" : "Link sent"}</h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            {isAr
              ? "إذا كان البريد الإلكتروني مرتبطًا بحساب، ستصلك رسالة تحتوي على رابط إعادة التعيين أو التفعيل خلال دقائق."
              : "If this email is linked to an account, you will receive a reset or activation link within a few minutes."}
          </p>
          <Link href={`${p}/login`} className="mt-6">
            <Button variant="brand" className="gap-2">
              {isAr ? "العودة لتسجيل الدخول" : "Back to login"}
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl border bg-card p-8 shadow-sm">
      <div className="space-y-2">
        <Label htmlFor="email">{isAr ? "البريد الإلكتروني" : "Email address"}</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@company.com"
          className="h-11 rounded-xl bg-muted/40"
        />
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <Button type="submit" variant="brand" size="lg" className="mt-6 h-11 w-full gap-2" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {isAr ? "جارٍ الإرسال..." : "Sending..."}
          </>
        ) : isAr ? (
          "إرسال رابط الاستعادة"
        ) : (
          "Send recovery link"
        )}
      </Button>

      <div className="mt-5 text-center text-sm text-muted-foreground">
        <Link href={`${p}/login`} className="hover:text-foreground hover:underline">
          {isAr ? "العودة لتسجيل الدخول" : "Back to login"}
        </Link>
      </div>
    </form>
  );
}