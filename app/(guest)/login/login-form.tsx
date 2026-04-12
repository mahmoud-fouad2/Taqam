"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { getSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buildTenantUrl } from "@/lib/tenant";
import { t } from "@/lib/i18n/messages";

type LoginFormProps = {
  locale: "ar" | "en";
  labels: {
    email: string;
    emailPlaceholder: string;
    password: string;
    passwordPlaceholder: string;
    submit: string;
  };
};

export function LoginForm({ locale, labels }: LoginFormProps) {
  const router = useRouter();
  const { executeRecaptcha } = useGoogleReCaptcha();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigateTo = useCallback((target: string) => {
    const targetUrl = new URL(target, window.location.origin);

    if (targetUrl.origin === window.location.origin) {
      router.replace(`${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`);
      return;
    }

    window.location.assign(targetUrl.toString());
  }, [router]);

  const onSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError(
        locale === "ar" ? "يرجى إدخال البريد وكلمة المرور" : "Please enter email and password"
      );
      return;
    }

    if (!siteKey || !executeRecaptcha) {
      setError(t(locale, "captcha.missingConfig"));
      return;
    }

    setIsLoading(true);
    let captchaToken: string;
    try {
      captchaToken = await executeRecaptcha("login");
    } catch {
      setError(t(locale, "captcha.invalid"));
      setIsLoading(false);
      return;
    }

    try {
      const res = await signIn("credentials", {
        email: trimmedEmail,
        password,
        locale,
        captchaToken,
        redirect: false
      });

      if (!res || res.error) {
        const raw = res?.error;
        if (raw === "CredentialsSignin") {
          setError(
            locale === "ar"
              ? "البريد الإلكتروني أو كلمة المرور غير صحيحة"
              : "Invalid email or password"
          );
        } else {
          setError(raw || (locale === "ar" ? "تعذر تسجيل الدخول" : "Unable to sign in"));
        }
        return;
      }

      const session = await getSession();
      const role = (session?.user as any)?.role as string | undefined;
      const tenantSlug = (session?.user as any)?.tenant?.slug as string | undefined;

      if (role === "SUPER_ADMIN") {
        router.replace("/dashboard/super-admin");
      } else if (tenantSlug) {
        navigateTo(buildTenantUrl(tenantSlug, "/dashboard"));
      } else {
        router.replace("/dashboard");
      }
    } catch {
      setError(locale === "ar" ? "تعذر تسجيل الدخول" : "Unable to sign in");
    } finally {
      setIsLoading(false);
    }
  }, [email, password, locale, siteKey, executeRecaptcha, router, navigateTo]);

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-sm font-medium">
          {labels.email}
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder={labels.emailPlaceholder}
          className="bg-muted/50 focus-visible:bg-background h-11 rounded-xl"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password" className="text-sm font-medium">
            {labels.password}
          </Label>
          <Link
            href={locale === "en" ? "/en/forgot-password" : "/forgot-password"}
            className="text-muted-foreground hover:text-primary text-xs hover:underline">
            {locale === "ar" ? "نسيت كلمة المرور؟" : "Forgot password?"}
          </Link>
        </div>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder={labels.passwordPlaceholder}
            className="bg-muted/50 focus-visible:bg-background h-11 rounded-xl pe-11"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword((v) => !v)}
            className="text-muted-foreground hover:text-foreground absolute inset-y-0 end-0 flex items-center px-3"
            aria-label={
              showPassword
                ? locale === "ar"
                  ? "إخفاء كلمة المرور"
                  : "Hide password"
                : locale === "ar"
                  ? "إظهار كلمة المرور"
                  : "Show password"
            }>
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {error ? (
        <div className="border-destructive/30 bg-destructive/5 text-destructive rounded-lg border px-4 py-3 text-sm">
          {error}
        </div>
      ) : null}

      {siteKey ? (
        <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-muted/20 px-3.5 py-2.5">
          <ShieldCheck className="text-primary size-4 shrink-0" />
          <p className="text-muted-foreground text-xs leading-5">
            {locale === "ar"
              ? "محمي بـ Google reCAPTCHA v3 — يعمل تلقائيًا في الخلفية."
              : "Protected by Google reCAPTCHA v3 — runs automatically in the background."}
          </p>
        </div>
      ) : (
        <p className="text-destructive text-sm">{t(locale, "captcha.missingConfig")}</p>
      )}

      <Button
        type="submit"
        variant="brand"
        className="h-11 w-full gap-2 rounded-xl focus-visible:ring-indigo-500"
        disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {locale === "ar" ? "جاري تسجيل الدخول..." : "Signing in..."}
          </>
        ) : (
          labels.submit
        )}
      </Button>
    </form>
  );
}
