"use client";

import * as React from "react";

import type { AppLocale } from "./types";

const LocaleContext = React.createContext<AppLocale>("ar");

export function AppLocaleProvider({
  locale,
  children
}: {
  locale: AppLocale;
  children: React.ReactNode;
}) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useAppLocale(): AppLocale {
  return React.useContext(LocaleContext);
}
