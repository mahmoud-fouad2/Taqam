"use client";

import { useState } from "react";
import { getSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError(locale === "ar" ? "يرجى إدخال البريد وكلمة المرور" : "Please enter email and password");
      return;
    }

    setIsLoading(true);
    try {
      const res = await signIn("credentials", {
        email: trimmedEmail,
        password,
        redirect: false,
      });

      if (!res || res.error) {
		const raw = res?.error;
		if (raw === "CredentialsSignin") {
			setError(locale === "ar" ? "البريد الإلكتروني أو كلمة المرور غير صحيحة" : "Invalid email or password");
		} else {
			setError(raw || (locale === "ar" ? "تعذر تسجيل الدخول" : "Unable to sign in"));
		}
        return;
      }

    const session = await getSession();
    const role = (session?.user as any)?.role as string | undefined;
    router.push(role === "SUPER_ADMIN" ? "/dashboard/super-admin" : "/dashboard");
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  };

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
          className="h-11 rounded-xl bg-muted/50 focus-visible:bg-background"
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
          <a
            href="#"
            className="text-xs text-muted-foreground hover:text-primary hover:underline"
            tabIndex={-1}
          >
            {locale === "ar" ? "نسيت كلمة المرور؟" : "Forgot password?"}
          </a>
        </div>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder={labels.passwordPlaceholder}
            className="h-11 rounded-xl bg-muted/50 pe-11 focus-visible:bg-background"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 end-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
            aria-label={showPassword ? (locale === "ar" ? "إخفاء كلمة المرور" : "Hide password") : (locale === "ar" ? "إظهار كلمة المرور" : "Show password")}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <Button
        type="submit"
        variant="brand"
        className="h-11 w-full gap-2 rounded-xl focus-visible:ring-indigo-500"
        disabled={isLoading}
      >
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
