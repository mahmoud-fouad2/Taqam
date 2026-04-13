/**
 * RBAC v2 – Granular Permissions
 *
 * Permission keys follow the pattern "<resource>.<action>".
 * Built-in role default sets are the initial seeded permissions for each system role.
 * Custom roles stored in CustomRole.permissions[] supplement (or replace) these.
 */

export const ALL_PERMISSIONS = [
  // Employees
  "employees.view",
  "employees.create",
  "employees.edit",
  "employees.delete",
  // Departments
  "departments.view",
  "departments.manage",
  // Payroll
  "payroll.view",
  "payroll.run",
  "payroll.export",
  // Leaves
  "leaves.view",
  "leaves.view_all",
  "leaves.approve",
  "leaves.manage_types",
  // Attendance
  "attendance.view",
  "attendance.view_all",
  "attendance.edit",
  // Reports
  "reports.view",
  "reports.export",
  // Documents
  "documents.view",
  "documents.upload",
  "documents.delete",
  // Recruitment
  "recruitment.view",
  "recruitment.manage",
  // Settings
  "settings.view",
  "settings.manage",
  // Users / Roles
  "users.view",
  "users.manage",
  "roles.manage",
  // Integrations
  "integrations.view",
  "integrations.manage",
  // Webhooks
  "webhooks.manage"
] as const;

export type Permission = (typeof ALL_PERMISSIONS)[number];

export const PERMISSION_GROUPS: { groupAr: string; groupEn: string; permissions: Permission[] }[] =
  [
    {
      groupAr: "الموظفون",
      groupEn: "Employees",
      permissions: ["employees.view", "employees.create", "employees.edit", "employees.delete"]
    },
    {
      groupAr: "الأقسام",
      groupEn: "Departments",
      permissions: ["departments.view", "departments.manage"]
    },
    {
      groupAr: "الرواتب",
      groupEn: "Payroll",
      permissions: ["payroll.view", "payroll.run", "payroll.export"]
    },
    {
      groupAr: "الإجازات",
      groupEn: "Leaves",
      permissions: ["leaves.view", "leaves.view_all", "leaves.approve", "leaves.manage_types"]
    },
    {
      groupAr: "الحضور",
      groupEn: "Attendance",
      permissions: ["attendance.view", "attendance.view_all", "attendance.edit"]
    },
    {
      groupAr: "التقارير",
      groupEn: "Reports",
      permissions: ["reports.view", "reports.export"]
    },
    {
      groupAr: "المستندات",
      groupEn: "Documents",
      permissions: ["documents.view", "documents.upload", "documents.delete"]
    },
    {
      groupAr: "التوظيف",
      groupEn: "Recruitment",
      permissions: ["recruitment.view", "recruitment.manage"]
    },
    {
      groupAr: "الإعدادات",
      groupEn: "Settings",
      permissions: ["settings.view", "settings.manage"]
    },
    {
      groupAr: "المستخدمون والأدوار",
      groupEn: "Users & Roles",
      permissions: ["users.view", "users.manage", "roles.manage"]
    },
    {
      groupAr: "التكاملات",
      groupEn: "Integrations",
      permissions: ["integrations.view", "integrations.manage", "webhooks.manage"]
    }
  ];

/** Default permission sets for each built-in role */
export const BUILTIN_ROLE_PERMISSIONS: Record<string, Permission[]> = {
  TENANT_ADMIN: ALL_PERMISSIONS.slice(),
  HR_MANAGER: [
    "employees.view",
    "employees.create",
    "employees.edit",
    "departments.view",
    "departments.manage",
    "payroll.view",
    "payroll.run",
    "payroll.export",
    "leaves.view",
    "leaves.view_all",
    "leaves.approve",
    "leaves.manage_types",
    "attendance.view",
    "attendance.view_all",
    "attendance.edit",
    "reports.view",
    "reports.export",
    "documents.view",
    "documents.upload",
    "recruitment.view",
    "recruitment.manage",
    "settings.view",
    "users.view",
    "integrations.view"
  ],
  MANAGER: [
    "employees.view",
    "departments.view",
    "payroll.view",
    "leaves.view",
    "leaves.view_all",
    "leaves.approve",
    "attendance.view",
    "attendance.view_all",
    "reports.view",
    "documents.view",
    "recruitment.view"
  ],
  EMPLOYEE: [
    "employees.view",
    "leaves.view",
    "attendance.view",
    "documents.view",
    "reports.view"
  ]
};

/**
 * Check if a user has a given permission.
 * Precedence: customRole.permissions > user.permissions > builtin role defaults.
 * Notes:
 *  - TENANT_ADMIN always has all permissions (cannot be stripped by a custom role).
 *  - Custom role permissions never include roles.manage or settings.manage
 *    unless the assigning admin explicitly grants them (privilege escalation prevention).
 */
export function hasPermission(
  user: {
    role?: string | null;
    permissions?: string[];
    customRole?: { permissions: string[] } | null;
  },
  permission: Permission
): boolean {
  // SUPER_ADMIN has everything
  if (user.role === "SUPER_ADMIN") return true;

  // TENANT_ADMIN always has all permissions
  if (user.role === "TENANT_ADMIN") return true;

  // Check custom role first (if assigned)
  if (user.customRole) {
    return user.customRole.permissions.includes(permission);
  }

  // Check explicit user-level permission overrides
  if (user.permissions && user.permissions.length > 0) {
    return user.permissions.includes(permission);
  }

  // Fall back to built-in role defaults
  const roleDefaults = BUILTIN_ROLE_PERMISSIONS[user.role ?? ""] ?? [];
  return roleDefaults.includes(permission);
}

/**
 * Strips any permissions that would allow privilege escalation beyond
 * what a non-admin should be able to do. Call this before saving a CustomRole.
 */
export function sanitizeCustomRolePermissions(permissions: string[]): Permission[] {
  // Prevent a custom role from granting settings.manage or roles.manage
  // unless the caller is TENANT_ADMIN (enforced at API level).
  const escalationGates: Permission[] = ["settings.manage", "roles.manage", "users.manage"];
  return permissions.filter(
    (p) =>
      ALL_PERMISSIONS.includes(p as Permission) && !escalationGates.includes(p as Permission)
  ) as Permission[];
}
