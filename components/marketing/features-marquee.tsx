import Image from "next/image";
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
        "group flex items-start gap-2.5 rounded-[22px] border border-white/60 bg-white/80 p-3.5 shadow-[0_14px_40px_-28px_rgba(15,23,42,0.18)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_50px_-26px_rgba(15,23,42,0.3)] dark:border-white/10 dark:bg-card/90 sm:p-4",
        className,
      )}
    >
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.875rem] ring-1 ring-black/5 sm:h-10 sm:w-10",
          feature.color,
        )}
      >
        <feature.icon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
      </div>

      <div className="min-w-0 space-y-1">
        <p className="text-[0.95rem] font-semibold leading-5 text-foreground">
          {isAr ? feature.title : feature.titleEn}
        </p>
        <p className="text-[12px] leading-[1.15rem] text-muted-foreground sm:text-xs sm:leading-5">
          {isAr ? feature.description : feature.descriptionEn}
        </p>
      </div>
    </article>
  );
}

export function FeaturesMarquee({ features, isAr, className }: FeaturesMarqueeProps) {
  const splitIndex = Math.ceil(features.length / 2);
  const leadingFeatures = features.slice(0, splitIndex);
  const trailingFeatures = features.slice(splitIndex);
  const startColumnFeatures = isAr ? leadingFeatures : trailingFeatures;
  const endColumnFeatures = isAr ? trailingFeatures : leadingFeatures;
  const centerHighlights = isAr
    ? ["الموظفون", "الحضور", "الرواتب"]
    : ["Employees", "Attendance", "Payroll"];

  return (
    <div className={cn("relative py-2", className)}>
      <div className="grid gap-3.5 sm:grid-cols-2 lg:hidden">
        {features.map((feature) => (
          <FeatureCard
            key={feature.titleEn}
            feature={feature}
            isAr={isAr}
            className="min-h-[8rem]"
          />
        ))}
      </div>

      <div className="relative mx-auto hidden w-full max-w-[82rem] lg:block">
        <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-border/60 to-transparent" />
        <div className="grid grid-cols-[14rem_minmax(22rem,25rem)_14rem] items-center justify-center gap-5 xl:grid-cols-[15rem_minmax(23rem,26rem)_15rem] xl:gap-6">
          <div className="grid justify-items-end gap-3 self-center xl:gap-3.5">
            {startColumnFeatures.map((feature) => (
              <FeatureCard
                key={feature.titleEn}
                feature={feature}
                isAr={isAr}
                className="min-h-[6.75rem] w-[14rem] rounded-[1.5rem] bg-card/95 xl:w-[15rem]"
              />
            ))}
          </div>

          <div className="relative overflow-hidden rounded-[2.75rem] border border-border/70 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.18),transparent_58%)] px-5 py-6 shadow-[0_36px_90px_-48px_rgba(15,23,42,0.5)] xl:px-6 xl:py-7">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/85 via-background/45 to-background/90" />
            <div className="relative text-center">
              <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
                {isAr ? "منصة تشغيل واحدة" : "One operating hub"}
              </span>
              <p className="mt-3 text-[2rem] font-black tracking-tight text-foreground xl:text-[2.35rem]">
                {isAr ? "طاقم" : "Taqam"}
              </p>
              <p className="mx-auto mt-2 max-w-[18rem] text-sm leading-6 text-muted-foreground xl:max-w-[19rem]">
                {isAr
                  ? "بدل الكروت المتداخلة، كل وحدة الآن واضحة حول مركز واحد يعرض مسار الإدارة الحقيقي داخل المنتج."
                  : "Instead of overlapping rotating cards, every module now sits around one clear center that represents the real operating workspace."}
              </p>

              <div className="mt-7 flex justify-center py-5 xl:mt-8 xl:py-6">
                <div className="relative flex h-36 w-36 items-center justify-center rounded-[2.75rem] bg-white shadow-[0_0_90px_-12px_rgba(59,130,246,0.34)] ring-1 ring-border/50 dark:bg-slate-900 xl:h-40 xl:w-40 xl:rounded-[3rem]">
                  {/* Concentric pulsing rings */}
                  <div className="absolute inset-0 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite] rounded-[2.75rem] ring-1 ring-primary/20 xl:rounded-[3rem]" />
                  <div className="absolute -inset-4 rounded-[3.5rem] ring-1 ring-primary/10 xl:-inset-5 xl:rounded-[4rem]" />
                  <div className="absolute -inset-8 rounded-[5rem] ring-1 ring-primary/5 xl:-inset-10 xl:rounded-[5.75rem]" />
                  
                  {/* The Logo */}
                  <Image
                    src="/logo-tight.jpeg"
                    alt={isAr ? "شعار طاقم" : "Taqam Logo"}
                    width={100}
                    height={100}
                    className="h-[4.6rem] w-auto object-contain dark:hidden xl:h-20"
                  />
                  <Image
                    src="/logo-dark.png"
                    alt={isAr ? "شعار طاقم" : "Taqam Logo"}
                    width={100}
                    height={100}
                    className="hidden h-[4.6rem] w-auto object-contain dark:block xl:h-20"
                  />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap justify-center gap-2 xl:mt-5">
                {centerHighlights.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-border/70 bg-background/90 px-3 py-1.5 text-xs font-medium text-foreground shadow-sm"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="grid justify-items-start gap-3 self-center xl:gap-3.5">
            {endColumnFeatures.map((feature) => (
              <FeatureCard
                key={feature.titleEn}
                feature={feature}
                isAr={isAr}
                className="min-h-[6.75rem] w-[14rem] rounded-[1.5rem] bg-card/95 xl:w-[15rem]"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
