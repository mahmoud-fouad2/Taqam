/**
 * Core HR Types & Interfaces
 * أنواع بيانات الموارد البشرية الأساسية (Phase 3)
 */

// ===== Employee Types =====
export type EmployeeStatus = "active" | "onboarding" | "on_leave" | "terminated";
export type Gender = "male" | "female";
export type MaritalStatus = "single" | "married" | "divorced" | "widowed";
export type ContractType = "full_time" | "part_time" | "contract" | "intern";

export interface EmployeeSummary {
  id: string;
  employeeNumber?: string;
  firstName: string;
  firstNameAr?: string | null;
  lastName: string;
  lastNameAr?: string | null;
  email?: string;
  avatar?: string;
}

export interface Employee {
  id: string;
  employeeNumber: string; // الرقم الوظيفي

  // Personal Info
  firstName: string;
  firstNameAr?: string;
  lastName: string;
  lastNameAr?: string;
  email: string;
  avatar?: string;
  phone?: string;
  nationalId?: string;
  nationality?: string;
  dateOfBirth?: string;
  gender?: Gender;
  maritalStatus?: MaritalStatus;

  // Employment Info
  departmentId: string;
  jobTitleId: string;
  managerId?: string; // المدير المباشر
  manager?: EmployeeSummary;
  branchId?: string;
  hireDate: string;
  contractType: ContractType;
  overtimeEligible?: boolean;
  probationEndDate?: string;

  // Status
  status: EmployeeStatus;
  terminationDate?: string;
  terminationReason?: string;

  // Salary (basic info, full payroll in Phase 5)
  basicSalary?: number;
  currency?: string;

  // Metadata
  tenantId: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface EmployeeCreateInput {
  employeeNumber?: string; // auto-generate if empty
  firstName: string;
  firstNameAr?: string;
  lastName: string;
  lastNameAr?: string;
  email: string;
  phone?: string;
  nationalId?: string;
  departmentId: string;
  jobTitleId: string;
  managerId?: string;
  hireDate: string;
  contractType: ContractType;
  overtimeEligible?: boolean;
  basicSalary?: number;
}

// ===== Department Types =====
export interface Department {
  id: string;
  name: string;
  nameAr?: string;
  code?: string;
  description?: string;
  parentId?: string; // للأقسام الفرعية
  managerId?: string; // مدير القسم (employee id)
  employeesCount: number;

  // Metadata
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentCreateInput {
  name: string;
  nameAr?: string;
  code?: string;
  description?: string;
  parentId?: string;
  managerId?: string;
}

// ===== Job Title Types =====
export interface JobTitle {
  id: string;
  name: string;
  nameAr?: string;
  code?: string;
  description?: string;
  level?: number; // 1=Entry, 2=Mid, 3=Senior, 4=Manager, 5=Director, 6=Executive
  minSalary?: number;
  maxSalary?: number;
  employeesCount: number;

  // Metadata
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface JobTitleCreateInput {
  name: string;
  nameAr?: string;
  code?: string;
  description?: string;
  level?: number;
  minSalary?: number;
  maxSalary?: number;
}

// ===== Branch Types =====
export interface Branch {
  id: string;
  name: string;
  nameAr?: string;
  code?: string;
  address?: string;
  city?: string;
  country: string;
  phone?: string;
  email?: string;
  isHeadquarters: boolean;
  employeesCount: number;

  // Metadata
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

// ===== Organization Profile =====
export interface OrganizationProfile {
  id: string;
  tenantId: string;

  // Basic Info
  name: string;
  nameAr?: string;
  commercialRegister?: string;
  taxNumber?: string;

  // Contact
  address?: string;
  city?: string;
  country: string;
  phone?: string;
  email?: string;
  website?: string;

  // Logo
  logoUrl?: string;

  // Metadata
  updatedAt: string;
}

// Helper to get display name (Arabic if available, else English)
export function getDisplayName(
  item: { name: string; nameAr?: string },
  locale: "ar" | "en" = "ar"
): string {
  if (locale === "ar" && item.nameAr) return item.nameAr;
  return item.name;
}

// Helper to get employee full name
export function getEmployeeFullName(
  emp: Pick<EmployeeSummary, "firstName" | "lastName" | "firstNameAr" | "lastNameAr">,
  locale: "ar" | "en" = "ar"
): string {
  if (locale === "ar" && emp.firstNameAr && emp.lastNameAr) {
    return `${emp.firstNameAr} ${emp.lastNameAr}`;
  }
  return `${emp.firstName} ${emp.lastName}`;
}

// Get level label
export function getLevelLabel(level?: number): string {
  const levels: Record<number, string> = {
    1: "Entry Level",
    2: "Mid Level",
    3: "Senior",
    4: "Manager",
    5: "Director",
    6: "Executive"
  };
  return level ? (levels[level] ?? "Unknown") : "Not Set";
}

export function getLevelLabelAr(level?: number): string {
  const levels: Record<number, string> = {
    1: "مبتدئ",
    2: "متوسط",
    3: "أول",
    4: "مدير",
    5: "مدير تنفيذي",
    6: "قيادي"
  };
  return level ? (levels[level] ?? "غير معروف") : "غير محدد";
}
