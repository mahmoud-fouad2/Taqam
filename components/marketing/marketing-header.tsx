"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ChevronDown, Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/logo-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { LocaleToggle } from "@/components/locale-toggle";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { marketingNav } from "@/components/marketing/nav";

function getLocaleFromCookie(): "ar" | "en" {
  if (typeof document === "undefined") return "ar";
  const match = document.cookie.match(/(?:^|; )taqam_locale=([^;]+)/);
  return match?.[1] === "en" ? "en" : "ar";
}

export function MarketingHeader({ initialLocale = "ar" }: { initialLocale?: "ar" | "en" }) {
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();
  const [locale, setLocale] = React.useState<"ar" | "en">(initialLocale);
  const [openDropdown, setOpenDropdown] = React.useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const desktopNavRef = React.useRef<HTMLDivElement | null>(null);
  const closeTimerRef = React.useRef<number | null>(null);

  const isEnPrefix = pathname === "/en" || pathname.startsWith("/en/");
  const strippedPath = isEnPrefix ? pathname.replace(/^\/en(?=\/|$)/, "") || "/" : pathname;

  React.useEffect(() => {
    setLocale(getLocaleFromCookie());
  }, []);

  React.useEffect(() => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setOpenDropdown(null);
    setMobileOpen(false);
  }, [pathname]);

  React.useEffect(
    () => () => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
      }
    },
    []
  );

  const stripHash = (href: string) => href.split("#")[0] || "/";

  const localeHref = (href: string) =>
    locale === "en" ? (href === "/" ? "/en" : `/en${href}`) : href;

  const isItemActive = (href: string) => strippedPath === stripHash(href);

  const isDropdownActive = (href: string) => {
    if (href === "/") return strippedPath === "/";
    return strippedPath === href || strippedPath.startsWith(href + "/");
  };

  const expandedItem = marketingNav.find((item) => item.href === openDropdown && item.sections);

  const clearCloseTimer = React.useCallback(() => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const openMenu = React.useCallback(
    (href: string) => {
      clearCloseTimer();
      setOpenDropdown(href);
    },
    [clearCloseTimer]
  );

  const scheduleClose = React.useCallback(() => {
    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => {
      setOpenDropdown(null);
      closeTimerRef.current = null;
    }, 180);
  }, [clearCloseTimer]);

  const closeMenus = React.useCallback(() => {
    clearCloseTimer();
    setOpenDropdown(null);
    setMobileOpen(false);
  }, [clearCloseTimer]);

  React.useEffect(() => {
    if (!openDropdown) return;

    const handlePointerMove = (event: PointerEvent) => {
      const navRoot = desktopNavRef.current;

      if (!navRoot) return;

      if (event.target instanceof Node && navRoot.contains(event.target)) {
        clearCloseTimer();
        return;
      }

      scheduleClose();
    };

    const handlePointerDown = (event: PointerEvent) => {
      const navRoot = desktopNavRef.current;

      if (!navRoot) return;

      if (!(event.target instanceof Node) || !navRoot.contains(event.target)) {
        closeMenus();
      }
    };

    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [clearCloseTimer, closeMenus, openDropdown, scheduleClose]);

  return (
    <header className="bg-background/90 border-border/50 sticky top-0 z-50 border-b backdrop-blur-xl">
      <div className="mx-auto w-full max-w-[96rem] px-4 py-3 sm:px-6 lg:px-8">
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 lg:gap-5">
          <Link href={localeHref("/")} className="flex items-center gap-2">
            <LogoMark
              frameClassName="rounded-[1rem] p-0 dark:ring-white/10"
              imageClassName="h-9"
              darkImageClassName="h-[2.65rem]"
              priority
              loading="eager"
            />
          </Link>

          <div className="hidden justify-center md:flex">
            <div
              ref={desktopNavRef}
              className="relative"
              onMouseEnter={clearCloseTimer}
              onMouseLeave={scheduleClose}
              onBlurCapture={(event) => {
                const nextFocused = event.relatedTarget;

                if (!(nextFocused instanceof Node) || !event.currentTarget.contains(nextFocused)) {
                  scheduleClose();
                }
              }}
              onKeyDown={(event) => {
                if (event.key === "Escape") closeMenus();
              }}>
              <nav className="border-border/60 bg-background/80 inline-flex items-center gap-1 rounded-full border p-1 shadow-[0_10px_32px_rgba(15,23,42,0.06)] backdrop-blur-xl">
                {marketingNav.map((item) => {
                  const active = isDropdownActive(item.href);

                  if (item.sections) {
                    return (
                      <button
                        key={item.href}
                        type="button"
                        onMouseEnter={() => openMenu(item.href)}
                        onFocus={() => openMenu(item.href)}
                        aria-haspopup="menu"
                        className={cn(
                          "text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition",
                          active && "bg-accent text-foreground shadow-sm"
                        )}>
                        {locale === "ar" ? item.labelAr : item.labelEn}
                        <ChevronDown
                          className={cn(
                            "size-3.5 transition-transform duration-200",
                            openDropdown === item.href && "rotate-180"
                          )}
                        />
                      </button>
                    );
                  }

                  return (
                    <Link
                      key={item.href}
                      href={localeHref(item.href)}
                      className={cn(
                        "text-muted-foreground hover:text-foreground rounded-full px-4 py-2 text-sm font-medium transition",
                        active && "bg-accent text-foreground shadow-sm"
                      )}>
                      {locale === "ar" ? item.labelAr : item.labelEn}
                    </Link>
                  );
                })}
              </nav>

              <AnimatePresence initial={false} mode="wait">
                {expandedItem?.sections && expandedItem.spotlight ? (
                  <motion.div
                    key={expandedItem.href}
                    initial={
                      shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.98 }
                    }
                    animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
                    exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.985 }}
                    transition={
                      shouldReduceMotion
                        ? { duration: 0.12 }
                        : { duration: 0.18, ease: [0.22, 1, 0.36, 1] }
                    }
                    className="absolute top-full left-1/2 z-50 mt-3 w-[min(58rem,calc(100vw-2rem))] -translate-x-1/2 px-1">
                    <div className="border-border/70 bg-background/95 grid gap-3 rounded-[2rem] border p-3 shadow-[0_28px_80px_rgba(15,23,42,0.14)] backdrop-blur-2xl lg:grid-cols-[minmax(0,0.84fr)_minmax(0,1.16fr)]">
                      <div className="flex flex-col justify-between rounded-[1.6rem] border border-sky-100/70 bg-gradient-to-br from-sky-500/10 via-cyan-500/5 to-amber-400/15 p-5 dark:border-sky-900/40 dark:from-sky-950/30 dark:via-transparent dark:to-amber-950/20">
                        <div>
                          <span className="bg-background/80 text-foreground border-border/60 inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold tracking-[0.14em]">
                            {locale === "ar"
                              ? expandedItem.spotlight.badgeAr
                              : expandedItem.spotlight.badgeEn}
                          </span>
                          <h3 className="mt-4 text-xl leading-8 font-bold">
                            {locale === "ar"
                              ? expandedItem.spotlight.titleAr
                              : expandedItem.spotlight.titleEn}
                          </h3>
                          <p className="text-muted-foreground mt-3 text-sm leading-7">
                            {locale === "ar"
                              ? expandedItem.spotlight.descAr
                              : expandedItem.spotlight.descEn}
                          </p>
                        </div>

                        <div className="mt-5 space-y-4">
                          <div className="flex flex-wrap gap-2">
                            {(locale === "ar"
                              ? expandedItem.spotlight.tagsAr
                              : expandedItem.spotlight.tagsEn
                            ).map((tag) => (
                              <span
                                key={tag}
                                className="bg-background/85 text-muted-foreground border-border/60 inline-flex rounded-full border px-3 py-1 text-xs">
                                {tag}
                              </span>
                            ))}
                          </div>

                          <Link href={localeHref(expandedItem.spotlight.href)} onClick={closeMenus}>
                            <Button
                              variant="brand"
                              className="h-11 rounded-xl px-5 text-sm font-semibold">
                              {locale === "ar"
                                ? expandedItem.spotlight.ctaAr
                                : expandedItem.spotlight.ctaEn}
                              <ArrowLeft className="size-4 rtl:rotate-180" />
                            </Button>
                          </Link>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        {expandedItem.sections.map((section) => (
                          <div
                            key={section.titleEn}
                            className="border-border/60 bg-background/72 rounded-[1.5rem] border p-3.5">
                            <p className="text-muted-foreground mb-2 px-1 text-[11px] font-semibold tracking-[0.18em] uppercase">
                              {locale === "ar" ? section.titleAr : section.titleEn}
                            </p>
                            <div className="space-y-1.5">
                              {section.items.map((child) => {
                                const activeChild = strippedPath === child.href;
                                const Icon = child.icon;

                                return (
                                  <Link
                                    key={`${section.titleEn}-${child.href}-${child.labelEn}`}
                                    href={localeHref(child.href)}
                                    className={cn(
                                      "hover:bg-accent/70 hover:border-border/80 group flex items-start gap-3 rounded-[1.1rem] border border-transparent px-3 py-3 transition-all duration-200",
                                      activeChild && "bg-accent/70 border-border/70"
                                    )}
                                    onClick={closeMenus}>
                                    <span className="inline-flex rounded-xl bg-sky-50 p-2 text-sky-700 dark:bg-sky-950/40 dark:text-sky-200">
                                      <Icon className="size-4" />
                                    </span>
                                    <span className="flex min-w-0 flex-col">
                                      <span className="text-sm font-semibold">
                                        {locale === "ar" ? child.labelAr : child.labelEn}
                                      </span>
                                      <span className="text-muted-foreground text-xs leading-5">
                                        {locale === "ar" ? child.descAr : child.descEn}
                                      </span>
                                    </span>
                                  </Link>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <div className="hidden items-center gap-2 md:flex">
              <ThemeToggle variant="ghost" />
              <LocaleToggle initialLocale={initialLocale} />
              <Link href={localeHref("/login")}>
                <Button variant="brandOutline" size="sm" className="rounded-full px-4">
                  {locale === "ar" ? "تسجيل الدخول" : "Login"}
                </Button>
              </Link>
              <Link href={localeHref("/request-demo")}>
                <Button variant="brand" size="sm" className="rounded-full px-4">
                  {locale === "ar" ? "طلب عرض" : "Request demo"}
                </Button>
              </Link>
            </div>

            <div className="flex items-center gap-1.5 md:hidden">
              <ThemeToggle variant="ghost" />
              <LocaleToggle initialLocale={initialLocale} />
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon-sm" className="rounded-full">
                    <Menu className="size-4" />
                    <span className="sr-only">{locale === "ar" ? "فتح القائمة" : "Open menu"}</span>
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side={locale === "ar" ? "right" : "left"}
                  className="w-[88vw] max-w-sm gap-0 p-0 sm:max-w-sm">
                  <SheetHeader className="border-border/60 border-b px-5 py-5">
                    <div className="flex items-center gap-3">
                      <LogoMark
                        frameClassName="size-11 rounded-[1rem] p-0 dark:ring-white/10"
                        imageClassName="h-6"
                        darkImageClassName="h-7"
                      />
                      <div>
                        <SheetTitle>
                          {locale === "ar" ? "تنقّل داخل طاقم" : "Navigate Taqam"}
                        </SheetTitle>
                        <SheetDescription>
                          {locale === "ar"
                            ? "مسارات أوضح للمنتج والباقات والموارد والوظائف من قائمة واحدة مرتبة."
                            : "A clearer menu that gets you to product, plans, resources, and careers faster."}
                        </SheetDescription>
                      </div>
                    </div>
                  </SheetHeader>

                  <div className="flex-1 overflow-y-auto px-5 py-4">
                    <div className="space-y-2">
                      {marketingNav
                        .filter((item) => !item.sections)
                        .map((item) => (
                          <Link
                            key={item.href}
                            href={localeHref(item.href)}
                            className={cn(
                              "border-border/60 bg-background/70 hover:border-border hover:bg-accent/50 block rounded-[1.1rem] border px-4 py-3 text-sm font-medium transition",
                              isItemActive(item.href) && "bg-accent border-border text-foreground"
                            )}
                            onClick={closeMenus}>
                            {locale === "ar" ? item.labelAr : item.labelEn}
                          </Link>
                        ))}
                    </div>

                    <Accordion type="single" collapsible className="mt-4 w-full">
                      {marketingNav
                        .filter((item) => item.sections)
                        .map((item) => (
                          <AccordionItem key={item.href} value={item.href}>
                            <AccordionTrigger className="py-3 text-base font-semibold hover:no-underline">
                              {locale === "ar" ? item.labelAr : item.labelEn}
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-3">
                                {item.sections?.map((section) => (
                                  <div
                                    key={`${item.href}-${section.titleEn}`}
                                    className="space-y-1.5">
                                    <p className="text-muted-foreground px-1 text-[11px] font-semibold tracking-[0.18em] uppercase">
                                      {locale === "ar" ? section.titleAr : section.titleEn}
                                    </p>
                                    {section.items.map((child) => {
                                      const Icon = child.icon;

                                      return (
                                        <Link
                                          key={`${section.titleEn}-${child.href}-${child.labelEn}`}
                                          href={localeHref(child.href)}
                                          className="hover:bg-accent/50 flex items-start gap-3 rounded-[1rem] px-3 py-3 transition"
                                          onClick={closeMenus}>
                                          <span className="inline-flex rounded-xl bg-sky-50 p-2 text-sky-700 dark:bg-sky-950/40 dark:text-sky-200">
                                            <Icon className="size-4" />
                                          </span>
                                          <span className="flex min-w-0 flex-col">
                                            <span className="text-sm font-semibold">
                                              {locale === "ar" ? child.labelAr : child.labelEn}
                                            </span>
                                            <span className="text-muted-foreground text-xs leading-5">
                                              {locale === "ar" ? child.descAr : child.descEn}
                                            </span>
                                          </span>
                                        </Link>
                                      );
                                    })}
                                  </div>
                                ))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                    </Accordion>
                  </div>

                  <div className="border-border/60 border-t p-5">
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <Link href={localeHref("/login")} onClick={closeMenus}>
                        <Button variant="brandOutline" className="w-full rounded-xl">
                          {locale === "ar" ? "تسجيل الدخول" : "Login"}
                        </Button>
                      </Link>
                      <Link href={localeHref("/request-demo")} onClick={closeMenus}>
                        <Button variant="brand" className="w-full rounded-xl">
                          {locale === "ar" ? "طلب عرض" : "Request demo"}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
