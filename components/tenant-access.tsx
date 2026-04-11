"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function isValidTenantSlug(value: string): boolean {
  return /^[a-z0-9-]{3,30}$/.test(value);
}

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

  const buildTenantUrl = (slug: string) => {
    const next = safeNextPath(nextPath) ?? "/dashboard";
    return `/t/${slug}${next}`;
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

    router.push(buildTenantUrl(value));
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
              onClick={() => router.push(buildTenantUrl(p.slug))}>
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
