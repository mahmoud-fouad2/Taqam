import type * as React from "react";
import { cn } from "@/lib/utils";

interface FeatureItem {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
}

interface FeaturesMarqueeProps {
  features: FeatureItem[];
  isAr: boolean;
  className?: string;
}

function FeatureCard({
  feature,
  isAr,
  className,
}: {
  feature: FeatureItem;
  isAr: boolean;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "group flex flex-col gap-3 rounded-[28px] border border-border/70 bg-card/95 p-5 shadow-[0_14px_40px_-28px_rgba(15,23,42,0.28)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_50px_-26px_rgba(15,23,42,0.35)]",
        className,
      )}
    >
      <div
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-xl ring-1 ring-black/5",
          feature.color,
        )}
      >
        <feature.icon className="h-5 w-5" />
      </div>
      <p className="text-sm font-semibold leading-tight text-foreground">
        {isAr ? feature.title : feature.titleEn}
      </p>
      <p className="text-xs leading-relaxed text-muted-foreground">
        {isAr ? feature.description : feature.descriptionEn}
      </p>
    </article>
  );
}

export function FeaturesMarquee({ features, isAr, className }: FeaturesMarqueeProps) {
  return (
    <div className={cn("relative py-2", className)}>
      <div className="grid gap-4 sm:grid-cols-2 lg:hidden">
        {features.map((feature) => (
          <FeatureCard
            key={feature.titleEn}
            feature={feature}
            isAr={isAr}
            className="min-h-[11.5rem]"
          />
        ))}
      </div>

      <div className="features-orbit-stage relative hidden h-[42rem] overflow-hidden lg:block">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.08),transparent_48%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-border/70 to-transparent" />
        <div className="pointer-events-none absolute start-1/2 top-1/2 h-[17rem] w-[17rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/15 bg-background/85 shadow-[0_25px_80px_-45px_rgba(15,23,42,0.45)] backdrop-blur-sm" />
        <div className="pointer-events-none absolute start-1/2 top-1/2 h-[30rem] w-[56rem] -translate-x-1/2 -translate-y-1/2 rounded-[999px] border border-border/60" />

        <div className="absolute start-1/2 top-1/2 z-10 flex h-[13rem] w-[13rem] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full text-center">
          <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
            {isAr ? "منصة موحدة" : "Unified Platform"}
          </span>
          <p className="mt-4 text-2xl font-bold tracking-tight text-foreground">
            {isAr ? "طاقم" : "Taqam"}
          </p>
          <p className="mt-2 max-w-[10rem] text-xs leading-5 text-muted-foreground">
            {isAr
              ? "كل وحدة تدور حول نظام واحد بدل التنقل بين أدوات متفرقة."
              : "Every workflow orbits around one system instead of scattered tools."}
          </p>
        </div>

        <div className="features-orbit-rotator absolute start-1/2 top-1/2 h-0 w-0 [--orbit-duration:34s] [--orbit-radius:20rem] xl:[--orbit-radius:24rem]">
          {features.map((feature) => {
            return (
              <div
                key={feature.titleEn}
                className="features-orbit-node absolute start-0 top-0"
              >
                <div className="features-orbit-unangle">
                  <div className="features-orbit-card-shell">
                    <FeatureCard
                      feature={feature}
                      isAr={isAr}
                      className="features-orbit-card w-72"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
