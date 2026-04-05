import Link from "next/link";
import type { ComponentProps } from "react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CtaAction = {
  href: string;
  label: string;
  variant?: ComponentProps<typeof Button>["variant"];
  size?: ComponentProps<typeof Button>["size"];
};

type MarketingPageCtaProps = {
  icon?: LucideIcon;
  badge?: string;
  title: string;
  description: string;
  primaryAction: CtaAction;
  secondaryAction?: CtaAction;
  tone?: "gradient" | "muted";
  className?: string;
};

export function MarketingPageCta({
  icon: Icon,
  badge,
  title,
  description,
  primaryAction,
  secondaryAction,
  tone = "gradient",
  className,
}: MarketingPageCtaProps) {
  return (
    <section
      className={cn(
        "border-t py-16",
        tone === "gradient" ? "bg-gradient-to-b from-primary/5 to-background" : "bg-muted/30",
        className
      )}
    >
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl rounded-3xl border bg-card p-8 text-center shadow-sm sm:p-10">
          {Icon ? (
            <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Icon className="h-6 w-6 text-primary" />
            </div>
          ) : null}

          {badge ? (
            <span className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              {badge}
            </span>
          ) : null}

          <h2 className="mt-4 text-2xl font-bold sm:text-3xl">{title}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">{description}</p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href={primaryAction.href}>
              <Button size={primaryAction.size ?? "lg"} variant={primaryAction.variant ?? "brand"}>
                {primaryAction.label}
              </Button>
            </Link>
            {secondaryAction ? (
              <Link href={secondaryAction.href}>
                <Button size={secondaryAction.size ?? "lg"} variant={secondaryAction.variant ?? "outline"}>
                  {secondaryAction.label}
                </Button>
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}