export const USER_ROLES = [
  "SUPER_ADMIN",
  "TENANT_ADMIN",
  "HR_MANAGER",
  "MANAGER",
  "EMPLOYEE",
] as const;

export type UserRole = (typeof USER_ROLES)[number];
export type LegacyUserRole = UserRole | "ADMIN" | "HR";
export type TenantDashboardRole = Exclude<UserRole, "SUPER_ADMIN">;

const LEGACY_ROLE_MAP = {
  ADMIN: "TENANT_ADMIN",
  HR: "HR_MANAGER",
} as const satisfies Record<string, UserRole>;

function normalizeAllowedRole(role: LegacyUserRole): UserRole {
  return LEGACY_ROLE_MAP[role as keyof typeof LEGACY_ROLE_MAP] ?? role;
}

export function normalizeUserRole(role: string | null | undefined): UserRole | null {
  if (!role) {
    return null;
  }

  if (role in LEGACY_ROLE_MAP) {
    return LEGACY_ROLE_MAP[role as keyof typeof LEGACY_ROLE_MAP];
  }

  return USER_ROLES.includes(role as UserRole) ? (role as UserRole) : null;
}

export function hasRole(
  role: string | null | undefined,
  allowedRoles: LegacyUserRole | readonly LegacyUserRole[]
): boolean {
  const normalizedRole = normalizeUserRole(role);

  if (!normalizedRole) {
    return false;
  }

  const allowed = (Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]).map(
    normalizeAllowedRole
  );

  return allowed.includes(normalizedRole);
}

export function isSuperAdminRole(role: string | null | undefined): role is "SUPER_ADMIN" {
  return normalizeUserRole(role) === "SUPER_ADMIN";
}

export function isTenantDashboardRole(
  role: string | null | undefined
): role is TenantDashboardRole {
  const normalizedRole = normalizeUserRole(role);
  return normalizedRole !== null && normalizedRole !== "SUPER_ADMIN";
}

export function isTenantWorkspaceUser(
  user: { role?: string | null; tenantId?: string | null } | null | undefined
): user is { role: TenantDashboardRole; tenantId: string } {
  return Boolean(user && isTenantDashboardRole(user.role) && user.tenantId);
}

export function resolveWorkspaceScope(
  user: { role?: string | null; tenantId?: string | null } | null | undefined
): "platform" | "tenant" {
  return isSuperAdminRole(user?.role) ? "platform" : "tenant";
}