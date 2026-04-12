import { NextRequest, NextResponse } from "next/server";
import { ExperienceLevel, JobPostingStatus, JobType } from "@prisma/client";
import prisma from "@/lib/db";
import { z } from "zod";
import { logApiError, requireRole } from "@/lib/api/route-helper";

type RouteContext = { params: Promise<{ id: string }> };
const RECRUITMENT_ALLOWED_ROLES = ["TENANT_ADMIN", "HR_MANAGER"];

// ==================== GET - Get Single Job Posting ====================
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireRole(_request, RECRUITMENT_ALLOWED_ROLES);
    if (!auth.ok) return auth.response;
    const { tenantId } = auth;

    const { id } = await context.params;

    const jobPosting = await prisma.jobPosting.findFirst({
      where: {
        id,
        tenantId
      },
      include: {
        department: true,
        jobTitle: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        applicants: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            status: true
          }
        }
      }
    });

    if (!jobPosting) {
      return NextResponse.json({ error: "الوظيفة غير موجودة" }, { status: 404 });
    }

    // Map status to kebab-case
    const mappedJobPosting = {
      ...jobPosting,
      status: jobPosting.status.toLowerCase().replace(/_/g, "-"),
      jobType: jobPosting.jobType.toLowerCase().replace(/_/g, "-"),
      experienceLevel: jobPosting.experienceLevel.toLowerCase().replace(/_/g, "-"),
      applicants: jobPosting.applicants.map((a) => ({
        ...a,
        status: a.status.toLowerCase().replace(/_/g, "-")
      }))
    };

    return NextResponse.json(mappedJobPosting);
  } catch (error) {
    logApiError("Error fetching job posting", error);
    return NextResponse.json({ error: "فشل في جلب الوظيفة" }, { status: 500 });
  }
}

// ==================== PUT - Update Job Posting ====================
function isValidDate(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const d = new Date(value);
  return !Number.isNaN(d.getTime());
}

const updateSchema = z
  .object({
    title: z.string().min(2).optional(),
    titleAr: z.string().min(2).optional().nullable(),
    description: z.string().min(5).optional(),
    requirements: z
      .union([z.string(), z.array(z.string())])
      .optional()
      .nullable(),
    responsibilities: z
      .union([z.string(), z.array(z.string())])
      .optional()
      .nullable(),
    benefits: z
      .union([z.string(), z.array(z.string())])
      .optional()
      .nullable(),
    status: z.string().optional(),
    departmentId: z.string().optional().nullable(),
    jobTitleId: z.string().optional().nullable(),
    jobType: z.string().optional(),
    experienceLevel: z.string().optional(),
    positions: z.number().int().positive().optional(),
    location: z.string().optional().nullable(),
    salaryMin: z.union([z.string(), z.number()]).optional().nullable(),
    salaryMax: z.union([z.string(), z.number()]).optional().nullable(),
    salaryCurrency: z.string().min(1).optional(),
    postedAt: z.string().refine(isValidDate, "Invalid postedAt").optional().nullable(),
    expiresAt: z.string().refine(isValidDate, "Invalid expiresAt").optional().nullable(),
    deadline: z.string().refine(isValidDate, "Invalid deadline").optional().nullable()
  })
  .strict();

function parseJobPostingStatus(value: unknown): JobPostingStatus | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.toUpperCase().replace(/-/g, "_");
  return normalized in JobPostingStatus ? (normalized as JobPostingStatus) : undefined;
}

function parseJobType(value: unknown): JobType | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.toUpperCase().replace(/-/g, "_");
  return normalized in JobType ? (normalized as JobType) : undefined;
}

function parseExperienceLevel(value: unknown): ExperienceLevel | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.toUpperCase().replace(/-/g, "_");
  return normalized in ExperienceLevel ? (normalized as ExperienceLevel) : undefined;
}

function normalizeMultilineField(
  value: string | string[] | null | undefined
): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;

  if (Array.isArray(value)) {
    const joined = value
      .map((item) => item.trim())
      .filter(Boolean)
      .join("\n");

    return joined || null;
  }

  const trimmed = value.trim();
  return trimmed || null;
}

function parseOptionalNumber(
  value: string | number | null | undefined,
  field: string
): { ok: true; value: number | null | undefined } | { ok: false; message: string } {
  if (value === undefined) return { ok: true, value: undefined };
  if (value === null) return { ok: true, value: null };

  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) {
    return { ok: false, message: `${field} must be a valid number` };
  }

  return { ok: true, value: parsed };
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireRole(request, RECRUITMENT_ALLOWED_ROLES);
    if (!auth.ok) return auth.response;
    const { tenantId } = auth;

    const { id } = await context.params;
    const body = await request.json();

    const validated = updateSchema.parse(body);
    const salaryMin = parseOptionalNumber(validated.salaryMin, "salaryMin");
    if (!salaryMin.ok) {
      return NextResponse.json({ error: salaryMin.message }, { status: 400 });
    }

    const salaryMax = parseOptionalNumber(validated.salaryMax, "salaryMax");
    if (!salaryMax.ok) {
      return NextResponse.json({ error: salaryMax.message }, { status: 400 });
    }

    if (
      salaryMin.value !== undefined &&
      salaryMin.value !== null &&
      salaryMax.value !== undefined &&
      salaryMax.value !== null &&
      salaryMin.value > salaryMax.value
    ) {
      return NextResponse.json(
        { error: "الحد الأدنى للراتب يجب أن يكون أقل من أو يساوي الحد الأعلى" },
        { status: 400 }
      );
    }

    // Check if job posting exists
    const existing = await prisma.jobPosting.findFirst({
      where: {
        id,
        tenantId
      }
    });

    if (!existing) {
      return NextResponse.json({ error: "الوظيفة غير موجودة" }, { status: 404 });
    }

    // Map kebab-case to SCREAMING_SNAKE_CASE for DB
    const updateData: Record<string, unknown> = {};

    if (validated.title !== undefined) updateData.title = validated.title;
    if (validated.titleAr !== undefined) updateData.titleAr = validated.titleAr;
    if (validated.description !== undefined) updateData.description = validated.description;
    if (validated.requirements !== undefined) {
      updateData.requirements = normalizeMultilineField(validated.requirements);
    }
    if (validated.responsibilities !== undefined)
      updateData.responsibilities = normalizeMultilineField(validated.responsibilities);
    if (validated.benefits !== undefined)
      updateData.benefits = normalizeMultilineField(validated.benefits);
    if (validated.departmentId !== undefined) updateData.departmentId = validated.departmentId;
    if (validated.jobTitleId !== undefined) updateData.jobTitleId = validated.jobTitleId;
    if (validated.location !== undefined) updateData.location = validated.location;
    if (validated.positions !== undefined) updateData.positions = validated.positions;
    if (salaryMin.value !== undefined) updateData.salaryMin = salaryMin.value;
    if (salaryMax.value !== undefined) updateData.salaryMax = salaryMax.value;
    if (validated.salaryCurrency !== undefined)
      updateData.salaryCurrency = validated.salaryCurrency;
    if (validated.postedAt !== undefined) {
      updateData.postedAt = validated.postedAt ? new Date(validated.postedAt) : null;
    }
    if (validated.expiresAt !== undefined || validated.deadline !== undefined) {
      const expiresAt = validated.expiresAt ?? validated.deadline;
      updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;
    }

    if (validated.status !== undefined) {
      const status = parseJobPostingStatus(validated.status);
      if (!status) {
        return NextResponse.json({ error: "حالة الوظيفة غير صالحة" }, { status: 400 });
      }

      updateData.status = status;
    }
    if (validated.jobType !== undefined) {
      const jobType = parseJobType(validated.jobType);
      if (!jobType) {
        return NextResponse.json({ error: "نوع الوظيفة غير صالح" }, { status: 400 });
      }

      updateData.jobType = jobType;
    }
    if (validated.experienceLevel !== undefined) {
      const experienceLevel = parseExperienceLevel(validated.experienceLevel);
      if (!experienceLevel) {
        return NextResponse.json({ error: "مستوى الخبرة غير صالح" }, { status: 400 });
      }

      updateData.experienceLevel = experienceLevel;
    }

    const updated = await prisma.jobPosting.update({
      where: { id },
      data: updateData,
      include: {
        department: true,
        jobTitle: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Map back to kebab-case
    const mappedJobPosting = {
      ...updated,
      status: updated.status.toLowerCase().replace(/_/g, "-"),
      jobType: updated.jobType.toLowerCase().replace(/_/g, "-"),
      experienceLevel: updated.experienceLevel.toLowerCase().replace(/_/g, "-")
    };

    return NextResponse.json(mappedJobPosting);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "بيانات غير صالحة", details: error.errors },
        { status: 400 }
      );
    }
    logApiError("Error updating job posting", error);
    return NextResponse.json({ error: "فشل في تحديث الوظيفة" }, { status: 500 });
  }
}

// ==================== DELETE - Delete Job Posting ====================
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireRole(_request, RECRUITMENT_ALLOWED_ROLES);
    if (!auth.ok) return auth.response;
    const { tenantId } = auth;

    const { id } = await context.params;

    // Check if job posting exists
    const existing = await prisma.jobPosting.findFirst({
      where: {
        id,
        tenantId
      },
      include: {
        applicants: {
          select: { id: true }
        }
      }
    });

    if (!existing) {
      return NextResponse.json({ error: "الوظيفة غير موجودة" }, { status: 404 });
    }

    // Don't allow deletion if there are applicants
    if (existing.applicants.length > 0) {
      return NextResponse.json({ error: "لا يمكن حذف وظيفة تحتوي على متقدمين" }, { status: 400 });
    }

    await prisma.jobPosting.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logApiError("Error deleting job posting", error);
    return NextResponse.json({ error: "فشل في حذف الوظيفة" }, { status: 500 });
  }
}
