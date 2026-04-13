import { NextRequest, NextResponse } from "next/server";
import { requireTenantSession, logApiError } from "@/lib/api/route-helper";
import { checkRateLimit, withRateLimitHeaders } from "@/lib/rate-limit";
import prisma from "@/lib/db";
import {
  getSetupStatus,
  saveSetupStep,
  completeSetup,
  getSetupCompletionPercent,
  SETUP_STEPS,
  SETUP_TOTAL_STEPS,
  setupStep1Schema,
  setupStep2Schema,
  setupStep3Schema,
  setupStep4Schema,
  setupStep5Schema
} from "@/lib/setup";

import { z } from "zod";

const stepSchemas: Record<number, z.ZodTypeAny> = {
  1: setupStep1Schema,
  2: setupStep2Schema,
  3: setupStep3Schema,
  4: setupStep4Schema,
  5: setupStep5Schema
};

// GET /api/setup — return current setup status
export async function GET(req: NextRequest) {
  const auth = await requireTenantSession(req);
  if (!auth.ok) return auth.response;

  try {
    const status = await getSetupStatus(auth.tenantId);
    return NextResponse.json({
      currentStep: status.currentStep,
      totalSteps: SETUP_TOTAL_STEPS,
      completionPercent: getSetupCompletionPercent(status.currentStep),
      isComplete: status.isComplete,
      completedAt: status.completedAt,
      steps: SETUP_STEPS,
      data: status.data
    });
  } catch (err) {
    logApiError("GET /api/setup", err);
    return NextResponse.json({ error: "حدث خطأ في جلب حالة الإعداد" }, { status: 500 });
  }
}

// POST /api/setup — save a step's data
const saveStepBody = z.object({
  step: z.number().int().min(1).max(SETUP_TOTAL_STEPS),
  data: z.record(z.unknown())
});

export async function POST(req: NextRequest) {
  const auth = await requireTenantSession(req);
  if (!auth.ok) return auth.response;

  const rateLimit = await checkRateLimit(req, {
    keyPrefix: `setup:${auth.tenantId}`,
    limit: 30,
    windowMs: 60_000
  });
  if (!rateLimit.allowed) {
    return withRateLimitHeaders(
      NextResponse.json({ error: "طلبات كثيرة، حاول لاحقاً" }, { status: 429 }),
      rateLimit
    );
  }

  try {
    const body = saveStepBody.parse(await req.json());
    const schema = stepSchemas[body.step];
    if (!schema) {
      return NextResponse.json({ error: "خطوة غير صحيحة" }, { status: 400 });
    }

    const parsed = schema.safeParse(body.data);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "بيانات غير صالحة", issues: parsed.error.issues },
        { status: 422 }
      );
    }

    await saveSetupStep(auth.tenantId, body.step, parsed.data as Record<string, unknown>);

    // Fire-and-forget audit log (non-blocking)
    prisma.auditLog
      .create({
        data: {
          tenantId: auth.tenantId,
          userId: auth.session.user.id,
          action: "SETUP_STEP_SAVED",
          entity: "SetupWizard",
          entityId: auth.tenantId,
          newData: { step: body.step }
        }
      })
      .catch(() => {});

    // Apply side-effects per step
    if (body.step === 1) {
      const d = parsed.data as z.infer<typeof setupStep1Schema>;
      await prisma.tenant.update({
        where: { id: auth.tenantId },
        data: { nameAr: d.nameAr }
      });
      await prisma.organizationProfile.updateMany({
        where: { tenantId: auth.tenantId },
        data: {
          nameAr: d.nameAr,
          ...(d.nameEn !== undefined && { name: d.nameEn }),
          ...(d.city !== undefined && { city: d.city }),
          ...(d.country !== undefined && { country: d.country }),
          ...(d.commercialRegister !== undefined && { commercialRegister: d.commercialRegister }),
          ...(d.taxNumber !== undefined && { taxNumber: d.taxNumber })
        }
      });
    }

    if (body.step === 2) {
      const d = parsed.data as { timezone: string; currency: string; weekStartDay: number };
      await prisma.tenant.update({
        where: { id: auth.tenantId },
        data: { timezone: d.timezone, currency: d.currency, weekStartDay: d.weekStartDay }
      });
    }

    if (body.step === 3) {
      const d = parsed.data as {
        departmentName: string;
        departmentNameAr?: string;
        jobTitleName: string;
        jobTitleNameAr?: string;
      };
      // Use slugified name as the unique code (scoped to tenant)
      const deptCode = d.departmentName
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        .substring(0, 30);
      const jtCode = d.jobTitleName
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        .substring(0, 30);

      // Upsert to avoid duplicates if setup is re-run
      await prisma.department.upsert({
        where: { tenantId_code: { tenantId: auth.tenantId, code: deptCode } },
        update: {},
        create: {
          name: d.departmentName,
          nameAr: d.departmentNameAr ?? d.departmentName,
          code: deptCode,
          tenantId: auth.tenantId
        }
      });
      await prisma.jobTitle.upsert({
        where: { tenantId_code: { tenantId: auth.tenantId, code: jtCode } },
        update: {},
        create: {
          name: d.jobTitleName,
          nameAr: d.jobTitleNameAr ?? d.jobTitleName,
          code: jtCode,
          tenantId: auth.tenantId
        }
      });
    }

    if (body.step === 5) {
      const d = parsed.data as {
        leaveDaysPerYear: number;
        annualLeaveEnabled: boolean;
        sickLeaveEnabled: boolean;
      };
      // Create default leave types if not already present
      const existing = await prisma.leaveType.count({ where: { tenantId: auth.tenantId } });
      if (existing === 0) {
        if (d.annualLeaveEnabled) {
          await prisma.leaveType.create({
            data: {
              name: "Annual Leave",
              nameAr: "إجازة سنوية",
              code: "annual",
              defaultDays: d.leaveDaysPerYear,
              tenantId: auth.tenantId,
              isActive: true
            }
          });
        }
        if (d.sickLeaveEnabled) {
          await prisma.leaveType.create({
            data: {
              name: "Sick Leave",
              nameAr: "إجازة مرضية",
              code: "sick",
              defaultDays: 30,
              tenantId: auth.tenantId,
              isActive: true
            }
          });
        }
      }
    }

    const status = await getSetupStatus(auth.tenantId);
    const response = NextResponse.json({
      ok: true,
      currentStep: status.currentStep,
      completionPercent: getSetupCompletionPercent(status.currentStep)
    });
    return withRateLimitHeaders(response, rateLimit);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "بيانات غير صالحة", issues: err.issues }, { status: 422 });
    }
    logApiError("POST /api/setup", err);
    return NextResponse.json({ error: "حدث خطأ في حفظ بيانات الإعداد" }, { status: 500 });
  }
}
