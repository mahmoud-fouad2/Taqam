/**
 * RBAC (Role-Based Access Control) System
 * نظام إدارة الصلاحيات والأدوار
 */

// ===== Roles =====
export type SystemRole = "super_admin"; // Taqam internal only

export type CompanyRole = 
  | "company_admin"   // مدير الشركة - كل الصلاحيات داخل الـ tenant
  | "hr_manager"      // مدير الموارد البشرية
  | "department_manager" // مدير قسم
  | "employee";       // موظف عادي

export type UserRole = SystemRole | CompanyRole;

// ===== Permissions =====
export type PermissionAction = "create" | "read" | "update" | "delete" | "approve" | "export";

export type PermissionResource = 
  // Tenant Management (Super Admin only)
  | "tenants"
  | "subscription_requests"
  
  // Organization
  | "organization"
  | "branches"
  | "departments"
  | "job_titles"
  
  // Employees
  | "employees"
  | "employee_documents"
  | "employee_salary"
  
  // Attendance
  | "shifts"
  | "attendance"
  | "attendance_requests"
  
  // Payroll
  | "payroll"
  | "payslips"
  
  // Settings
  | "company_settings"
  | "users"
  | "roles";

export interface Permission {
  resource: PermissionResource;
  actions: PermissionAction[];
}

export interface RoleDefinition {
  role: UserRole;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  permissions: Permission[];
  isSystemRole?: boolean;
}

// ===== Permission Matrix =====
export const roleDefinitions: RoleDefinition[] = [
  // Super Admin (System level)
  {
    role: "super_admin",
    name: "Super Admin",
    nameAr: "مدير النظام",
    description: "Full system access - Taqam internal only",
    descriptionAr: "صلاحيات كاملة للنظام - فريق طاقم فقط",
    isSystemRole: true,
    permissions: [
      { resource: "tenants", actions: ["create", "read", "update", "delete"] },
      { resource: "subscription_requests", actions: ["read", "update", "delete", "approve"] },
      // Super admin can view all resources for support
      { resource: "organization", actions: ["read"] },
      { resource: "employees", actions: ["read"] },
    ],
  },
  
  // Company Admin
  {
    role: "company_admin",
    name: "Company Admin",
    nameAr: "مدير الشركة",
    description: "Full access within the company",
    descriptionAr: "صلاحيات كاملة داخل الشركة",
    permissions: [
      { resource: "organization", actions: ["create", "read", "update", "delete"] },
      { resource: "branches", actions: ["create", "read", "update", "delete"] },
      { resource: "departments", actions: ["create", "read", "update", "delete"] },
      { resource: "job_titles", actions: ["create", "read", "update", "delete"] },
      { resource: "employees", actions: ["create", "read", "update", "delete", "export"] },
      { resource: "employee_documents", actions: ["create", "read", "update", "delete", "approve"] },
      { resource: "employee_salary", actions: ["create", "read", "update"] },
      { resource: "shifts", actions: ["create", "read", "update", "delete"] },
      { resource: "attendance", actions: ["create", "read", "update", "delete", "export"] },
      { resource: "attendance_requests", actions: ["read", "approve"] },
      { resource: "payroll", actions: ["create", "read", "update", "approve", "export"] },
      { resource: "payslips", actions: ["read", "export"] },
      { resource: "company_settings", actions: ["read", "update"] },
      { resource: "users", actions: ["create", "read", "update", "delete"] },
      { resource: "roles", actions: ["read", "update"] },
    ],
  },
  
  // HR Manager
  {
    role: "hr_manager",
    name: "HR Manager",
    nameAr: "مدير الموارد البشرية",
    description: "Manage employees, attendance, and payroll",
    descriptionAr: "إدارة الموظفين والحضور والرواتب",
    permissions: [
      { resource: "organization", actions: ["read"] },
      { resource: "branches", actions: ["read"] },
      { resource: "departments", actions: ["create", "read", "update"] },
      { resource: "job_titles", actions: ["create", "read", "update"] },
      { resource: "employees", actions: ["create", "read", "update", "export"] },
      { resource: "employee_documents", actions: ["create", "read", "update", "approve"] },
      { resource: "employee_salary", actions: ["read", "update"] },
      { resource: "shifts", actions: ["create", "read", "update", "delete"] },
      { resource: "attendance", actions: ["create", "read", "update", "export"] },
      { resource: "attendance_requests", actions: ["read", "approve"] },
      { resource: "payroll", actions: ["create", "read", "update", "export"] },
      { resource: "payslips", actions: ["read", "export"] },
      { resource: "users", actions: ["read"] },
    ],
  },
  
  // Department Manager
  {
    role: "department_manager",
    name: "Department Manager",
    nameAr: "مدير القسم",
    description: "Manage department employees and attendance",
    descriptionAr: "إدارة موظفي القسم والحضور",
    permissions: [
      { resource: "organization", actions: ["read"] },
      { resource: "departments", actions: ["read"] },
      { resource: "job_titles", actions: ["read"] },
      { resource: "employees", actions: ["read"] }, // Only their department
      { resource: "employee_documents", actions: ["read"] },
      { resource: "attendance", actions: ["read"] }, // Only their department
      { resource: "attendance_requests", actions: ["read", "approve"] }, // Only their department
      { resource: "payslips", actions: ["read"] }, // Only their own
    ],
  },
  
  // Employee
  {
    role: "employee",
    name: "Employee",
    nameAr: "موظف",
    description: "View own data and submit requests",
    descriptionAr: "عرض البيانات الشخصية وتقديم الطلبات",
    permissions: [
      { resource: "organization", actions: ["read"] },
      { resource: "departments", actions: ["read"] },
      { resource: "employees", actions: ["read"] }, // Only own profile
      { resource: "employee_documents", actions: ["create", "read"] }, // Upload own docs
      { resource: "attendance", actions: ["read", "create"] }, // Check-in/out
      { resource: "attendance_requests", actions: ["create", "read"] }, // Submit requests
      { resource: "payslips", actions: ["read"] }, // Only own payslips
    ],
  },
];

// ===== Helper Functions =====
export function getRoleDefinition(role: UserRole): RoleDefinition | undefined {
  return roleDefinitions.find(r => r.role === role);
}

export function hasPermission(
  role: UserRole,
  resource: PermissionResource,
  action: PermissionAction
): boolean {
  const roleDef = getRoleDefinition(role);
  if (!roleDef) return false;
  
  const permission = roleDef.permissions.find(p => p.resource === resource);
  if (!permission) return false;
  
  return permission.actions.includes(action);
}

export function getPermittedActions(
  role: UserRole,
  resource: PermissionResource
): PermissionAction[] {
  const roleDef = getRoleDefinition(role);
  if (!roleDef) return [];
  
  const permission = roleDef.permissions.find(p => p.resource === resource);
  return permission?.actions ?? [];
}

export function canAccess(role: UserRole, resource: PermissionResource): boolean {
  return getPermittedActions(role, resource).length > 0;
}

// Role hierarchy (higher index = more permissions)
const roleHierarchy: UserRole[] = [
  "employee",
  "department_manager",
  "hr_manager",
  "company_admin",
  "super_admin",
];

export function isRoleHigherOrEqual(userRole: UserRole, requiredRole: UserRole): boolean {
  const userIndex = roleHierarchy.indexOf(userRole);
  const requiredIndex = roleHierarchy.indexOf(requiredRole);
  return userIndex >= requiredIndex;
}

// Get available roles for assignment (company admin can assign)
export function getAssignableRoles(currentUserRole: UserRole): CompanyRole[] {
  if (currentUserRole === "super_admin" || currentUserRole === "company_admin") {
    return ["company_admin", "hr_manager", "department_manager", "employee"];
  }
  if (currentUserRole === "hr_manager") {
    return ["department_manager", "employee"];
  }
  return [];
}

// Labels for UI
export function getRoleLabel(role: UserRole, locale: "ar" | "en" = "ar"): string {
  const def = getRoleDefinition(role);
  if (!def) return role;
  return locale === "ar" ? def.nameAr : def.name;
}
