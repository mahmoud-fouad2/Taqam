/**
 * Taqam Multi-Tenant Utilities
 *
 * وظائف مساعدة للتعامل مع الـ Multi-tenancy
 */

const RESERVED_SUBDOMAINS = new Set(["www", "admin", "app", "api"]);

export type TenantPathLocale = "ar" | "en";

export type TenantUrlTarget = {
  slug: string;
  domain?: string | null;
};

export type TenantResolutionSource = "subdomain" | "path" | "none";

export type TenantResolution = {
  slug: string | null;
  source: TenantResolutionSource;
};

export type TenantDashboardRewrite = {
  slug: string;
  pathname: string;
  locale: "ar" | "en";
};

export function isValidTenantSlug(value: string): boolean {
  return /^[a-z0-9-]{3,30}$/.test(value);
}

export function isReservedSubdomain(value: string): boolean {
  return RESERVED_SUBDOMAINS.has(value.toLowerCase());
}

function normalizeTenantSlug(value: string | null | undefined): string | null {
  if (!value) return null;

  const slug = value.trim().toLowerCase();
  if (!isValidTenantSlug(slug) || isReservedSubdomain(slug)) {
    return null;
  }

  return slug;
}

function normalizePath(pathname: string): string {
  if (!pathname.startsWith("/")) return `/${pathname}`;
  return pathname;
}

function localizePath(pathname: string, locale: TenantPathLocale = "ar"): string {
  const normalizedPath = normalizePath(pathname);

  if (locale !== "en") {
    return normalizedPath;
  }

  if (normalizedPath === "/") {
    return "/en";
  }

  return `/en${normalizedPath}`;
}

function stripPort(host: string): { host: string; port: string | null } {
  const idx = host.indexOf(":");
  if (idx === -1) return { host, port: null };
  return { host: host.slice(0, idx), port: host.slice(idx + 1) };
}

function hostWithoutPort(host: string): string {
  return stripPort(host).host.toLowerCase();
}

function isLocalOrPlatformHost(host: string): boolean {
  return (
    host === "localhost" ||
    /^[0-9.]+$/.test(host) ||
    host.endsWith(".onrender.com") ||
    host.endsWith(".vercel.app") ||
    host.endsWith(".netlify.app")
  );
}

function normalizeBaseDomain(domain: string): string {
  const { host, port } = stripPort(domain);
  const cleanHost = host.toLowerCase();

  // localhost / IPs: keep as-is (with port)
  if (cleanHost === "localhost" || /^[0-9.]+$/.test(cleanHost)) {
    return port ? `${cleanHost}:${port}` : cleanHost;
  }

  // If the current host is like "admin.example.com" or "tenant.example.com",
  // strip only RESERVED subdomains.
  const labels = cleanHost.split(".");
  if (labels.length > 2 && RESERVED_SUBDOMAINS.has(labels[0] ?? "")) {
    const base = labels.slice(1).join(".");
    return port ? `${base}:${port}` : base;
  }

  // Local dev style: "something.localhost"
  if (labels.length > 1 && labels.at(-1) === "localhost") {
    return port ? `localhost:${port}` : "localhost";
  }

  return port ? `${cleanHost}:${port}` : cleanHost;
}

function getConfiguredBaseDomain(): string | null {
  return normalizeTenantDomain(
    process.env.TAQAM_BASE_DOMAIN ||
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXTAUTH_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      null
  );
}

export function normalizeTenantDomain(value: string | null | undefined): string | null {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const withoutProtocol = trimmed.replace(/^https?:\/\//i, "");
  const withoutPath = withoutProtocol.split("/")[0]?.trim().toLowerCase() || "";

  if (!withoutPath) {
    return null;
  }

  return withoutPath.replace(/\.$/, "");
}

export function isTenantBaseHost(host: string, baseDomain?: string): boolean {
  const normalizedHost = normalizeTenantDomain(host);
  if (!normalizedHost) {
    return false;
  }

  const normalizedBaseDomain = normalizeTenantDomain(baseDomain || getConfiguredBaseDomain());
  if (normalizedBaseDomain && normalizedHost === normalizedBaseDomain) {
    return true;
  }

  return (
    normalizedHost === "localhost" ||
    /^[0-9.]+(?::\d+)?$/.test(normalizedHost) ||
    normalizedHost.endsWith(".onrender.com") ||
    normalizedHost.endsWith(".vercel.app") ||
    normalizedHost.endsWith(".netlify.app")
  );
}

export function isLocalTenantDevelopmentHost(host: string | null | undefined): boolean {
  const normalizedHost = normalizeTenantDomain(host);
  if (!normalizedHost) {
    return false;
  }

  return normalizedHost === "localhost" || /^[0-9.]+(?::\d+)?$/.test(normalizedHost);
}

export function extractTenantSlugFromHost(host: string, baseDomain?: string): string | null {
  const cleanHost = hostWithoutPort(host);

  if (!cleanHost || cleanHost === "localhost" || /^[0-9.]+$/.test(cleanHost)) {
    return null;
  }

  const hostLabels = cleanHost.split(".");
  if (hostLabels.length === 2 && hostLabels[1] === "localhost") {
    return normalizeTenantSlug(hostLabels[0]);
  }

  const configuredBaseDomain = baseDomain || getConfiguredBaseDomain();
  const normalizedBaseDomain = configuredBaseDomain
    ? hostWithoutPort(normalizeBaseDomain(configuredBaseDomain))
    : null;

  if (normalizedBaseDomain) {
    if (cleanHost === normalizedBaseDomain) {
      return null;
    }

    if (cleanHost.endsWith(`.${normalizedBaseDomain}`)) {
      const candidate = cleanHost.slice(0, -(normalizedBaseDomain.length + 1));
      if (!candidate || candidate.includes(".")) {
        return null;
      }

      return normalizeTenantSlug(candidate);
    }

    if (!isLocalOrPlatformHost(normalizedBaseDomain)) {
      return null;
    }
  }

  if (hostLabels.length < 3) {
    return null;
  }

  return normalizeTenantSlug(hostLabels[0]);
}

export function extractTenantSlugFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/(?:[a-z]{2}(?=\/t\/)\/)?t\/([^/]+)(?:\/|$)/i);
  return normalizeTenantSlug(match?.[1]);
}

export function resolveTenantRequest(pathname: string, host?: string | null): TenantResolution {
  const hostSlug = host ? extractTenantSlugFromHost(host) : null;
  if (hostSlug) {
    return { slug: hostSlug, source: "subdomain" };
  }

  const pathSlug = extractTenantSlugFromPath(pathname);
  if (pathSlug) {
    return { slug: pathSlug, source: "path" };
  }

  return { slug: null, source: "none" };
}

export function resolveTenantDashboardRewrite(pathname: string): TenantDashboardRewrite | null {
  const match = pathname.match(/^\/(?:(en)\/)?t\/([^/]+)\/dashboard(\/.*)?$/i);
  if (!match) {
    return null;
  }

  const slug = normalizeTenantSlug(match[2]);
  if (!slug) {
    return null;
  }

  return {
    slug,
    pathname: `/dashboard${match[3] ?? ""}`,
    locale: match[1] === "en" ? "en" : "ar"
  };
}

export function buildTenantPath(
  tenantSlug: string,
  path: string,
  locale: TenantPathLocale = "ar"
): string {
  return localizePath(`/t/${tenantSlug}${normalizePath(path)}`, locale);
}

function buildAbsoluteUrl(host: string, path: string): string {
  const normalizedHost = normalizeTenantDomain(host);
  if (!normalizedHost) {
    throw new Error("Host is required to build an absolute tenant URL");
  }

  const protocol =
    normalizedHost.includes("localhost") || /^[0-9.]+(?::\d+)?$/.test(normalizedHost)
      ? "http"
      : "https";

  return `${protocol}://${normalizedHost}${path}`;
}

export function buildTenantCanonicalUrl(
  target: TenantUrlTarget,
  path: string,
  options?: {
    locale?: TenantPathLocale;
    baseDomain?: string;
  }
): string {
  const localizedPath = localizePath(path, options?.locale ?? "ar");
  const normalizedDomain = normalizeTenantDomain(target.domain);

  if (normalizedDomain) {
    return buildAbsoluteUrl(normalizedDomain, localizedPath);
  }

  return buildTenantUrl(target.slug, localizedPath, options?.baseDomain);
}

/**
 * Build tenant-aware URL
 */
export function buildTenantUrl(tenantSlug: string, path: string, baseDomain?: string): string {
  const runtimeDomain =
    baseDomain ||
    (typeof window !== "undefined" ? window.location.host : null) ||
    getConfiguredBaseDomain() ||
    "localhost:3000";

  const domain = normalizeBaseDomain(runtimeDomain);
  const protocol =
    domain.includes("localhost") || /^[0-9.]+(?::\d+)?$/.test(domain) ? "http" : "https";
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  const mode = (
    process.env.NEXT_PUBLIC_TAQAM_TENANT_URL_MODE ||
    process.env.TAQAM_TENANT_URL_MODE ||
    "auto"
  ).toLowerCase();

  const cleanHost = hostWithoutPort(domain);
  if (cleanHost === "localhost" || /^[0-9.]+$/.test(cleanHost)) {
    return `${protocol}://${domain}/t/${tenantSlug}${normalizedPath}`;
  }

  const mustUsePath =
    mode === "path" ||
    (mode === "auto" &&
      (cleanHost.endsWith(".onrender.com") ||
        cleanHost.endsWith(".vercel.app") ||
        cleanHost.endsWith(".netlify.app")));

  if (mode === "subdomain" || (!mustUsePath && mode !== "path")) {
    return `${protocol}://${tenantSlug}.${domain}${normalizedPath}`;
  }

  return `${protocol}://${domain}/t/${tenantSlug}${normalizedPath}`;
}

/**
 * Tenant role types (aligned with Prisma UserRole)
 */
export type TenantRole =
  | "SUPER_ADMIN" // Platform admin (no tenant)
  | "TENANT_ADMIN" // Tenant owner/admin
  | "HR_MANAGER" // HR department manager
  | "MANAGER" // Department/team manager
  | "EMPLOYEE"; // Regular employee

/**
 * Check if role has access to tenant management
 */
export function canManageTenant(role: TenantRole): boolean {
  return role === "SUPER_ADMIN" || role === "TENANT_ADMIN" || role === "HR_MANAGER";
}

/**
 * Check if role is platform admin (Super Admin)
 */
export function isSuperAdmin(role: TenantRole): boolean {
  return role === "SUPER_ADMIN";
}
