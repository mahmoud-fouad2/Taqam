"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/logo-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { LocaleToggle } from "@/components/locale-toggle";
import { cn } from "@/lib/utils";
import { marketingNav } from "@/components/marketing/nav";

function getLocaleFromCookie(): "ar" | "en" {
  if (typeof document === "undefined") return "ar";
  const match = document.cookie.match(/(?:^|; )taqam_locale=([^;]+)/);
  return match?.[1] === "en" ? "en" : "ar";
}

export function MarketingHeader() {
  const pathname = usePathname();
  const [locale, setLocale] = React.useState<"ar" | "en">("ar");
  const [openDropdown, setOpenDropdown] = React.useState<string | null>(null);

  const isEnPrefix = pathname === "/en" || pathname.startsWith("/en/");
  const strippedPath = isEnPrefix ? (pathname.replace(/^\/en(?=\/|$)/, "") || "/") : pathname;

  React.useEffect(() => {
    setLocale(getLocaleFromCookie());
  }, []);

  const localeHref = (href: string) =>
    locale === "en" ? (href === "/" ? "/en" : `/en${href}`) : href;

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <LogoMark frameClassName="rounded-lg p-0 dark:ring-white/10" imageClassName="h-9" />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {marketingNav.map((item) => {
            const active = strippedPath === item.href ||
              (item.children?.some((c) => strippedPath === c.href) ?? false);

            if (item.children) {
              return (
                <div
                  key={item.href}
                  className="relative"
                  onMouseEnter={() => setOpenDropdown(item.href)}
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  <button
                    className={cn(
                      "flex items-center gap-1 rounded-md px-3 py-2 text-sm text-muted-foreground transition hover:text-foreground",
                      active && "bg-muted text-foreground",
                    )}
                  >
                    {locale === "ar" ? item.labelAr : item.labelEn}
                    <ChevronDown
                      className={cn(
                        "h-3.5 w-3.5 transition-transform",
                        openDropdown === item.href && "rotate-180",
                      )}
                    />
                  </button>

                  {openDropdown === item.href && (
                    <div className="absolute start-0 top-full z-50 mt-1 w-64 overflow-hidden rounded-xl border bg-popover shadow-lg">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={localeHref(child.href)}
                          className={cn(
                            "flex flex-col gap-0.5 px-4 py-3 text-sm transition hover:bg-accent",
                            strippedPath === child.href && "bg-accent",
                          )}
                          onClick={() => setOpenDropdown(null)}
                        >
                          <span className="font-medium leading-none">
                            {locale === "ar" ? child.labelAr : child.labelEn}
                          </span>
                          {(child.descAr ?? child.descEn) && (
                            <span className="text-xs text-muted-foreground">
                              {locale === "ar" ? child.descAr : child.descEn}
                            </span>
                          )}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={localeHref(item.href)}
                className={cn(
                  "rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground",
                  active && "bg-muted text-foreground",
                )}
              >
                {locale === "ar" ? item.labelAr : item.labelEn}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle variant="ghost" />
          <LocaleToggle />
          <Link href={localeHref("/login")}>
            <Button variant="brandOutline" size="sm">
              {locale === "ar" ? "تسجيل الدخول" : "Login"}
            </Button>
          </Link>
          <Link href={localeHref("/request-demo")} className="hidden sm:block">
            <Button variant="brand" size="sm">{locale === "ar" ? "طلب عرض" : "Request demo"}</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
