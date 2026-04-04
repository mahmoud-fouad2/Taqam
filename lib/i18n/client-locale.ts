import type { AppLocale } from "./types";

export function getClientLocale(): AppLocale {
  if (typeof document === "undefined") return "ar";

  // Prefer cookie set by the locale toggle.
  const match = document.cookie.match(/(?:^|; )taqam_locale=([^;]+)/);
  const cookieLocale = match?.[1] === "en" ? "en" : match?.[1] === "ar" ? "ar" : undefined;
  if (cookieLocale) return cookieLocale;

  // Fallback to <html lang>.
  const lang = document.documentElement.lang;
  return lang === "en" ? "en" : "ar";
}
