"use client";

import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { startLocaleTransition } from "@/components/locale-transition";

type Locale = "ar" | "en";

function setCookie(name: string, value: string) {
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; path=/; SameSite=Lax`;
}

function getCookie(name: string): string | undefined {
  const match = document.cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${encodeURIComponent(name)}=`));
  if (!match) return undefined;
  return decodeURIComponent(match.split("=").slice(1).join("="));
}

export function LocaleToggle({ variant = "ghost" }: { variant?: "ghost" | "outline" }) {
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

    const hasEnPrefix = pathname === "/en" || pathname.startsWith("/en/");
    const stripped = hasEnPrefix ? (pathname.replace(/^\/en(?=\/|$)/, "") || "/") : pathname;
    const target = next === "en" ? (stripped === "/" ? "/en" : `/en${stripped}`) : stripped;

    startLocaleTransition();
    router.push(target);
  };

  return (
    <Button variant={variant} onClick={toggleLocale} className="gap-2">
      <Globe className="h-4 w-4" />
      {locale === "ar" ? "EN" : "AR"}
    </Button>
  );
}
