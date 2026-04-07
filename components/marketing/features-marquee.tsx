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
        "group flex flex-col gap-2.5 rounded-[24px] border border-white/60 bg-white/80 p-4 shadow-[0_14px_40px_-28px_rgba(15,23,42,0.18)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_50px_-26px_rgba(15,23,42,0.3)] dark:border-white/10 dark:bg-card/90 sm:p-[1.125rem]",
        className,
      )}
    >
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-black/5 sm:h-11 sm:w-11",
          feature.color,
        )}
      >
        <feature.icon className="h-[18px] w-[18px] sm:h-5 sm:w-5" />
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
  const splitIndex = Math.ceil(features.length / 2);
  const leadingFeatures = features.slice(0, splitIndex);
  const trailingFeatures = features.slice(splitIndex);
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
            className="min-h-[9.5rem]"
          />
        ))}
      </div>

      <div className="relative hidden lg:block">
        <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-border/60 to-transparent" />
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(15.5rem,18.5rem)_minmax(0,1fr)] items-start gap-4 xl:gap-5">
          <div className="grid justify-items-end gap-3 pt-5 xl:pt-6">
            {leadingFeatures.map((feature) => (
              <FeatureCard
                key={feature.titleEn}
                feature={feature}
                isAr={isAr}
                className="min-h-[9.5rem] w-full max-w-[17.5rem] rounded-[1.75rem] bg-card/95 xl:max-w-[18.5rem]"
              />
            ))}
          </div>

          <div className="relative overflow-hidden rounded-[2.5rem] border border-border/70 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.16),transparent_55%)] p-4 shadow-[0_32px_80px_-48px_rgba(15,23,42,0.45)] xl:p-5">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/85 via-background/45 to-background/90" />
            <div className="relative text-center">
              <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
                {isAr ? "منصة تشغيل واحدة" : "One operating hub"}
              </span>
              <p className="mt-3 text-[1.75rem] font-black tracking-tight text-foreground xl:text-2xl">
                {isAr ? "طاقم" : "Taqam"}
              </p>
              <p className="mt-2 text-sm leading-[1.375rem] text-muted-foreground">
                {isAr
                  ? "بدل الكروت المتداخلة، كل وحدة الآن واضحة حول مركز واحد يعرض مسار الإدارة الحقيقي داخل المنتج."
                  : "Instead of overlapping rotating cards, every module now sits around one clear center that represents the real operating workspace."}
              </p>

              <div className="mt-6 flex justify-center py-4 xl:mt-7 xl:py-5">
                <div className="relative flex h-28 w-28 items-center justify-center rounded-[2.25rem] bg-white shadow-[0_0_80px_-15px_rgba(59,130,246,0.3)] ring-1 ring-border/50 dark:bg-slate-900 xl:h-32 xl:w-32 xl:rounded-[2.5rem]">
                  {/* Concentric pulsing rings */}
                  <div className="absolute inset-0 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite] rounded-[2.25rem] ring-1 ring-primary/20 xl:rounded-[2.5rem]" />
                  <div className="absolute -inset-3 rounded-[3rem] ring-1 ring-primary/10 xl:-inset-4 xl:rounded-[3.5rem]" />
                  <div className="absolute -inset-6 rounded-[4rem] ring-1 ring-primary/5 xl:-inset-8 xl:rounded-[4.5rem]" />
                  
                  {/* The Logo */}
                  <Image
                    src="/logo-tight.jpeg"
                    alt={isAr ? "شعار طاقم" : "Taqam Logo"}
                    width={100}
                    height={100}
                    className="h-14 w-auto object-contain dark:hidden xl:h-16"
                  />
                  <Image
                    src="/logo-dark.png"
                    alt={isAr ? "شعار طاقم" : "Taqam Logo"}
                    width={100}
                    height={100}
                    className="hidden h-14 w-auto object-contain dark:block xl:h-16"
                  />
                </div>
              </div>

              <div className="mt-3 flex flex-wrap justify-center gap-1.5 xl:mt-4 xl:gap-2">
                {centerHighlights.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-border/70 bg-background/90 px-2.5 py-1 text-[11px] font-medium text-foreground shadow-sm xl:px-3 xl:py-1.5 xl:text-xs"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="grid justify-items-start gap-3 pt-5 xl:pt-6">
            {trailingFeatures.map((feature) => (
              <FeatureCard
                key={feature.titleEn}
                feature={feature}
                isAr={isAr}
                className="min-h-[9.5rem] w-full max-w-[17.5rem] rounded-[1.75rem] bg-card/95 xl:max-w-[18.5rem]"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
