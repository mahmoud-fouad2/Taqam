"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/logo-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { marketingNav } from "@/components/marketing/nav";
import { startLocaleTransition } from "@/components/locale-transition";

function getLocaleFromCookie(): "ar" | "en" {
  if (typeof document === "undefined") return "ar";
  const match = document.cookie.match(/(?:^|; )taqam_locale=([^;]+)/);
  return match?.[1] === "en" ? "en" : "ar";
}

export function MarketingHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [locale, setLocale] = React.useState<"ar" | "en">("ar");

  const isEnPrefix = pathname === "/en" || pathname.startsWith("/en/");
  const strippedPath = isEnPrefix ? (pathname.replace(/^\/en(?=\/|$)/, "") || "/") : pathname;

  React.useEffect(() => {
    setLocale(getLocaleFromCookie());
  }, []);

  const toggleLocale = () => {
    const next = locale === "ar" ? "en" : "ar";
    document.cookie = `taqam_locale=${next}; path=/; samesite=lax`;
    setLocale(next);

    // Use /en prefix for English URLs (Arabic stays unprefixed)
    const hasEnPrefix = pathname === "/en" || pathname.startsWith("/en/");
    const stripped = hasEnPrefix ? (pathname.replace(/^\/en(?=\/|$)/, "") || "/") : pathname;
    const target = next === "en" ? (stripped === "/" ? "/en" : `/en${stripped}`) : stripped;
    startLocaleTransition();
    router.push(target);
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <LogoMark frameClassName="rounded-lg p-0 dark:ring-white/10" imageClassName="h-9" />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {marketingNav.map((item) => {
            const href =
              locale === "en"
                ? item.href === "/"
                  ? "/en"
                  : `/en${item.href}`
                : item.href;

            const active = strippedPath === item.href;
            return (
              <Link
                key={item.href}
                href={href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground",
                  active && "bg-muted text-foreground"
                )}
              >
                {locale === "ar" ? item.labelAr : item.labelEn}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle variant="ghost" />
          <Button variant="ghost" size="sm" onClick={toggleLocale}>
            {locale === "ar" ? "English" : "العربية"}
          </Button>
          <Link href={locale === "en" ? "/en/login" : "/login"}>
            <Button variant="brandOutline" size="sm">
              {locale === "ar" ? "تسجيل الدخول" : "Login"}
            </Button>
          </Link>
          <Link href={locale === "en" ? "/en/request-demo" : "/request-demo"} className="hidden sm:block">
            <Button variant="brand" size="sm">{locale === "ar" ? "طلب عرض" : "Request demo"}</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
