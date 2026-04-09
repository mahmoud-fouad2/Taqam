"use client";

import { useMemo } from "react";

type Props = {
  name: string;
  locale: "ar" | "en";
  headingLabel: string;
};

function getGreeting(locale: "ar" | "en"): string {
  const hour = new Date().getHours();
  if (locale === "ar") {
    if (hour >= 5 && hour < 12) return "صباح الخير";
    if (hour >= 12 && hour < 17) return "مساء الخير";
    return "مساء النور";
  } else {
    if (hour >= 5 && hour < 12) return "Good morning";
    if (hour >= 12 && hour < 17) return "Good afternoon";
    return "Good evening";
  }
}

export function DashboardGreeting({ name, locale, headingLabel }: Props) {
  const greeting = useMemo(() => getGreeting(locale), [locale]);
  const firstName = name.split(" ")[0];
  const subtitle =
    locale === "ar"
      ? "تابع أهم التحديثات والطلبات من مكان واحد"
      : "Track key updates and requests from one place";

  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {headingLabel}
      </p>
      <h1 className="text-2xl font-semibold tracking-tight">
        {greeting} {firstName}
      </h1>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}
