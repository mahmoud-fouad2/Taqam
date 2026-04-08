"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { startLocaleTransition } from "@/components/locale-transition";

type Locale = "ar" | "en";

function setCookie(name: string, value: string) {
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
}

function getCookie(name: string): string | undefined {
  const match = document.cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${encodeURIComponent(name)}=`));
  if (!match) return undefined;
  return decodeURIComponent(match.split("=").slice(1).join("="));
}

/**
 * Pill toggle — AR on the left, EN on the right (always LTR layout),
 * with a sliding indicator that moves between the two sides.
 */
export function LocaleToggle({
  className,
  // variant kept for backward compat but ignored — pill style is always used
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  variant: _variant,
}: {
  className?: string;
  variant?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [locale, setLocale] = useState<Locale>(() => {
    if (typeof document === "undefined") return "ar";
    const l = getCookie("taqam_locale");
    return l === "en" || l === "ar" ? l : "ar";
  });

  const toggleLocale = () => {
    const next: Locale = locale === "ar" ? "en" : "ar";
    setCookie("taqam_locale", next);
    setLocale(next);

    const hasEnPrefix = pathname === "/en" || pathname.startsWith("/en/");
    const stripped = hasEnPrefix ? (pathname.replace(/^\/en(?=\/|$)/, "") || "/") : pathname;
    const target = next === "en" ? (stripped === "/" ? "/en" : `/en${stripped}`) : stripped;

    // Slide curtain in, then navigate once fully covered
    startLocaleTransition(() => router.push(target));
  };

  return (
    <button
      type="button"
      dir="ltr"
      onClick={toggleLocale}
      aria-label={locale === "ar" ? "Switch to English" : "التبديل للعربية"}
      className={cn(
        // Container — fixed LTR so AR is always on left, EN on right
        "relative inline-flex h-8 w-[72px] shrink-0 cursor-pointer items-center rounded-full",
        "bg-muted ring-1 ring-border/60 p-1",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className,
      )}
    >
      {/* Sliding pill indicator */}
      <span
        aria-hidden="true"
        className={cn(
          "absolute left-1 top-1 h-6 w-8 rounded-full bg-background shadow-sm ring-1 ring-border/40",
          "transition-transform duration-200 ease-in-out",
          locale === "ar" ? "translate-x-0" : "translate-x-8",
        )}
      />
      {/* AR label */}
      <span
        className={cn(
          "relative z-10 flex-1 select-none text-center text-[11px] font-bold tracking-wider",
          "transition-colors duration-200",
          locale === "ar" ? "text-foreground" : "text-muted-foreground/50",
        )}
      >
        AR
      </span>
      {/* EN label */}
      <span
        className={cn(
          "relative z-10 flex-1 select-none text-center text-[11px] font-bold tracking-wider",
          "transition-colors duration-200",
          locale === "en" ? "text-foreground" : "text-muted-foreground/50",
        )}
      >
        EN
      </span>
    </button>
  );
}
