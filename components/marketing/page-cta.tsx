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
  className
}: MarketingPageCtaProps) {
  return (
    <section
      className={cn(
        "border-t py-24",
        tone === "gradient" ? "from-primary/5 to-background bg-gradient-to-b" : "bg-muted/20",
        className
      )}>
      <div className="container mx-auto px-4">
        <div className="border-border/50 bg-card/90 mx-auto max-w-3xl rounded-[2.5rem] border p-10 text-center shadow-sm backdrop-blur-sm sm:p-14">
          {Icon ? (
            <div className="bg-primary/[0.07] mx-auto mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl">
              <Icon className="text-primary h-7 w-7" />
            </div>
          ) : null}

          {badge ? (
            <span className="border-primary/20 bg-primary/10 text-primary inline-flex rounded-full border px-4 py-1.5 text-sm font-medium">
              {badge}
            </span>
          ) : null}

          <h2 className="mt-4 text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h2>
          <p className="text-muted-foreground/80 mx-auto mt-4 max-w-2xl">{description}</p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href={primaryAction.href}>
              <Button size={primaryAction.size ?? "lg"} variant={primaryAction.variant ?? "brand"}>
                {primaryAction.label}
              </Button>
            </Link>
            {secondaryAction ? (
              <Link href={secondaryAction.href}>
                <Button
                  size={secondaryAction.size ?? "lg"}
                  variant={secondaryAction.variant ?? "outline"}>
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
