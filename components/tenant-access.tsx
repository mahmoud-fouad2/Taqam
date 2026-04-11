"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { buildTenantUrl, isValidTenantSlug } from "@/lib/tenant";

function safeNextPath(value: string | undefined): string | undefined {
  if (!value) return undefined;
  if (!value.startsWith("/")) return undefined;
  if (value.startsWith("//")) return undefined;
  return value;
}

type TenantPreset = {
  slug: string;
  labelAr: string;
  labelEn: string;
};

export function TenantAccess({
  nextPath,
  locale = "ar",
  presets
}: {
  nextPath?: string;
  locale?: "ar" | "en";
  presets?: TenantPreset[];
}) {
  const router = useRouter();
  const [tenant, setTenant] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const navigateToTenant = (slug: string) => {
    const next = safeNextPath(nextPath) ?? "/dashboard";
    const target = buildTenantUrl(slug, next);
    const targetUrl = new URL(target, window.location.origin);

    if (targetUrl.origin === window.location.origin) {
      router.push(`${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`);
      return;
    }

    window.location.assign(targetUrl.toString());
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = tenant.trim().toLowerCase();
    if (!isValidTenantSlug(value)) {
      setError(
        locale === "ar"
          ? "اكتب اسم الشركة (slug) بحروف صغيرة/أرقام/شرطة فقط"
          : "Enter a valid tenant slug (lowercase letters, numbers, and hyphens only)."
      );
      return;
    }
    setError(null);

    navigateToTenant(value);
  };

  return (
    <div className="w-full space-y-3">
      {presets?.length ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground text-xs">
            {locale === "ar" ? "اختيار سريع:" : "Quick pick:"}
          </span>
          {presets.map((p) => (
            <Button
              key={p.slug}
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => navigateToTenant(p.slug)}>
              {locale === "ar" ? p.labelAr : p.labelEn}
            </Button>
          ))}
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          value={tenant}
          onChange={(e) => setTenant(e.target.value)}
          placeholder={locale === "ar" ? "مثال: demo" : "Example: demo"}
          className="sm:w-64"
          aria-label="Tenant slug"
        />
        <Button type="submit">{locale === "ar" ? "الدخول للداشبورد" : "Go to dashboard"}</Button>
        {error ? <p className="text-destructive text-sm">{error}</p> : null}
      </form>
    </div>
  );
}
