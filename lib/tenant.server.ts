import "server-only";

import { cookies, headers } from "next/headers";

export interface TenantContext {
  slug: string | null;
  locale: "ar" | "en";
  theme: "shadcn" | "mantine";
}

/**
 * Get tenant context from request (server-side only)
 */
export async function getTenantContext(): Promise<TenantContext> {
  const cookieStore = await cookies();
  const headerStore = await headers();

  // Try header first (set by proxy), then fallback to cookie
  const slug =
    headerStore.get("x-tenant-slug") ||
    cookieStore.get("taqam_tenant")?.value ||
    null;

  const locale =
    (cookieStore.get("taqam_locale")?.value as "ar" | "en") || "ar";

  const theme =
    (cookieStore.get("taqam_ui_theme")?.value as "shadcn" | "mantine") ||
    "shadcn";

  return { slug, locale, theme };
}

/**
 * Check if we're in a tenant context
 */
export async function hasTenant(): Promise<boolean> {
  const { slug } = await getTenantContext();
  return slug !== null;
}

/**
 * Get tenant slug or throw if not in tenant context
 */
export async function requireTenant(): Promise<string> {
  const { slug } = await getTenantContext();
  if (!slug) {
    throw new Error("Tenant context required but not found");
  }
  return slug;
}
