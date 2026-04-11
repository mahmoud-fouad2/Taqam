"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Fingerprint, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mobileLogin } from "@/lib/mobile/web-client";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] as const }
  })
};

export default function MobileLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const canSubmit = useMemo(
    () => email.trim().length > 3 && password.length > 0,
    [email, password]
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);

    try {
      const auth = await mobileLogin(email.trim(), password);
      if (!auth.user.employeeId) {
        setError("هذا الحساب ليس موظفاً. يرجى تسجيل الدخول بحساب موظف.");
        return;
      }
      if (!auth.user.tenantId) {
        setError("لا يمكن استخدام هذا الحساب على الجوال بدون شركة.");
        return;
      }
      router.replace("/m/home");
    } catch (err: any) {
      setError(err?.message || "فشل تسجيل الدخول");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-[85dvh] flex-col items-center justify-center" dir="rtl">
      {/* Brand */}
      <motion.div
        className="mb-10 flex flex-col items-center gap-3"
        custom={0}
        initial="hidden"
        animate="visible"
        variants={fadeUp}>
        <div className="from-primary to-primary/80 shadow-primary/25 flex size-[72px] items-center justify-center rounded-3xl bg-gradient-to-br shadow-lg">
          <Fingerprint className="size-9 text-white" />
        </div>
        <div className="text-center">
          <h1 className="text-[28px] font-bold tracking-tight text-slate-900">Taqam</h1>
          <p className="mt-0.5 text-[13px] text-slate-400">نظام إدارة الموارد البشرية</p>
        </div>
      </motion.div>

      {/* Form */}
      <motion.div
        className="w-full rounded-3xl bg-white p-6 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.06)]"
        custom={1}
        initial="hidden"
        animate="visible"
        variants={fadeUp}>
        <h2 className="mb-6 text-center text-lg font-semibold text-slate-800">تسجيل الدخول</h2>

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-[13px] font-medium text-slate-600">
              البريد الإلكتروني
            </Label>
            <Input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              disabled={busy}
              dir="ltr"
              className="focus:border-primary focus:ring-primary/20 h-12 rounded-xl border-slate-200 bg-slate-50/50 text-base placeholder:text-slate-300 focus:bg-white"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-[13px] font-medium text-slate-600">
              كلمة المرور
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={busy}
              dir="ltr"
              className="focus:border-primary focus:ring-primary/20 h-12 rounded-xl border-slate-200 bg-slate-50/50 text-base placeholder:text-slate-300 focus:bg-white"
            />
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="overflow-hidden rounded-xl bg-red-50 px-4 py-3 text-[13px] leading-relaxed text-red-600">
              {error}
            </motion.div>
          )}

          <Button
            className="shadow-primary/20 h-12 w-full rounded-xl text-[15px] font-semibold shadow-sm transition-transform active:scale-[0.98]"
            disabled={!canSubmit || busy}
            type="submit">
            {busy ? (
              <span className="flex items-center gap-2">
                <Loader2 className="size-5 animate-spin" />
                جاري الدخول...
              </span>
            ) : (
              "دخول"
            )}
          </Button>
        </form>
      </motion.div>

      <motion.p
        className="mt-8 text-center text-[11px] text-slate-300"
        custom={2}
        initial="hidden"
        animate="visible"
        variants={fadeUp}>
        Taqam © {new Date().getFullYear()}
      </motion.p>
    </div>
  );
}
