"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";

type Locale = "ar" | "en";
type UiTheme = "shadcn" | "mantine";

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

export function TenantControls() {
  const [locale, setLocale] = useState<Locale>(() => {
    if (typeof document === "undefined") return "ar";
    const l = getCookie("taqam_locale");
    return l === "en" || l === "ar" ? l : "ar";
  });
  const [uiTheme, setUiTheme] = useState<UiTheme>(() => {
    if (typeof document === "undefined") return "shadcn";
    const t = getCookie("taqam_ui_theme");
    return t === "mantine" || t === "shadcn" ? t : "shadcn";
  });

  const toggleLocale = () => {
    const next: Locale = locale === "ar" ? "en" : "ar";
    setCookie("taqam_locale", next);
    window.location.reload();
  };

  const toggleUiTheme = () => {
    const next: UiTheme = uiTheme === "shadcn" ? "mantine" : "shadcn";
    setCookie("taqam_ui_theme", next);
    window.location.reload();
  };

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" onClick={toggleLocale}>
        {locale === "ar" ? "English" : "العربية"}
      </Button>
      <Button variant="outline" onClick={toggleUiTheme}>
        {uiTheme === "shadcn" ? "Mantine UI" : "shadcn/ui"}
      </Button>
    </div>
  );
}
