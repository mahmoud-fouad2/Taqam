import Link from "next/link";
import { ArrowUpLeft, Compass, LifeBuoy } from "lucide-react";

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
  primaryAction,
  secondaryAction,
  quickLinks = [],
  compact = false,
}: Props) {
  return (
    <section className={`relative overflow-hidden ${compact ? "min-h-[60vh]" : "min-h-screen"} bg-background`}>
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -left-16 top-24 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />
      </div>

      <div className="container mx-auto flex h-full items-center px-4 py-16">
        <div className="grid w-full items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6 text-center lg:text-start">
            <div className="inline-flex items-center gap-2 rounded-full border bg-card/80 px-4 py-2 text-sm text-muted-foreground shadow-sm">
              <Compass className="h-4 w-4 text-primary" />
              <span>{eyebrow || code}</span>
            </div>

            <div className="space-y-4">
              <p className="text-7xl font-black tracking-tight text-primary/25 sm:text-8xl">{code}</p>
              <h1 className="text-3xl font-black tracking-tight sm:text-5xl">{title}</h1>
              <p className="max-w-2xl text-lg leading-8 text-muted-foreground">{description}</p>
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
            {quickLinks.map((link) => (
              <Link key={link.href} href={link.href} className="group">
                <Card className="border-border/70 bg-card/80 shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl">
                  <CardContent className="flex items-start gap-4 p-5">
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <LifeBuoy className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-semibold transition-colors group-hover:text-primary">{link.title}</p>
                      <p className="text-sm leading-7 text-muted-foreground">{link.description}</p>
                    </div>
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