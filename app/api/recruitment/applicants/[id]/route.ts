import { logApiError } from "@/lib/api/route-helper";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { z } from "zod";

type RouteContext = { params: Promise<{ id: string }> };

// ==================== GET - Get Single Applicant ====================
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const { id } = await context.params;

    const applicant = await prisma.applicant.findFirst({
      where: {
        id,
        jobPosting: {
          tenantId: session.user.tenantId
        }
      },
      include: {
        jobPosting: {
          include: {
            department: true,
            jobTitle: true
          }
        },
        interviews: {
          include: {
            interviewer: {
              select: {
                id: true,
                firstNameAr: true,
                lastNameAr: true,
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    });

    if (!applicant) {
      return NextResponse.json({ error: "المتقدم غير موجود" }, { status: 404 });
    }

    // Map status to kebab-case
    const mappedApplicant = {
      ...applicant,
      status: applicant.status.toLowerCase().replace(/_/g, "-"),
      jobPosting: {
        ...applicant.jobPosting,
        status: applicant.jobPosting.status.toLowerCase().replace(/_/g, "-"),
        jobType: applicant.jobPosting.jobType.toLowerCase().replace(/_/g, "-"),
        experienceLevel: applicant.jobPosting.experienceLevel.toLowerCase().replace(/_/g, "-")
      },
      interviews: applicant.interviews.map((i) => ({
        ...i,
        type: i.type.toLowerCase().replace(/_/g, "-"),
        status: i.status.toLowerCase().replace(/_/g, "-")
      }))
    };

    return NextResponse.json(mappedApplicant);
  } catch (error) {
    logApiError("Error fetching applicant", error);
    return NextResponse.json({ error: "فشل في جلب المتقدم" }, { status: 500 });
  }
}

// ==================== PUT - Update Applicant ====================
const updateSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  resumeUrl: z.string().optional(),
  coverLetter: z.string().optional(),
  status: z
    .enum([
      "new",
      "screening",
      "shortlisted",
      "interview",
      "offer",
      "accepted",
      "rejected",
      "withdrawn"
    ])
    .optional(),
  rating: z.number().min(1).max(5).optional(),
  notes: z.string().optional(),
  source: z.string().optional()
});

function mapStatusToDb(status: string) {
  return status.toUpperCase().replace(/-/g, "_");
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

    // Check if applicant exists
    const existing = await prisma.applicant.findFirst({
      where: {
        id,
        jobPosting: {
          tenantId: session.user.tenantId
        }
      }
    });

    if (!existing) {
      return NextResponse.json({ error: "المتقدم غير موجود" }, { status: 404 });
    }

    // Map kebab-case to SCREAMING_SNAKE_CASE for DB
    const updateData: Record<string, unknown> = { ...validated };

    if (validated.status !== undefined) {
      updateData.status = mapStatusToDb(validated.status);
    }

    const updated = await prisma.applicant.update({
      where: { id },
      data: updateData,
      include: {
        jobPosting: {
          include: {
            department: true,
            jobTitle: true
          }
        }
      }
    });

    // Map back to kebab-case
    const mappedApplicant = {
      ...updated,
      status: updated.status.toLowerCase().replace(/_/g, "-")
    };

    return NextResponse.json(mappedApplicant);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "بيانات غير صالحة", details: error.errors },
        { status: 400 }
      );
    }
    logApiError("Error updating applicant", error);
    return NextResponse.json({ error: "فشل في تحديث المتقدم" }, { status: 500 });
  }
}

// ==================== DELETE - Delete Applicant ====================
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const { id } = await context.params;

    // Check if applicant exists
    const existing = await prisma.applicant.findFirst({
      where: {
        id,
        jobPosting: {
          tenantId: session.user.tenantId
        }
      },
      include: {
        interviews: {
          select: { id: true }
        }
      }
    });

    if (!existing) {
      return NextResponse.json({ error: "المتقدم غير موجود" }, { status: 404 });
    }

    // Delete related interviews first
    if (existing.interviews.length > 0) {
      await prisma.interview.deleteMany({
        where: { applicantId: id }
      });
    }

    await prisma.applicant.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logApiError("Error deleting applicant", error);
    return NextResponse.json({ error: "فشل في حذف المتقدم" }, { status: 500 });
  }
}
