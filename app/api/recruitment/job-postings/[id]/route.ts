import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { z } from "zod";

type RouteContext = { params: Promise<{ id: string }> };

// ==================== GET - Get Single Job Posting ====================
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const { id } = await context.params;

    const jobPosting = await prisma.jobPosting.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId
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
    console.error("Error fetching job posting:", error);
    return NextResponse.json({ error: "فشل في جلب الوظيفة" }, { status: 500 });
  }
}

// ==================== PUT - Update Job Posting ====================
const updateSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  requirements: z.array(z.string()).optional(),
  responsibilities: z.array(z.string()).optional(),
  benefits: z.array(z.string()).optional(),
  status: z.enum(["draft", "active", "closed", "filled"]).optional(),
  departmentId: z.string().optional(),
  jobTitleId: z.string().optional(),
  jobType: z.enum(["full-time", "part-time", "contract", "internship"]).optional(),
  experienceLevel: z.enum(["entry", "intermediate", "senior", "executive"]).optional(),
  location: z.string().optional(),
  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),
  deadline: z.string().optional()
});

function mapStatusToDb(status: string) {
  return status.toUpperCase().replace(/-/g, "_");
}

function mapJobTypeToDb(type: string) {
  return type.toUpperCase().replace(/-/g, "_");
}

function mapExperienceLevelToDb(level: string) {
  return level.toUpperCase().replace(/-/g, "_");
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();

    const validated = updateSchema.parse(body);

    // Check if job posting exists
    const existing = await prisma.jobPosting.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId
      }
    });

    if (!existing) {
      return NextResponse.json({ error: "الوظيفة غير موجودة" }, { status: 404 });
    }

    // Map kebab-case to SCREAMING_SNAKE_CASE for DB
    const updateData: Record<string, unknown> = {};

    if (validated.title !== undefined) updateData.title = validated.title;
    if (validated.description !== undefined) updateData.description = validated.description;
    if (validated.requirements !== undefined) updateData.requirements = validated.requirements;
    if (validated.responsibilities !== undefined)
      updateData.responsibilities = validated.responsibilities;
    if (validated.benefits !== undefined) updateData.benefits = validated.benefits;
    if (validated.departmentId !== undefined) updateData.departmentId = validated.departmentId;
    if (validated.jobTitleId !== undefined) updateData.jobTitleId = validated.jobTitleId;
    if (validated.location !== undefined) updateData.location = validated.location;
    if (validated.salaryMin !== undefined) updateData.salaryMin = validated.salaryMin;
    if (validated.salaryMax !== undefined) updateData.salaryMax = validated.salaryMax;
    if (validated.deadline !== undefined) updateData.deadline = new Date(validated.deadline);

    if (validated.status !== undefined) {
      updateData.status = mapStatusToDb(validated.status);
    }
    if (validated.jobType !== undefined) {
      updateData.jobType = mapJobTypeToDb(validated.jobType);
    }
    if (validated.experienceLevel !== undefined) {
      updateData.experienceLevel = mapExperienceLevelToDb(validated.experienceLevel);
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
    console.error("Error updating job posting:", error);
    return NextResponse.json({ error: "فشل في تحديث الوظيفة" }, { status: 500 });
  }
}

// ==================== DELETE - Delete Job Posting ====================
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const { id } = await context.params;

    // Check if job posting exists
    const existing = await prisma.jobPosting.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId
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
    console.error("Error deleting job posting:", error);
    return NextResponse.json({ error: "فشل في حذف الوظيفة" }, { status: 500 });
  }
}
