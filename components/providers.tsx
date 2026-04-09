"use client";

import { ThemeProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "./ui/sonner";
import { LocaleTransitionOverlay } from "./locale-transition";
import { RouteProgress } from "./route-progress";
import { ConsoleNoiseGuard } from "./console-noise-guard";
import { AppDirectionProvider } from "./direction-context";
import { QueryProvider } from "./query-provider";
import { AppLocaleProvider } from "@/lib/i18n/locale-context";
import type { AppLocale } from "@/lib/i18n/types";

export default function Providers({
  children,
  dir,
  locale,
}: {
  children: React.ReactNode;
  dir: "ltr" | "rtl";
  locale: AppLocale;
}) {
  return (
    <SessionProvider>
      <QueryProvider>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          <AppLocaleProvider locale={locale}>
            <AppDirectionProvider dir={dir}>
              {children}
              <ConsoleNoiseGuard />
              <RouteProgress />
              <LocaleTransitionOverlay />
              <Toaster />
            </AppDirectionProvider>
          </AppLocaleProvider>
        </ThemeProvider>
      </QueryProvider>
    </SessionProvider>
  );
}
