import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

import { isSuperAdminRole } from "@/lib/access-control";

const DEFAULT_LOCALE = "ar";
const DEFAULT_UI_THEME = "shadcn";

const RESERVED_SUBDOMAINS = new Set(["www", "admin", "app", "api"]);

const isProduction = process.env.NODE_ENV === "production";

function sharedCookieOptions() {
  return { path: "/", sameSite: "lax" as const, secure: isProduction };
}

function tenantCookieOptions() {
  return { path: "/", sameSite: "strict" as const, secure: isProduction };
}

function isValidTenantSlug(value: string): boolean {
  return /^[a-z0-9-]{3,30}$/.test(value);
}

function safeNextPath(value: string | null): string | null {
  if (!value) return null;
  if (!value.startsWith("/")) return null;
  if (value.startsWith("//")) return null;
  return value;
}

function stripPort(host: string): string {
  const idx = host.indexOf(":");
  return idx === -1 ? host : host.slice(0, idx);
}

function getTenantSlugFromHost(host: string, baseDomain: string): string | null {
  const cleanHost = stripPort(host).toLowerCase();

  // Local dev: tenant.localhost
  if (cleanHost.endsWith(".localhost")) {
    const sub = cleanHost.slice(0, -".localhost".length);
    if (!sub || RESERVED_SUBDOMAINS.has(sub)) return null;
    return sub;
  }

  // Production: tenant.<baseDomain>
  const bd = baseDomain.toLowerCase();
  if (bd && cleanHost.endsWith(`.${bd}`)) {
    const sub = cleanHost.slice(0, -(bd.length + 1));
    if (!sub || RESERVED_SUBDOMAINS.has(sub)) return null;
    return sub;
  }

  return null;
}

function stripLocalePrefix(pathname: string): string {
  return pathname.replace(/^\/(en|ar)(?=\/|$)/, "") || "/";
}

function withLocalePrefix(pathname: string, localePrefix: string): string {
  if (!localePrefix || pathname === "/") {
    return localePrefix || pathname;
  }

  return `${localePrefix}${pathname}`;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const strippedPathname = stripLocalePrefix(pathname);
  const isEnPrefix = pathname === "/en" || pathname.startsWith("/en/");
  const isArPrefix = pathname === "/ar" || pathname.startsWith("/ar/");
  const localePrefix = isEnPrefix ? "/en" : isArPrefix ? "/ar" : "";
  const host = request.headers.get("host") ?? "";
  const baseDomain = process.env.TAQAM_BASE_DOMAIN ?? "";
  const tenantSlug = getTenantSlugFromHost(host, baseDomain);
  const tenantCookie = request.cookies.get("taqam_tenant")?.value ?? null;
  const effectiveTenant = tenantSlug || tenantCookie;

  const isDashboard = strippedPathname.startsWith("/dashboard");
  const isSuperAdmin = strippedPathname.startsWith("/dashboard/super-admin");
  const isSharedDashboardPath =
    strippedPathname.startsWith("/dashboard/my-profile") ||
    strippedPathname.startsWith("/dashboard/notifications") ||
    strippedPathname.startsWith("/dashboard/account") ||
    strippedPathname.startsWith("/dashboard/help-center") ||
    strippedPathname.startsWith("/dashboard/support");
  const requestedDashboardPath = strippedPathname + (request.nextUrl.search ? request.nextUrl.search : "");

  if (isDashboard) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const role = typeof token?.role === "string" ? token.role : undefined;

    if (isSuperAdminRole(role) && !isSuperAdmin && !isSharedDashboardPath) {
      const url = request.nextUrl.clone();
      url.pathname = withLocalePrefix("/dashboard/super-admin", localePrefix);
      url.searchParams.set("from", requestedDashboardPath);
      return NextResponse.redirect(url);
    }
  }

  // Allow selecting tenant on non-subdomain hosts via path: /t/<tenantSlug>[/nextPath]
  // Useful for Render default domain without custom DNS.
  if (pathname === "/t" || pathname.startsWith("/t/")) {
    // Bare /t should go to the selection page
    if (pathname === "/t" || pathname === "/t/") {
      const url = request.nextUrl.clone();
      url.pathname = "/select-tenant";
      // Preserve any next query (safeNextPath validation happens on the page)
      return NextResponse.redirect(url);
    }

    const rest = pathname.slice("/t".length); // "" | "/slug" | "/slug/anything"
    const parts = rest.split("/").filter(Boolean);
    const slug = parts[0] ?? "";
    if (slug && isValidTenantSlug(slug)) {
      const nextPathFromQuery = safeNextPath(request.nextUrl.searchParams.get("next"));
      const nextPathFromPath = parts.length > 1 ? `/${parts.slice(1).join("/")}` : null;

      // If caller used the old style (/t/<slug>?next=/dashboard/...) redirect to canonical
      // URL that keeps the tenant in the path for shareable links on Render.
      if (nextPathFromQuery) {
        const canonical = request.nextUrl.clone();
        canonical.pathname = `/t/${slug}${nextPathFromQuery}`;
        canonical.searchParams.delete("next");

        const res = NextResponse.redirect(canonical);
        res.cookies.set("taqam_tenant", slug, tenantCookieOptions());
        res.headers.set("x-tenant-slug", slug);
        return res;
      }

      // Public-facing App Router pages under /t/[slug]/ must NOT be rewritten —
      // they have their own page.tsx files and need the slug from URL params.
      const PUBLIC_TENANT_PATHNAMES = ["/careers"];
      const isPublicTenantPath =
        nextPathFromPath !== null &&
        PUBLIC_TENANT_PATHNAMES.some(
          (p) => nextPathFromPath === p || nextPathFromPath.startsWith(`${p}/`)
        );

      if (isPublicTenantPath) {
        const nextHeaders = new Headers(request.headers);
        nextHeaders.set("x-tenant-slug", slug);
        const res = NextResponse.next({ request: { headers: nextHeaders } });
        res.cookies.set("taqam_tenant", slug, tenantCookieOptions());
        res.headers.set("x-tenant-slug", slug);
        return res;
      }

      // Rewrite internally while keeping the /t/<slug>/... URL in the browser.
      const targetPath = nextPathFromPath ?? "/dashboard";
      const url = request.nextUrl.clone();
      url.pathname = targetPath;

      const nextHeaders = new Headers(request.headers);
      nextHeaders.set("x-tenant-slug", slug);

      const res = NextResponse.rewrite(url, { request: { headers: nextHeaders } });
      res.cookies.set("taqam_tenant", slug, tenantCookieOptions());
      res.headers.set("x-tenant-slug", slug);
      return res;
    }

    // Invalid slug: send to selection UI
    const fallback = request.nextUrl.clone();
    fallback.pathname = "/select-tenant";
    return NextResponse.redirect(fallback);
  }

  // Locale prefixes: keep Arabic default, support /en (and /ar) for clean URLs.
  // We rewrite internally to the non-prefixed path but pass locale via request header
  // so server components/rendering pick the correct language on the same request.
  if (isEnPrefix || isArPrefix) {
    const locale = isEnPrefix ? "en" : "ar";
    const stripped = strippedPathname;

    const url = request.nextUrl.clone();
    url.pathname = stripped;

    const nextHeaders = new Headers(request.headers);
    nextHeaders.set("x-taqam-locale", locale);

    const res = NextResponse.rewrite(url, { request: { headers: nextHeaders } });
    res.cookies.set("taqam_locale", locale, sharedCookieOptions());
    return res;
  }

  // Allow setting locale via query param (for SEO hreflang links)
  const lang = request.nextUrl.searchParams.get("lang");
  if (lang === "ar" || lang === "en") {
    const nextPath =
      safeNextPath(request.nextUrl.searchParams.get("next")) ??
      (pathname + (request.nextUrl.search ? request.nextUrl.search : ""));

    const url = new URL(nextPath, request.url);
    url.searchParams.delete("lang");
    url.searchParams.delete("next");

    const res = NextResponse.redirect(url);
    res.cookies.set("taqam_locale", lang, sharedCookieOptions());
    return res;
  }

  // Allow selecting tenant on non-subdomain hosts (e.g. Render) via query param
  const tenantFromQuery = request.nextUrl.searchParams.get("tenant");
  if (tenantFromQuery && isValidTenantSlug(tenantFromQuery)) {
    const nextPath = safeNextPath(request.nextUrl.searchParams.get("next")) ?? "/dashboard";
    const url = new URL(nextPath, request.url);
    const res = NextResponse.redirect(url);
    res.cookies.set("taqam_tenant", tenantFromQuery, tenantCookieOptions());
    res.headers.set("x-tenant-slug", tenantFromQuery);
    return res;
  }

  // Dashboard needs tenant context (except super-admin area)
  const isTenantOptionalDashboardPath = isSharedDashboardPath;

  // Root should always render the marketing landing page
  if (strippedPathname === "/" && !localePrefix) {
    return NextResponse.next();
  }

  // Enforce tenant context for dashboard (except super-admin)
  if (isDashboard && !isSuperAdmin && !isTenantOptionalDashboardPath && !effectiveTenant) {
    // Allow localhost/IP for dev
    const cleanHost = stripPort(host).toLowerCase();
    const isLocalDev = cleanHost === "localhost" || /^[0-9.]+$/.test(cleanHost);
    if (!isLocalDev) {
      const url = request.nextUrl.clone();
      url.pathname = withLocalePrefix("/select-tenant", localePrefix);
      url.searchParams.set("next", requestedDashboardPath);
      return NextResponse.redirect(url);
    }
  }

  const res = NextResponse.next();

  if (!request.cookies.get("taqam_locale")?.value) {
    res.cookies.set("taqam_locale", DEFAULT_LOCALE, sharedCookieOptions());
  }

  if (!request.cookies.get("taqam_ui_theme")?.value) {
    res.cookies.set("taqam_ui_theme", DEFAULT_UI_THEME, sharedCookieOptions());
  }

  if (effectiveTenant) {
    res.headers.set("x-tenant-slug", effectiveTenant);
    // Keep cookie in sync even when tenant comes from subdomain
    res.cookies.set("taqam_tenant", effectiveTenant, tenantCookieOptions());
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|css|js|map)$).*)"
  ]
};
