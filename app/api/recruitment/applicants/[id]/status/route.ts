import { logApiError } from "@/lib/api/route-helper";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { z } from "zod";

type RouteContext = { params: Promise<{ id: string }> };

// ==================== PATCH - Update Applicant Status ====================
const schema = z.object({
  status: z.enum([
    "new",
    "screening",
    "shortlisted",
    "interview",
    "offer",
    "accepted",
    "rejected",
    "withdrawn"
  ])
});

function mapStatusToDb(status: string) {
  return status.toUpperCase().replace(/-/g, "_");
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();

    const { status } = schema.parse(body);

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

    const updated = await prisma.applicant.update({
      where: { id },
      data: {
        status: mapStatusToDb(status) as any
      },
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
    logApiError("Error updating applicant status", error);
    return NextResponse.json({ error: "فشل في تحديث حالة المتقدم" }, { status: 500 });
  }
}
