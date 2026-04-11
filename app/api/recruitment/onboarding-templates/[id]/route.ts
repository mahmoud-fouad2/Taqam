/**
 * Onboarding Template (single)
 * /api/recruitment/onboarding-templates/:id
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) {
      return NextResponse.json({ success: false, error: "No tenant" }, { status: 400 });
    }

    const { id } = await context.params;

    const t = await prisma.onboardingTemplate.findFirst({
      where: { id, tenantId },
      include: {
        department: { select: { id: true, name: true } },
        jobTitle: { select: { id: true, name: true } }
      }
    });

    if (!t) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: t.id,
        name: t.name,
        description: t.description ?? undefined,
        departmentId: t.departmentId ?? undefined,
        departmentName: t.department?.name ?? undefined,
        jobTitleId: t.jobTitleId ?? undefined,
        jobTitleName: t.jobTitle?.name ?? undefined,
        isDefault: t.isDefault,
        tasks: (t.tasks as any) ?? [],
        documents: (t.documents as any) ?? [],
        duration: t.durationDays,
        createdBy: t.createdById,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString()
      }
    });
  } catch (error) {
    console.error("Error fetching onboarding template:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch onboarding template" },
      { status: 500 }
    );
  }
}
