import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

// ==================== GET - Get Single Interview ====================
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const { id } = await context.params;

    const interview = await prisma.interview.findFirst({
      where: {
        id,
        applicant: {
          jobPosting: {
            tenantId: session.user.tenantId
          }
        }
      },
      include: {
        applicant: {
          include: {
            jobPosting: {
              include: {
                department: true,
                jobTitle: true
              }
            }
          }
        },
        interviewer: {
          select: {
            id: true,
            firstNameAr: true,
            lastNameAr: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        jobPosting: {
          include: {
            department: true,
            jobTitle: true
          }
        }
      }
    });

    if (!interview) {
      return NextResponse.json({ error: "المقابلة غير موجودة" }, { status: 404 });
    }

    // Map status to kebab-case
    const mappedInterview = {
      ...interview,
      type: interview.type.toLowerCase().replace(/_/g, "-"),
      status: interview.status.toLowerCase().replace(/_/g, "-"),
      applicant: {
        ...interview.applicant,
        status: interview.applicant.status.toLowerCase().replace(/_/g, "-")
      },
      jobPosting: {
        ...interview.jobPosting,
        status: interview.jobPosting.status.toLowerCase().replace(/_/g, "-"),
        jobType: interview.jobPosting.jobType.toLowerCase().replace(/_/g, "-"),
        experienceLevel: interview.jobPosting.experienceLevel.toLowerCase().replace(/_/g, "-")
      }
    };

    return NextResponse.json(mappedInterview);
  } catch (error) {
    console.error("Error fetching interview:", error);
    return NextResponse.json({ error: "فشل في جلب المقابلة" }, { status: 500 });
  }
}

// ==================== DELETE - Delete Interview ====================
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const { id } = await context.params;

    // Check if interview exists
    const existing = await prisma.interview.findFirst({
      where: {
        id,
        applicant: {
          jobPosting: {
            tenantId: session.user.tenantId
          }
        }
      }
    });

    if (!existing) {
      return NextResponse.json({ error: "المقابلة غير موجودة" }, { status: 404 });
    }

    // Don't allow deletion if interview is completed
    if (existing.status === "COMPLETED") {
      return NextResponse.json({ error: "لا يمكن حذف مقابلة مكتملة" }, { status: 400 });
    }

    await prisma.interview.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting interview:", error);
    return NextResponse.json({ error: "فشل في حذف المقابلة" }, { status: 500 });
  }
}
