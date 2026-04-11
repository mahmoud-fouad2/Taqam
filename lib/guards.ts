/**
 * Taqam Route Guards
 *
 * Higher-order components ودوال للتحقق من الصلاحيات على مستوى الصفحات
 */

import { redirect } from "next/navigation";
import { getCurrentUser, isAuthenticated } from "./auth";
import { isSuperAdmin, TenantRole } from "./tenant";
import { getTenantContext, hasTenant } from "./tenant.server";

/**
 * Guard: Require user to be logged in
 * Usage: await guardAuth() at top of page component
 */
export async function guardAuth() {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    redirect("/login");
  }
}

/**
 * Guard: Require user to be guest (not logged in)
 * Usage: For login/register pages
 */
export async function guardGuest() {
  const authenticated = await isAuthenticated();
  if (authenticated) {
    redirect("/dashboard");
  }
}

/**
 * Guard: Require tenant context
 * Usage: For tenant-specific pages
 */
export async function guardTenant() {
  const hasTenantCtx = await hasTenant();
  if (!hasTenantCtx) {
    redirect("/");
  }
}

/**
 * Guard: Require specific role(s)
 */
export async function guardRole(allowedRoles: TenantRole | TenantRole[]) {
  await guardAuth();

  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  if (!roles.includes(user.role as TenantRole)) {
    redirect("/dashboard?error=unauthorized");
  }
}

/**
 * Guard: Super Admin only
 * Usage: For Taqam internal admin pages
 */
export async function guardSuperAdmin() {
  await guardAuth();

  const user = await getCurrentUser();
  if (!user || !isSuperAdmin(user.role)) {
    redirect("/dashboard?error=unauthorized");
  }
}

/**
 * Guard: Company Admin or Super Admin
 * Usage: For company management pages
 */
export async function guardCompanyAdmin() {
  await guardRole(["SUPER_ADMIN", "TENANT_ADMIN"]);
}

/**
 * Guard: Manager or above
 */
export async function guardManager() {
  await guardRole(["SUPER_ADMIN", "TENANT_ADMIN", "HR_MANAGER", "MANAGER"]);
}

/**
 * Get page context with all auth & tenant info
 */
export async function getPageContext() {
  const [user, tenant] = await Promise.all([getCurrentUser(), getTenantContext()]);

  return {
    user,
    tenant,
    isAuthenticated: user !== null,
    isSuperAdmin: user ? isSuperAdmin(user.role) : false
  };
}
