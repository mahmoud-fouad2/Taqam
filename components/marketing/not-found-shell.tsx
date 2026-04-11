import Link from "next/link";
import { ArrowUpLeft, Compass, LifeBuoy, Orbit, Sparkles } from "lucide-react";

import { LogoMark } from "@/components/logo-mark";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type Action = {
  href: string;
  label: string;
  variant?: "brand" | "outline" | "secondary";
};

type QuickLink = {
  href: string;
  title: string;
  description: string;
};

type Props = {
  code?: string;
  title: string;
  description: string;
  eyebrow?: string;
  locale?: "ar" | "en";
  primaryAction: Action;
  secondaryAction?: Action;
  quickLinks?: QuickLink[];
  compact?: boolean;
};

export function NotFoundShell({
  code = "404",
  title,
  description,
  eyebrow,
  locale = "ar",
  primaryAction,
  secondaryAction,
  quickLinks = [],
  compact = false
}: Props) {
  const isAr = locale === "ar";

  return (
    <section
      className={`relative overflow-hidden ${compact ? "min-h-[60vh]" : "min-h-screen"} bg-background`}>
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="bg-primary/10 absolute top-0 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full blur-3xl" />
        <div className="absolute top-24 -left-16 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px] dark:bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)]" />
      </div>

      <div className="container mx-auto flex h-full items-center px-4 py-16">
        <div className="grid w-full items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6 text-center lg:text-start">
            <div className="bg-card/80 text-muted-foreground inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm shadow-sm backdrop-blur-sm">
              <Compass className="text-primary h-4 w-4" />
              <span>{eyebrow || code}</span>
            </div>

            <div className="space-y-4">
              <div className="flex justify-center lg:justify-start">
                <LogoMark frameClassName="rounded-2xl p-0" imageClassName="h-12" />
              </div>
              <p className="text-primary/25 text-7xl font-black tracking-tight sm:text-8xl">
                {code}
              </p>
              <h1 className="text-3xl font-black tracking-tight sm:text-5xl">{title}</h1>
              <p className="text-muted-foreground max-w-2xl text-lg leading-8">{description}</p>
            </div>

            <div className="flex flex-wrap justify-center gap-3 lg:justify-start">
              <Button asChild size="lg" variant={primaryAction.variant || "brand"}>
                <Link href={primaryAction.href}>
                  {primaryAction.label}
                  <ArrowUpLeft className="h-4 w-4" />
                </Link>
              </Button>
              {secondaryAction ? (
                <Button asChild size="lg" variant={secondaryAction.variant || "outline"}>
                  <Link href={secondaryAction.href}>{secondaryAction.label}</Link>
                </Button>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4">
            <Card className="border-border/70 bg-card/80 overflow-hidden shadow-sm">
              <CardContent className="relative p-6">
                <div className="bg-primary/10 text-primary absolute end-5 top-5 rounded-full p-2">
                  <Orbit className="h-5 w-5" />
                </div>
                <p className="text-primary/80 text-xs font-bold tracking-[0.2em] uppercase">
                  {code}
                </p>
                <h2 className="mt-3 text-2xl font-black tracking-tight">
                  {isAr ? "روابط مفيدة" : "Helpful links"}
                </h2>
                <p className="text-muted-foreground mt-3 max-w-md text-sm leading-7">
                  {isAr
                    ? "إذا وصلت إلى رابط غير موجود، استخدم الروابط التالية للرجوع إلى المكان الصحيح بسرعة."
                    : "If you reached an unavailable link, use the shortcuts below to return to the right place quickly."}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="border-border/60 bg-background/80 text-foreground/80 rounded-full border px-3 py-1 text-xs font-medium">
                    {compact
                      ? isAr
                        ? "نسخة مختصرة"
                        : "Compact mode"
                      : isAr
                        ? "صفحة كاملة"
                        : "Full page"}
                  </span>
                  <span className="border-border/60 bg-background/80 text-foreground/80 rounded-full border px-3 py-1 text-xs font-medium">
                    {isAr ? "واجهة استعادة مخصصة" : "Branded recovery UI"}
                  </span>
                </div>
              </CardContent>
            </Card>

            {quickLinks.map((link) => (
              <Link key={link.href} href={link.href} className="group">
                <Card className="border-border/70 bg-card/80 shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl">
                  <CardContent className="flex items-start gap-4 p-5">
                    <div className="bg-primary/10 text-primary inline-flex h-11 w-11 items-center justify-center rounded-2xl">
                      <LifeBuoy className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="group-hover:text-primary font-semibold transition-colors">
                        {link.title}
                      </p>
                      <p className="text-muted-foreground text-sm leading-7">{link.description}</p>
                    </div>
                    <Sparkles className="text-primary/40 group-hover:text-primary ms-auto hidden h-4 w-4 shrink-0 sm:block" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
