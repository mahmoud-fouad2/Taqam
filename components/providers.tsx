"use client";

import { ThemeProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "./ui/sonner";
import { LocaleTransitionOverlay } from "./locale-transition";
import { RouteProgress } from "./route-progress";
import { ConsoleNoiseGuard } from "./console-noise-guard";
import { AppDirectionProvider } from "./direction-context";
import { QueryProvider } from "./query-provider";

export default function Providers({
  children,
  dir,
}: {
  children: React.ReactNode;
  dir: "ltr" | "rtl";
}) {
  return (
    <SessionProvider>
      <QueryProvider>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          <AppDirectionProvider dir={dir}>
            {children}
            <ConsoleNoiseGuard />
            <RouteProgress />
            <LocaleTransitionOverlay />
            <Toaster />
          </AppDirectionProvider>
        </ThemeProvider>
      </QueryProvider>
    </SessionProvider>
  );
}
