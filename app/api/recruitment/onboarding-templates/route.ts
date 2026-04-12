/**
 * Onboarding Templates API
 * /api/recruitment/onboarding-templates
 */

import { logApiError } from "@/lib/api/route-helper";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) {
      return NextResponse.json({ success: false, error: "No tenant" }, { status: 400 });
    }

    const templates = await prisma.onboardingTemplate.findMany({
      where: { tenantId },
      include: {
        department: { select: { id: true, name: true } },
        jobTitle: { select: { id: true, name: true } }
      },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }]
    });

    const result = templates.map((t) => ({
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
    }));

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    logApiError("Error fetching onboarding templates", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch onboarding templates" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) {
      return NextResponse.json({ success: false, error: "No tenant" }, { status: 400 });
    }

    const body = await request.json();
    if (!body.name) {
      return NextResponse.json({ success: false, error: "Missing name" }, { status: 400 });
    }

    const created = await prisma.onboardingTemplate.create({
      data: {
        tenantId,
        name: body.name,
        description: body.description ?? null,
        departmentId: body.departmentId ?? null,
        jobTitleId: body.jobTitleId ?? null,
        isDefault: Boolean(body.isDefault),
        tasks: body.tasks ?? [],
        documents: body.documents ?? [],
        durationDays: body.duration ?? body.durationDays ?? 30,
        createdById: session.user.id
      },
      include: {
        department: { select: { id: true, name: true } },
        jobTitle: { select: { id: true, name: true } }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: created.id,
        name: created.name,
        description: created.description ?? undefined,
        departmentId: created.departmentId ?? undefined,
        departmentName: created.department?.name ?? undefined,
        jobTitleId: created.jobTitleId ?? undefined,
        jobTitleName: created.jobTitle?.name ?? undefined,
        isDefault: created.isDefault,
        tasks: (created.tasks as any) ?? [],
        documents: (created.documents as any) ?? [],
        duration: created.durationDays,
        createdBy: created.createdById,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString()
      }
    });
  } catch (error) {
    logApiError("Error creating onboarding template", error);
    return NextResponse.json(
      { success: false, error: "Failed to create onboarding template" },
      { status: 500 }
    );
  }
}
