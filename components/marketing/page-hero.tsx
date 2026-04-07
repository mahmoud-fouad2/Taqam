import Link from "next/link";
import type { ComponentProps } from "react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type HeroAction = {
  href: string;
  label: string;
  variant?: ComponentProps<typeof Button>["variant"];
  size?: ComponentProps<typeof Button>["size"];
};

type HeroStat = {
  value: string;
  label: string;
};

type HeroTone = "primary" | "indigo";

type MarketingPageHeroProps = {
  icon?: LucideIcon;
  badge?: string;
  title: string;
  description: string;
  actions?: HeroAction[];
  stats?: HeroStat[];
  tone?: HeroTone;
  className?: string;
};

const toneClasses: Record<HeroTone, {
  section: string;
  badge: string;
  iconWrap: string;
  iconText: string;
  orbPrimary: string;
  orbSecondary: string;
}> = {
  primary: {
    section: "bg-gradient-to-b from-primary/5 via-background to-background",
    badge: "border-primary/20 bg-primary/10 text-primary",
    iconWrap: "bg-primary/10",
    iconText: "text-primary",
    orbPrimary: "bg-primary/10",
    orbSecondary: "bg-sky-500/10",
  },
  indigo: {
    section: "bg-gradient-to-b from-indigo-50/60 via-background to-background dark:from-indigo-950/20",
    badge: "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300",
    iconWrap: "bg-indigo-500/10",
    iconText: "text-indigo-600 dark:text-indigo-300",
    orbPrimary: "bg-indigo-500/10",
    orbSecondary: "bg-blue-500/10",
  },
};

export function MarketingPageHero({
  icon: Icon,
  badge,
  title,
  description,
  actions = [],
  stats = [],
  tone = "primary",
  className,
}: MarketingPageHeroProps) {
  const styles = toneClasses[tone];

  return (
    <section className={cn("relative overflow-hidden border-b pb-20 pt-20 sm:pt-28", styles.section, className)}>
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-x-0 top-0 h-[32rem] bg-[radial-gradient(ellipse_60%_45%_at_50%_0%,rgba(99,102,241,0.12),transparent_65%)] dark:bg-[radial-gradient(ellipse_60%_45%_at_50%_0%,rgba(99,102,241,0.2),transparent_65%)]" />
        <div className={cn("absolute start-1/4 top-8 h-64 w-64 rounded-full blur-[100px]", styles.orbPrimary)} />
        <div className={cn("absolute end-1/4 top-16 h-56 w-56 rounded-full blur-[80px]", styles.orbSecondary)} />
      </div>

      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          {Icon ? (
            <div className={cn("mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl", styles.iconWrap)}>
              <Icon className={cn("h-7 w-7", styles.iconText)} />
            </div>
          ) : null}

          {badge ? (
            <span className={cn("inline-flex rounded-full border px-4 py-1.5 text-xs font-semibold", styles.badge)}>
              {badge}
            </span>
          ) : null}

          <h1 className="mt-5 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">{title}</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted-foreground/80">{description}</p>

          {actions.length > 0 ? (
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              {actions.map((action) => (
                <Link key={`${action.href}:${action.label}`} href={action.href}>
                  <Button size={action.size ?? "lg"} variant={action.variant ?? "outline"}>
                    {action.label}
                  </Button>
                </Link>
              ))}
            </div>
          ) : null}

          {stats.length > 0 ? (
            <div
              className={cn(
                "mx-auto mt-12 grid gap-4 rounded-[2rem] border border-border/50 bg-card/80 p-7 shadow-sm backdrop-blur-sm",
                stats.length === 1 && "max-w-sm",
                stats.length === 2 && "max-w-xl md:grid-cols-2",
                stats.length >= 3 && "max-w-3xl md:grid-cols-3"
              )}
            >
              {stats.map((stat) => (
                <div key={`${stat.value}:${stat.label}`}>
                  <div className="text-3xl font-extrabold text-primary">{stat.value}</div>
                  <p className="mt-1.5 text-sm text-muted-foreground/80">{stat.label}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}