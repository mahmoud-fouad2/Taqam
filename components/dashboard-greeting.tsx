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

  return (
    <div>
      <p className="text-sm font-medium text-muted-foreground">{greeting},</p>
      <h1 className="text-2xl font-bold tracking-tight">{firstName} 👋</h1>
    </div>
  );
}
