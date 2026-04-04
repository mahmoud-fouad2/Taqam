import { cookies, headers } from "next/headers";

import type { AppLocale } from "./types";

export async function getAppLocale(): Promise<AppLocale> {
  const headerStore = await headers();
  const headerLocale = headerStore.get("x-taqam-locale");
  if (headerLocale === "en" || headerLocale === "ar") {
    return headerLocale;
  }

  const cookieStore = await cookies();
  const value = cookieStore.get("taqam_locale")?.value;
  return value === "en" ? "en" : "ar";
}

export function isRtl(locale: AppLocale): boolean {
  return locale === "ar";
}
