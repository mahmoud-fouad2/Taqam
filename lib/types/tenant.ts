/**
 * Tenant Types & Interfaces
 * أنواع بيانات الشركات (Tenants)
 */

export type TenantStatus = "active" | "suspended" | "pending" | "cancelled" | "deleted";
export type SubscriptionPlan = "starter" | "business" | "enterprise";

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  nameAr: string;
  status: TenantStatus;
  plan: SubscriptionPlan;

  // Company Info
  commercialRegister?: string;
  taxNumber?: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  country: string;

  // Settings
  defaultLocale: "ar" | "en";
  defaultTheme: "shadcn" | "mantine";
  timezone: string;

  // Metadata
  usersCount: number;
  employeesCount: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;

  // Soft delete
  deletedAt?: string;
  suspendedAt?: string;
  suspendedReason?: string;
}

export interface TenantCreateInput {
  slug: string;
  name: string;
  nameAr: string;
  email: string;
  phone?: string;
  commercialRegister?: string;
  plan: SubscriptionPlan;
  defaultLocale: "ar" | "en";
  defaultTheme: "shadcn" | "mantine";

  // Company Admin
  adminName: string;
  adminEmail: string;
}

export interface TenantUpdateInput {
  name?: string;
  nameAr?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  defaultLocale?: "ar" | "en";
  defaultTheme?: "shadcn" | "mantine";
  plan?: SubscriptionPlan;
}

export interface SubscriptionRequest {
  id: string;
  companyName: string;
  companyNameAr?: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  employeesCount?: string; // "1-10", "11-50", "51-200", "200+"
  message?: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  notes?: string;
}
