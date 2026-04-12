import { logApiError } from "@/lib/api/route-helper";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { z } from "zod";

type RouteContext = { params: Promise<{ id: string }> };

// ==================== POST - Submit Interview Feedback ====================
const schema = z.object({
  feedback: z.object({
    rating: z.number().min(1).max(5),
    strengths: z.array(z.string()),
    weaknesses: z.array(z.string()),
    recommendation: z.enum([
      "strongly-recommend",
      "recommend",
      "neutral",
      "not-recommend",
      "strongly-not-recommend"
    ]),
    notes: z.string().optional()
  })
});

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();

    const { feedback } = schema.parse(body);

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

    // Update interview with feedback and mark as completed
    const updated = await prisma.interview.update({
      where: { id },
      data: {
        feedback: feedback as unknown as Record<string, unknown>,
        status: "COMPLETED"
      },
      include: {
        applicant: true,
        interviewer: {
          select: {
            id: true,
            firstNameAr: true,
            lastNameAr: true,
            firstName: true,
            lastName: true
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

    // Map back to kebab-case
    const mappedInterview = {
      ...updated,
      type: updated.type.toLowerCase().replace(/_/g, "-"),
      status: updated.status.toLowerCase().replace(/_/g, "-")
    };

    return NextResponse.json(mappedInterview);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "بيانات غير صالحة", details: error.errors },
        { status: 400 }
      );
    }
    logApiError("Error submitting interview feedback", error);
    return NextResponse.json({ error: "فشل في حفظ تقييم المقابلة" }, { status: 500 });
  }
}
