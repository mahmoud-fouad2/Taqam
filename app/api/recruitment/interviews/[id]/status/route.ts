import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { z } from "zod";

type RouteContext = { params: Promise<{ id: string }> };

// ==================== PATCH - Update Interview Status ====================
const schema = z.object({
  status: z.enum(["scheduled", "completed", "cancelled", "no-show"]),
});

function mapStatusToDb(status: string) {
  return status.toUpperCase().replace(/-/g, "_");
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    
    const { status } = schema.parse(body);

    // Check if interview exists
    const existing = await prisma.interview.findFirst({
      where: {
        id,
        applicant: {
          jobPosting: {
            tenantId: session.user.tenantId,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "المقابلة غير موجودة" },
        { status: 404 }
      );
    }

    const updated = await prisma.interview.update({
      where: { id },
      data: { 
        status: mapStatusToDb(status) as any,
      },
      include: {
        applicant: true,
        interviewer: {
          select: {
            id: true,
            firstNameAr: true,
            lastNameAr: true,
            firstName: true,
            lastName: true,
          },
        },
        jobPosting: {
          include: {
            department: true,
            jobTitle: true,
          },
        },
      },
    });

    // Map back to kebab-case
    const mappedInterview = {
      ...updated,
      type: updated.type.toLowerCase().replace(/_/g, "-"),
      status: updated.status.toLowerCase().replace(/_/g, "-"),
    };

    return NextResponse.json(mappedInterview);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "بيانات غير صالحة", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error updating interview status:", error);
    return NextResponse.json(
      { error: "فشل في تحديث حالة المقابلة" },
      { status: 500 }
    );
  }
}
