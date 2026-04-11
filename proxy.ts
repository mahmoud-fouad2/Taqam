import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import {
  buildTenantPath,
  buildTenantUrl,
  isValidTenantSlug,
  isTenantBaseHost,
  resolveTenantDashboardRewrite,
  resolveTenantRequest
} from "@/lib/tenant";

const isProduction = process.env.NODE_ENV === "production";

function tenantCookieOptions() {
  return { path: "/", sameSite: "strict" as const, secure: isProduction };
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestHeaders = new Headers(request.headers);
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const resolvedTenant = resolveTenantRequest(pathname, host);
  const dashboardRewrite = resolveTenantDashboardRewrite(pathname);
  const effectivePathname = dashboardRewrite?.pathname ?? pathname;

  if (pathname === "/en/dashboard" || pathname.startsWith("/en/dashboard/")) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = pathname.replace(/^\/en(?=\/dashboard)/, "") || "/dashboard";

    const res = NextResponse.redirect(redirectUrl);
    res.cookies.set("taqam_locale", "en", {
      path: "/",
      sameSite: "lax",
      secure: isProduction
    });
    return res;
  }

  if (resolvedTenant.source === "subdomain" && resolvedTenant.slug) {
    const publicCareersMatch = pathname.match(/^\/(en\/)?careers$/);

    if (publicCareersMatch) {
      const rewriteUrl = request.nextUrl.clone();
      rewriteUrl.pathname = buildTenantPath(
        resolvedTenant.slug,
        "/careers",
        publicCareersMatch[1] ? "en" : "ar"
      );

      const rewriteResponse = NextResponse.rewrite(rewriteUrl, {
        request: {
          headers: requestHeaders
        }
      });
      rewriteResponse.cookies.set("taqam_tenant", resolvedTenant.slug, tenantCookieOptions());
      return rewriteResponse;
    }
  }

  // Skip static assets and API routes
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/fonts/") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const isDashboard =
    effectivePathname === "/dashboard" ||
    effectivePathname.startsWith("/dashboard/") ||
    effectivePathname === "/en/dashboard" ||
    effectivePathname.startsWith("/en/dashboard/");

  const isSuperAdminPath =
    effectivePathname.startsWith("/dashboard/super-admin") ||
    effectivePathname.startsWith("/en/dashboard/super-admin");

  const existingTenant = request.cookies.get("taqam_tenant")?.value;
  let tenantSlug = resolvedTenant.slug;

  if (tenantSlug) {
    requestHeaders.set("x-tenant-slug", tenantSlug);
    requestHeaders.set("x-tenant-source", resolvedTenant.source);
  }

  // For non-super-admin dashboard paths, auto-inject tenant cookie from JWT
  if (isDashboard && !isSuperAdminPath) {
    // If there is no tenant from host/path, fallback to cookie/JWT for current production behavior.
    if (!tenantSlug && (!existingTenant || !isValidTenantSlug(existingTenant))) {
      // Read tenant slug from JWT session token
      const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
      tenantSlug =
        typeof token?.tenant === "object" &&
        token.tenant !== null &&
        "slug" in token.tenant &&
        typeof (token.tenant as { slug: unknown }).slug === "string"
          ? (token.tenant as { slug: string }).slug
          : null;

      if (tenantSlug && isValidTenantSlug(tenantSlug)) {
        requestHeaders.set("x-tenant-slug", tenantSlug);
        requestHeaders.set("x-tenant-source", "jwt");
      }
    }
  }

  const shouldCanonicalizeDashboard =
    tenantSlug &&
    isDashboard &&
    !isSuperAdminPath &&
    (request.method === "GET" || request.method === "HEAD") &&
    (resolvedTenant.source === "path" ||
      (resolvedTenant.source === "none" && host && isTenantBaseHost(host)));

  if (shouldCanonicalizeDashboard && tenantSlug) {
    const canonicalTenantSlug: string = tenantSlug;
    const canonicalTarget = new URL(
      buildTenantUrl(canonicalTenantSlug, effectivePathname, host || undefined)
    );
    canonicalTarget.search = request.nextUrl.search;

    if (canonicalTarget.toString() !== request.nextUrl.toString()) {
      const redirectResponse = NextResponse.redirect(canonicalTarget);

      if (canonicalTenantSlug !== existingTenant) {
        redirectResponse.cookies.set("taqam_tenant", canonicalTenantSlug, tenantCookieOptions());
      }

      return redirectResponse;
    }
  }

  const response = dashboardRewrite
    ? NextResponse.rewrite(
        (() => {
          const rewriteUrl = request.nextUrl.clone();
          rewriteUrl.pathname = dashboardRewrite.pathname;
          return rewriteUrl;
        })(),
        {
          request: {
            headers: requestHeaders
          }
        }
      )
    : NextResponse.next({
        request: {
          headers: requestHeaders
        }
      });

  if (dashboardRewrite?.locale === "en") {
    response.cookies.set("taqam_locale", "en", {
      path: "/",
      sameSite: "lax",
      secure: isProduction
    });
  }

  if (tenantSlug && tenantSlug !== existingTenant) {
    response.cookies.set("taqam_tenant", tenantSlug, tenantCookieOptions());
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"]
};
