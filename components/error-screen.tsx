"use client";

import Link from "next/link";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";

import { LogoMark } from "@/components/logo-mark";
import { Button } from "@/components/ui/button";

type ErrorScreenProps = {
  locale: "ar" | "en";
  title?: string;
  description?: string;
  digest?: string;
  reset: () => void;
};

export function ErrorScreen({
  locale,
  title,
  description,
  digest,
  reset,
}: ErrorScreenProps) {
  const isAr = locale === "ar";
  const homeHref = isAr ? "/" : "/en";
  const supportHref = isAr ? "/support" : "/en/support";

  return (
    <div className="relative flex min-h-screen items-center overflow-hidden bg-background px-4 py-16">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.14),transparent_26%),radial-gradient(circle_at_bottom,rgba(99,102,241,0.16),transparent_28%)] dark:bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.16),transparent_26%),radial-gradient(circle_at_bottom,rgba(59,130,246,0.18),transparent_30%)]" />

      <div className="container mx-auto max-w-5xl">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="rounded-[2rem] border border-border/60 bg-card/80 p-8 shadow-[0_30px_80px_-36px_rgba(15,23,42,0.32)] backdrop-blur-sm sm:p-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
              <AlertTriangle className="h-3.5 w-3.5" />
              {isAr ? "خلل مؤقت في الصفحة" : "Temporary page failure"}
            </div>

            <div className="mt-6">
              <LogoMark frameClassName="rounded-xl p-0" imageClassName="h-12" />
            </div>

            <h1 className="mt-6 text-3xl font-black tracking-tight text-foreground sm:text-4xl">
              {title ?? (isAr ? "حصل خطأ غير متوقع" : "Something went wrong")}
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-8 text-muted-foreground sm:text-[15px]">
              {description ??
                (isAr
                  ? "الصفحة أو الانتقال الحالي فشل مؤقتًا. جرّب إعادة المحاولة، وإذا استمرت المشكلة استخدم الدعم للوصول للحالة بسرعة."
                  : "The current page or transition failed temporarily. Try again, and if it persists, contact support for faster handling.")}
            </p>

            {digest ? (
              <div className="mt-5 rounded-2xl border border-border/50 bg-background/70 px-4 py-3 text-xs text-muted-foreground">
                {isAr ? "رمز الخطأ" : "Error code"}: {digest}
              </div>
            ) : null}

            <div className="mt-8 flex flex-wrap gap-3">
              <Button onClick={reset} className="gap-2">
                <RotateCcw className="h-4 w-4" />
                {isAr ? "إعادة المحاولة" : "Try again"}
              </Button>
              <Button asChild variant="outline" className="gap-2">
                <Link href={homeHref}>
                  <Home className="h-4 w-4" />
                  {isAr ? "العودة للرئيسية" : "Back home"}
                </Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href={supportHref}>{isAr ? "الدعم الفني" : "Support"}</Link>
              </Button>
            </div>
          </div>

          <div className="rounded-[2rem] border border-border/60 bg-gradient-to-br from-sky-500/10 via-background to-indigo-500/10 p-8 shadow-[0_30px_80px_-40px_rgba(79,70,229,0.26)] backdrop-blur-sm sm:p-10">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary/80">
              {isAr ? "ماذا يمكنك أن تفعل الآن؟" : "What to do now"}
            </p>
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-border/50 bg-background/70 p-4">
                <p className="text-sm font-semibold text-foreground">{isAr ? "1. أعد المحاولة" : "1. Retry the transition"}</p>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  {isAr ? "إذا كان الخلل عابرًا فإعادة المحاولة تكفي غالبًا بدون رفرش كامل." : "If this is a transient failure, retrying is usually enough without a full refresh."}
                </p>
              </div>
              <div className="rounded-2xl border border-border/50 bg-background/70 p-4">
                <p className="text-sm font-semibold text-foreground">{isAr ? "2. ارجع للمسار الرئيسي" : "2. Return to a safe route"}</p>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  {isAr ? "لو كانت الصفحة الحالية انتقلت أو تعطل تحميلها، ارجع للرئيسية أو صفحة الدعم ثم ادخل من جديد." : "If the current route moved or failed to load, go back home or to support, then reopen the route."}
                </p>
              </div>
              <div className="rounded-2xl border border-border/50 bg-background/70 p-4">
                <p className="text-sm font-semibold text-foreground">{isAr ? "3. أرسل الحالة للدعم" : "3. Send it to support"}</p>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  {isAr ? "إذا تكرر الخطأ، وجود رمز الخطأ أو وصف المسار يساعدنا على تتبع السبب الحقيقي بسرعة." : "If the failure repeats, sharing the route and error code helps us track the root cause much faster."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}