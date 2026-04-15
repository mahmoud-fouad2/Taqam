/**
 * Tenant Setup Wizard Service
 *
 * يدير حالة wizard إعداد الشركة الجديدة بعد التفعيل.
 * توثيق الـ steps في docs/LAUNCH_READINESS_MASTER_PLAN.md § 8.2
 */

import { z } from "zod";
import prisma from "@/lib/db";
import type { AttendanceStatus, JobPostingStatus } from "@prisma/client";
import { getSetupAuditStepSnapshot } from "@/lib/setup-audit";
import { buildSetupDefaultLeaveTypes } from "@/lib/setup-defaults";
import { ensureEmployeeWorkspaceProfile } from "@/lib/employees/workspace-provisioning";

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

function getSetupStepDefinition(step: number) {
  return SETUP_STEPS[Math.max(0, Math.min(SETUP_STEPS.length - 1, step - 1))] ?? null;
}

export async function logSetupStepAudit({
  tenantId,
  userId,
  step,
  previousStep,
  currentStep,
  stepData,
  ipAddress,
  userAgent
}: {
  tenantId: string;
  userId?: string | null;
  step: number;
  previousStep: number;
  currentStep: number;
  stepData: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
}): Promise<void> {
  const definition = getSetupStepDefinition(step);

  await prisma.auditLog.create({
    data: {
      tenantId,
      userId: userId ?? null,
      action: "SETUP_STEP_SAVED",
      entity: "SetupWizard",
      entityId: tenantId,
      oldData: {
        previousStep,
        previousCompletionPercent: getSetupCompletionPercent(previousStep)
      },
      newData: {
        step,
        stepKey: definition?.key ?? null,
        stepTitleAr: definition?.titleAr ?? null,
        stepTitleEn: definition?.titleEn ?? null,
        currentStep,
        completionPercent: getSetupCompletionPercent(currentStep),
        stepData: getSetupAuditStepSnapshot(step, stepData)
      },
      ipAddress: ipAddress ?? null,
      userAgent: userAgent ?? null
    }
  });
}

export async function logSetupCompletionAudit({
  tenantId,
  userId,
  previousStep,
  completedAt,
  setupData,
  ipAddress,
  userAgent
}: {
  tenantId: string;
  userId?: string | null;
  previousStep: number;
  completedAt: Date;
  setupData: SetupData;
  ipAddress?: string | null;
  userAgent?: string | null;
}): Promise<void> {
  await prisma.auditLog.create({
    data: {
      tenantId,
      userId: userId ?? null,
      action: "SETUP_COMPLETED",
      entity: "SetupWizard",
      entityId: tenantId,
      oldData: {
        previousStep,
        previousCompletionPercent: getSetupCompletionPercent(previousStep)
      },
      newData: {
        currentStep: SETUP_TOTAL_STEPS,
        completionPercent: 100,
        completedAt: completedAt.toISOString(),
        completedSteps: Object.keys(setupData).sort()
      },
      ipAddress: ipAddress ?? null,
      userAgent: userAgent ?? null
    }
  });
}

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
  payrollEnabled: z.boolean().default(false),
  seedSampleData: z.boolean().default(false)
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

export async function ensureSetupFirstEmployeeRecord(tenantId: string): Promise<void> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { setupData: true }
  });

  if (!tenant) {
    throw new Error("Tenant not found");
  }

  const setupData = (tenant.setupData as SetupData | null) ?? {};
  const step4 = setupData.step4;

  if (!step4 || step4.action !== "invite") {
    return;
  }

  await prisma.$transaction(async (tx) => {
    await ensureEmployeeWorkspaceProfile(tx, {
      tenantId,
      email: step4.email,
      firstName: step4.firstName,
      lastName: step4.lastName
    });
  });
}

export async function ensureSetupCompletionArtifacts(
  tenantId: string,
  userId?: string
): Promise<void> {
  await ensureSetupFirstEmployeeRecord(tenantId);
  await provisionSetupDefaults(tenantId);
  if (userId) {
    await seedSampleSetupData(tenantId, userId);
  }
}

export async function completeSetup(tenantId: string, userId?: string): Promise<void> {
  await ensureSetupCompletionArtifacts(tenantId, userId);

  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      setupStep: SETUP_TOTAL_STEPS,
      setupCompletedAt: new Date()
    }
  });
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

  const existingLeaveTypeCodes = new Set(
    (
      await prisma.leaveType.findMany({
        where: { tenantId },
        select: { code: true }
      })
    ).map((leaveType) => leaveType.code)
  );

  const missingLeaveTypes = buildSetupDefaultLeaveTypes(step5)
    .filter((leaveType) => !existingLeaveTypeCodes.has(leaveType.code))
    .map((leaveType) => ({
      ...leaveType,
      tenantId
    }));

  if (missingLeaveTypes.length > 0) {
    await prisma.leaveType.createMany({
      data: missingLeaveTypes,
      skipDuplicates: true
    });
  }
}

/**
 * Optional sample data seeding for brand-new tenants.
 * Safe to call multiple times: each domain only seeds when still empty.
 */
export async function seedSampleSetupData(tenantId: string, userId: string): Promise<void> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      name: true,
      nameAr: true,
      currency: true,
      setupData: true
    }
  });

  const setupData = (tenant?.setupData as SetupData | null) ?? {};
  const step5 = setupData.step5;
  if (!step5?.seedSampleData) return;

  const [department, jobTitle] = await Promise.all([
    prisma.department.findFirst({ where: { tenantId }, orderBy: { createdAt: "asc" } }),
    prisma.jobTitle.findFirst({ where: { tenantId }, orderBy: { createdAt: "asc" } })
  ]);

  const existingEmployees = await prisma.employee.count({ where: { tenantId } });
  let sampleEmployees = await prisma.employee.findMany({
    where: { tenantId },
    take: 3,
    orderBy: { createdAt: "asc" },
    select: { id: true, userId: true }
  });

  if (existingEmployees === 0) {
    const created = await prisma.$transaction([
      prisma.employee.create({
        data: {
          tenantId,
          employeeNumber: "S-1001",
          firstName: "Lina",
          lastName: "Hassan",
          firstNameAr: "لينا",
          lastNameAr: "حسن",
          email: `sample.manager+${tenantId}@taqam.local`,
          hireDate: new Date(),
          departmentId: department?.id,
          jobTitleId: jobTitle?.id,
          workLocation: "Riyadh HQ",
          baseSalary: 18000,
          currency: tenant?.currency ?? "SAR"
        },
        select: { id: true, userId: true }
      }),
      prisma.employee.create({
        data: {
          tenantId,
          employeeNumber: "S-1002",
          firstName: "Omar",
          lastName: "Salem",
          firstNameAr: "عمر",
          lastNameAr: "سالم",
          email: `sample.staff1+${tenantId}@taqam.local`,
          hireDate: new Date(),
          departmentId: department?.id,
          jobTitleId: jobTitle?.id,
          workLocation: "Riyadh HQ",
          baseSalary: 11000,
          currency: tenant?.currency ?? "SAR"
        },
        select: { id: true, userId: true }
      }),
      prisma.employee.create({
        data: {
          tenantId,
          employeeNumber: "S-1003",
          firstName: "Sara",
          lastName: "Nasser",
          firstNameAr: "سارة",
          lastNameAr: "ناصر",
          email: `sample.staff2+${tenantId}@taqam.local`,
          hireDate: new Date(),
          departmentId: department?.id,
          jobTitleId: jobTitle?.id,
          workLocation: "Jeddah Branch",
          baseSalary: 12500,
          currency: tenant?.currency ?? "SAR"
        },
        select: { id: true, userId: true }
      })
    ]);

    await prisma.employee.updateMany({
      where: { id: { in: [created[1].id, created[2].id] } },
      data: { managerId: created[0].id }
    });

    sampleEmployees = created;
  }

  const attendanceCount = await prisma.attendanceRecord.count({ where: { tenantId } });
  if (attendanceCount === 0 && sampleEmployees.length > 0) {
    const today = new Date();
    const records = sampleEmployees.flatMap((employee, employeeIndex) =>
      Array.from({ length: 5 }, (_, dayOffset) => {
        const date = new Date(today);
        date.setDate(today.getDate() - dayOffset);
        date.setHours(0, 0, 0, 0);

        const checkIn = new Date(date);
        checkIn.setHours(9, employeeIndex === 1 && dayOffset === 1 ? 18 : 2, 0, 0);
        const checkOut = new Date(date);
        checkOut.setHours(17, 5, 0, 0);

        const status: AttendanceStatus =
          employeeIndex === 1 && dayOffset === 1 ? "LATE" : "PRESENT";

        return {
          tenantId,
          employeeId: employee.id,
          date,
          checkInTime: checkIn,
          checkOutTime: checkOut,
          status,
          lateMinutes: employeeIndex === 1 && dayOffset === 1 ? 18 : 0,
          totalWorkMinutes: 8 * 60
        };
      })
    );

    await prisma.attendanceRecord.createMany({
      data: records,
      skipDuplicates: true
    });
  }

  const announcementCount = await prisma.announcement.count({ where: { tenantId } });
  if (announcementCount === 0) {
    await prisma.announcement.create({
      data: {
        tenantId,
        authorId: userId,
        title: "Welcome to Taqam",
        titleAr: "مرحباً بكم في طاقم",
        content:
          "Your workspace is ready. Review the dashboard and complete the remaining setup details.",
        contentAr: `تم تجهيز مساحة عمل ${tenant?.nameAr ?? tenant?.name ?? "الشركة"} بنجاح. راجع لوحة التحكم وابدأ بإضافة بياناتك الفعلية.`,
        type: "INFO",
        priority: "NORMAL",
        targetAll: true,
        isActive: true
      }
    });
  }

  const jobPostingCount = await prisma.jobPosting.count({ where: { tenantId } });
  if (jobPostingCount === 0) {
    const status: JobPostingStatus = "ACTIVE";

    const posting = await prisma.jobPosting.create({
      data: {
        tenantId,
        createdById: userId,
        title: "HR Operations Specialist",
        titleAr: "أخصائي عمليات موارد بشرية",
        description: "Own day-to-day HR operations, employee records, and people reporting.",
        requirements: "1-3 years in HR operations, HRIS familiarity, reporting skills.",
        responsibilities:
          "Maintain employee data, coordinate leave processes, and support HR analytics.",
        benefits: "Medical insurance, annual bonus, hybrid work policy.",
        departmentId: department?.id,
        jobTitleId: jobTitle?.id,
        status,
        positions: 1,
        location: "Riyadh",
        salaryMin: 9000,
        salaryMax: 14000,
        salaryCurrency: tenant?.currency ?? "SAR",
        postedAt: new Date()
      }
    });

    await prisma.applicant.createMany({
      data: [
        {
          tenantId,
          jobPostingId: posting.id,
          firstName: "Noor",
          lastName: "Ali",
          email: `applicant.new+${tenantId}@taqam.local`,
          phone: "+966500000001",
          status: "NEW"
        },
        {
          tenantId,
          jobPostingId: posting.id,
          firstName: "Maha",
          lastName: "Khaled",
          email: `applicant.screening+${tenantId}@taqam.local`,
          phone: "+966500000002",
          status: "SCREENING"
        },
        {
          tenantId,
          jobPostingId: posting.id,
          firstName: "Yousef",
          lastName: "Faris",
          email: `applicant.interview+${tenantId}@taqam.local`,
          phone: "+966500000003",
          status: "INTERVIEW"
        },
        {
          tenantId,
          jobPostingId: posting.id,
          firstName: "Rana",
          lastName: "Majed",
          email: `applicant.offer+${tenantId}@taqam.local`,
          phone: "+966500000004",
          status: "OFFER"
        }
      ]
    });
  }
}

export function getSetupCompletionPercent(currentStep: number): number {
  if (currentStep <= 0) return 0;
  if (currentStep >= SETUP_TOTAL_STEPS) return 100;
  return Math.round((currentStep / SETUP_TOTAL_STEPS) * 100);
}
