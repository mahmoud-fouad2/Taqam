/**
 * Taqam Multi-Tenant Utilities
 * 
 * وظائف مساعدة للتعامل مع الـ Multi-tenancy
 */

const RESERVED_SUBDOMAINS = new Set(["www", "admin", "app", "api"]);

function stripPort(host: string): { host: string; port: string | null } {
  const idx = host.indexOf(":");
  if (idx === -1) return { host, port: null };
  return { host: host.slice(0, idx), port: host.slice(idx + 1) };
}

function hostWithoutPort(host: string): string {
  return stripPort(host).host.toLowerCase();
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

/**
 * Build tenant-aware URL
 */
export function buildTenantUrl(
  tenantSlug: string,
  path: string,
  baseDomain?: string
): string {
  const runtimeDomain =
    baseDomain ||
    (typeof window !== "undefined" ? window.location.host : null) ||
    process.env.TAQAM_BASE_DOMAIN ||
    "localhost:3000";

  const domain = normalizeBaseDomain(runtimeDomain);
  const protocol = domain.includes("localhost") || /^[0-9.]+(?::\d+)?$/.test(domain) ? "http" : "https";
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  const mode = (
    process.env.NEXT_PUBLIC_TAQAM_TENANT_URL_MODE ||
    process.env.TAQAM_TENANT_URL_MODE ||
    "auto"
  ).toLowerCase();

  const cleanHost = hostWithoutPort(domain);
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
  | "SUPER_ADMIN"    // Platform admin (no tenant)
  | "TENANT_ADMIN"   // Tenant owner/admin
  | "HR_MANAGER"     // HR department manager
  | "MANAGER"        // Department/team manager
  | "EMPLOYEE";      // Regular employee

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
