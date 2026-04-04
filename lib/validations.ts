/**
 * Zod Validation Schemas for API Routes
 */

import { z } from "zod";

// Common schemas
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

// Employee schemas
export const createEmployeeSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  firstNameAr: z.string().optional(),
  lastNameAr: z.string().optional(),
  email: z.string().email("Invalid email address"),
  personalEmail: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  mobile: z.string().optional().nullable(),
  gender: z.enum(["MALE", "FEMALE"]).optional(),
  dateOfBirth: z.string().datetime().optional().nullable(),
  nationality: z.string().optional().nullable(),
  maritalStatus: z.enum(["SINGLE", "MARRIED", "DIVORCED", "WIDOWED"]).optional().nullable(),
  nationalId: z.string().optional().nullable(),
  passportNumber: z.string().optional().nullable(),
  departmentId: z.string().uuid().optional().nullable(),
  jobTitleId: z.string().uuid().optional().nullable(),
  shiftId: z.string().uuid().optional().nullable(),
  managerId: z.string().uuid().optional().nullable(),
  hireDate: z.string().datetime().optional().nullable(),
  role: z.enum(["EMPLOYEE", "HR_MANAGER", "MANAGER", "TENANT_ADMIN"]).default("EMPLOYEE"),
  employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERN", "TEMPORARY", "PROBATION"]).default("FULL_TIME"),
  basicSalary: z.number().nonnegative().optional(),
});

export const updateEmployeeSchema = createEmployeeSchema.partial();

// Department schemas
export const createDepartmentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  nameAr: z.string().optional(),
  code: z.string().optional(),
  description: z.string().optional(),
  descriptionAr: z.string().optional(),
  managerId: z.string().uuid().optional().nullable(),
  parentId: z.string().uuid().optional().nullable(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format").optional(),
});

export const updateDepartmentSchema = createDepartmentSchema.partial();

// Leave request schemas
export const createLeaveRequestSchema = z.object({
  leaveTypeId: z.string().uuid("Invalid leave type"),
  startDate: z.string().datetime("Invalid start date"),
  endDate: z.string().datetime("Invalid end date"),
  reason: z.string().min(10, "Reason must be at least 10 characters"),
  isHalfDay: z.boolean().default(false),
  halfDayType: z.enum(["FIRST_HALF", "SECOND_HALF"]).optional(),
  attachments: z.array(z.string()).optional(),
}).refine((data) => new Date(data.startDate) <= new Date(data.endDate), {
  message: "End date must be after start date",
  path: ["endDate"],
});

export const processLeaveRequestSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  notes: z.string().optional(),
});

// Leave type schemas
export const createLeaveTypeSchema = z.object({
  name: z.string().min(2),
  nameAr: z.string().optional(),
  code: z.string().min(2),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  defaultDays: z.number().int().nonnegative(),
  maxDays: z.number().int().nonnegative().optional(),
  isPaid: z.boolean().default(true),
  requiresApproval: z.boolean().default(true),
  requiresAttachment: z.boolean().default(false),
  minDaysNotice: z.number().int().nonnegative().default(0),
  maxConsecutiveDays: z.number().int().positive().optional(),
  allowCarryOver: z.boolean().default(false),
  maxCarryOverDays: z.number().int().nonnegative().optional(),
  genderRestriction: z.enum(["MALE", "FEMALE"]).optional().nullable(),
});

// Shift schemas
export const createShiftSchema = z.object({
  name: z.string().min(2),
  nameAr: z.string().optional(),
  code: z.string().optional(),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:mm)"),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:mm)"),
  breakStartTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  breakEndTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  breakDurationMinutes: z.number().int().nonnegative().optional(),
  flexibleStartMinutes: z.number().int().nonnegative().default(0),
  flexibleEndMinutes: z.number().int().nonnegative().default(0),
  workDays: z.array(z.number().int().min(0).max(6)).default([0, 1, 2, 3, 4]),
  overtimeEnabled: z.boolean().default(false),
  overtimeMultiplier: z.number().positive().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  isDefault: z.boolean().default(false),
});

export const updateShiftSchema = createShiftSchema.partial();

// Job title schemas
export const createJobTitleSchema = z.object({
  name: z.string().min(2),
  nameAr: z.string().optional(),
  code: z.string().optional(),
  description: z.string().optional(),
  descriptionAr: z.string().optional(),
  departmentId: z.string().uuid().optional().nullable(),
  minSalary: z.number().nonnegative().optional(),
  maxSalary: z.number().nonnegative().optional(),
  level: z.number().int().positive().optional(),
});

export const updateJobTitleSchema = createJobTitleSchema.partial();

// Holiday schemas
export const createHolidaySchema = z.object({
  name: z.string().min(2),
  nameAr: z.string().optional(),
  date: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  type: z.enum(["PUBLIC", "RELIGIOUS", "COMPANY", "REGIONAL"]).default("PUBLIC"),
  isRecurring: z.boolean().default(false),
  description: z.string().optional(),
  descriptionAr: z.string().optional(),
});

export const updateHolidaySchema = createHolidaySchema.partial();

// Announcement schemas
export const createAnnouncementSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  titleAr: z.string().optional(),
  content: z.string().min(10, "Content must be at least 10 characters"),
  contentAr: z.string().optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
  targetAudience: z.enum(["ALL", "MANAGERS", "SPECIFIC_DEPARTMENTS"]).default("ALL"),
  targetDepartments: z.array(z.string().uuid()).optional(),
  attachments: z.array(z.string()).optional(),
  isPinned: z.boolean().default(false),
  isPublished: z.boolean().default(false),
  expiresAt: z.string().datetime().optional(),
});

export const updateAnnouncementSchema = createAnnouncementSchema.partial();

// Tenant schemas
export const createTenantSchema = z.object({
  name: z.string().min(2),
  nameAr: z.string().optional(),
  subdomain: z.string().min(3).max(30).regex(/^[a-z0-9-]+$/, "Subdomain can only contain lowercase letters, numbers, and hyphens"),
  code: z.string().min(2).max(10),
  logo: z.string().url().optional(),
  favicon: z.string().url().optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  timezone: z.string().default("Asia/Riyadh"),
  defaultLanguage: z.enum(["ar", "en"]).default("ar"),
  currency: z.string().default("SAR"),
  dateFormat: z.string().default("DD/MM/YYYY"),
  timeFormat: z.string().default("HH:mm"),
  weekStartDay: z.number().int().min(0).max(6).default(0),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  crNumber: z.string().optional(),
  vatNumber: z.string().optional(),
  plan: z.enum(["FREE", "TRIAL", "STARTER", "PROFESSIONAL", "ENTERPRISE"]).default("TRIAL"),
  trialEndsAt: z.string().datetime().optional(),
  maxEmployees: z.number().int().positive().default(10),
  maxAdmins: z.number().int().positive().default(2),
  contactName: z.string().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
});

export const updateTenantSchema = createTenantSchema.partial();

// Profile schemas
export const updateProfileSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  firstNameAr: z.string().optional(),
  lastNameAr: z.string().optional(),
  personalEmail: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  mobile: z.string().optional().nullable(),
  avatar: z.string().url().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  emergencyContactName: z.string().optional().nullable(),
  emergencyContactPhone: z.string().optional().nullable(),
  emergencyContactRelation: z.string().optional().nullable(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

// Document schemas
export const documentCategorySchema = z.enum([
  "ID_DOCUMENT",
  "PASSPORT",
  "VISA",
  "WORK_PERMIT",
  "CONTRACT",
  "CERTIFICATE",
  "QUALIFICATION",
  "MEDICAL",
  "OTHER",
]);

// Attendance check-in/out schema
export const attendanceActionSchema = z.object({
  type: z.enum(["CHECK_IN", "CHECK_OUT"]),
  employeeId: z.string().uuid().optional(),
  location: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  notes: z.string().optional(),
});
