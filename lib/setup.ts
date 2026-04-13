/**
 * Tenant Setup Wizard Service
 *
 * يدير حالة wizard إعداد الشركة الجديدة بعد التفعيل.
 * توثيق الـ steps في docs/LAUNCH_READINESS_MASTER_PLAN.md § 8.2
 */

import { z } from "zod";
import prisma from "@/lib/db";

// ── Step definitions ──────────────────────────────────────────────────────────

export const SETUP_TOTAL_STEPS = 5;

export type SetupStepKey =
  | "company-profile" // Step 1: basic org info
  | "work-settings" // Step 2: timezone, currency, week start
  | "structure" // Step 3: first dept + job title
  | "first-employee" // Step 4: invite / create first employee
  | "policies"; // Step 5: leave types + payroll defaults

export const SETUP_STEPS: { key: SetupStepKey; titleAr: string; titleEn: string }[] = [
  { key: "company-profile", titleAr: "بيانات الشركة", titleEn: "Company profile" },
  { key: "work-settings", titleAr: "إعدادات العمل", titleEn: "Work settings" },
  { key: "structure", titleAr: "الهيكل الأساسي", titleEn: "Org structure" },
  { key: "first-employee", titleAr: "أول موظف", titleEn: "First employee" },
  { key: "policies", titleAr: "السياسات الأساسية", titleEn: "Basic policies" }
];

// ── Zod schemas for per-step payloads ─────────────────────────────────────────

export const setupStep1Schema = z.object({
  nameAr: z.string().trim().min(2).max(120),
  nameEn: z.string().trim().min(2).max(120).optional(),
  city: z.string().trim().min(2).max(80).optional(),
  country: z.string().trim().length(2).default("SA"),
  commercialRegister: z.string().trim().max(40).optional(),
  taxNumber: z.string().trim().max(40).optional()
});

export const setupStep2Schema = z.object({
  timezone: z.string().trim().min(2).max(60).default("Asia/Riyadh"),
  currency: z.string().trim().length(3).default("SAR"),
  weekStartDay: z.number().int().min(0).max(6).default(0) // 0 = Sunday
});

export const setupStep3Schema = z.object({
  departmentName: z.string().trim().min(2).max(100),
  departmentNameAr: z.string().trim().min(2).max(100).optional(),
  jobTitleName: z.string().trim().min(2).max(100),
  jobTitleNameAr: z.string().trim().min(2).max(100).optional()
});

export const setupStep4Schema = z.union([
  z.object({
    action: z.literal("invite"),
    email: z.string().email().trim().toLowerCase(),
    firstName: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(80)
  }),
  z.object({
    action: z.literal("skip")
  })
]);

export const setupStep5Schema = z.object({
  leaveDaysPerYear: z.number().int().min(0).max(365).default(21),
  annualLeaveEnabled: z.boolean().default(true),
  sickLeaveEnabled: z.boolean().default(true),
  payrollEnabled: z.boolean().default(false)
});

// ── Stored data shape (persisted in Tenant.setupData JSON) ───────────────────

export type SetupData = {
  step1?: z.infer<typeof setupStep1Schema>;
  step2?: z.infer<typeof setupStep2Schema>;
  step3?: z.infer<typeof setupStep3Schema>;
  step4?: z.infer<typeof setupStep4Schema>;
  step5?: z.infer<typeof setupStep5Schema>;
};

// ── Service functions ─────────────────────────────────────────────────────────

export type SetupStatus = {
  currentStep: number; // 1-5 or 0 = not started
  completedAt: Date | null;
  isComplete: boolean;
  data: SetupData;
};

export async function getSetupStatus(tenantId: string): Promise<SetupStatus> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { setupStep: true, setupCompletedAt: true, setupData: true }
  });

  if (!tenant) throw new Error("Tenant not found");

  const isComplete = tenant.setupCompletedAt !== null;
  const currentStep = isComplete
    ? SETUP_TOTAL_STEPS
    : Math.max(0, Math.min(tenant.setupStep ?? 0, SETUP_TOTAL_STEPS));

  const rawData = (tenant.setupData as SetupData | null) ?? {};

  return {
    currentStep,
    completedAt: tenant.setupCompletedAt,
    isComplete,
    data: rawData
  };
}

export async function saveSetupStep(
  tenantId: string,
  step: number,
  stepData: Record<string, unknown>
): Promise<void> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { setupStep: true, setupData: true }
  });
  if (!tenant) throw new Error("Tenant not found");

  const existing = (tenant.setupData as SetupData | null) ?? {};
  const dataKey = `step${step}` as keyof SetupData;

  const updated: SetupData = {
    ...existing,
    [dataKey]: stepData
  };

  const maxStep = Math.max(tenant.setupStep ?? 0, step);

  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      setupStep: maxStep,
      setupData: updated
    }
  });
}

export async function completeSetup(tenantId: string): Promise<void> {
  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      setupStep: SETUP_TOTAL_STEPS,
      setupCompletedAt: new Date()
    }
  });
  await provisionSetupDefaults(tenantId);
}

/**
 * Idempotent: create minimal default data so the tenant is immediately usable.
 * Safe to call multiple times — uses count checks before creating.
 */
export async function provisionSetupDefaults(tenantId: string): Promise<void> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { setupData: true }
  });

  const setupData = (tenant?.setupData as SetupData | null) ?? {};
  const step5 = setupData.step5;

  // ── Leave types ──────────────────────────────────────────────────────────
  const leaveCount = await prisma.leaveType.count({ where: { tenantId } });
  if (leaveCount === 0) {
    const annualDays = step5?.leaveDaysPerYear ?? 21;
    const annualEnabled = step5?.annualLeaveEnabled ?? true;
    const sickEnabled = step5?.sickLeaveEnabled ?? true;

    await prisma.leaveType.createMany({
      data: [
        ...(annualEnabled
          ? [
              {
                name: "Annual Leave",
                nameAr: "إجازة سنوية",
                code: "annual",
                defaultDays: annualDays,
                tenantId,
                isActive: true
              }
            ]
          : []),
        ...(sickEnabled
          ? [
              {
                name: "Sick Leave",
                nameAr: "إجازة مرضية",
                code: "sick",
                defaultDays: 30,
                tenantId,
                isActive: true
              }
            ]
          : []),
        // Emergency leave is always provisioned as a baseline
        {
          name: "Emergency Leave",
          nameAr: "إجازة طارئة",
          code: "emergency",
          defaultDays: 3,
          tenantId,
          isActive: true
        }
      ],
      skipDuplicates: true
    });
  }
}

export function getSetupCompletionPercent(currentStep: number): number {
  if (currentStep <= 0) return 0;
  if (currentStep >= SETUP_TOTAL_STEPS) return 100;
  return Math.round((currentStep / SETUP_TOTAL_STEPS) * 100);
}
