"use client";

import * as React from "react";
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

/**
 * Auto-scrolling card carousel (conveyor belt / marquee).
 * Cards loop seamlessly by duplicating the list.
 * Pauses on hover.
 */
export function FeaturesMarquee({ features, isAr, className }: FeaturesMarqueeProps) {
  // Double the array for seamless infinite loop
  const doubled = [...features, ...features];

  return (
    <div className={cn("relative overflow-hidden py-2", className)}>
      {/* Fade edges */}
      <div className="pointer-events-none absolute inset-y-0 start-0 z-10 w-24 bg-gradient-to-r from-muted/30 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 end-0 z-10 w-24 bg-gradient-to-l from-muted/30 to-transparent" />

      <div className="features-marquee-track flex gap-5 will-change-transform">
        {doubled.map((feature, idx) => (
          <div
            key={idx}
            className="group flex w-64 shrink-0 flex-col gap-3 rounded-2xl border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg hover:shadow-black/8"
          >
            <div
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-xl",
                feature.color,
              )}
            >
              <feature.icon className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold leading-tight">
              {isAr ? feature.title : feature.titleEn}
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {isAr ? feature.description : feature.descriptionEn}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
