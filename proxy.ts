import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const isProduction = process.env.NODE_ENV === "production";

function tenantCookieOptions() {
  return { path: "/", sameSite: "strict" as const, secure: isProduction };
}

function isValidTenantSlug(value: string): boolean {
  return /^[a-z0-9-]{3,30}$/.test(value);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname === "/en/dashboard" ||
    pathname.startsWith("/en/dashboard/");

  const isSuperAdminPath =
    pathname.startsWith("/dashboard/super-admin") ||
    pathname.startsWith("/en/dashboard/super-admin");

  // For non-super-admin dashboard paths, auto-inject tenant cookie from JWT
  if (isDashboard && !isSuperAdminPath) {
    // Check if tenant cookie already set
    const existingTenant = request.cookies.get("taqam_tenant")?.value;
    if (!existingTenant || !isValidTenantSlug(existingTenant)) {
      // Read tenant slug from JWT session token
      const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
      const tenantSlug =
        typeof token?.tenant === "object" &&
        token.tenant !== null &&
        "slug" in token.tenant &&
        typeof (token.tenant as { slug: unknown }).slug === "string"
          ? (token.tenant as { slug: string }).slug
          : null;

      if (tenantSlug && isValidTenantSlug(tenantSlug)) {
        // Inject tenant cookie so dashboard can proceed without /select-tenant
        const res = NextResponse.next();
        res.cookies.set("taqam_tenant", tenantSlug, tenantCookieOptions());
        return res;
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"]
};
