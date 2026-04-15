import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { logApiError, requireTenantSession } from "@/lib/api/route-helper";

const updateWorkflowSchema = z.object({
  enabled: z.boolean()
});

type RouteParams = { params: Promise<{ id: string }> };

function canManageAutomation(role: string | undefined) {
  return role === "TENANT_ADMIN" || role === "HR_MANAGER";
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const result = await requireTenantSession(req);
    if (!result.ok) return result.response;

    const { tenantId, session } = result;
    if (!canManageAutomation(session.user.role)) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updateWorkflowSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" },
        { status: 400 }
      );
    }

    const existing = await prisma.workflowDefinition.findFirst({
      where: { id, tenantId },
      select: { id: true }
    });

    if (!existing) {
      return NextResponse.json({ error: "Workflow غير موجود" }, { status: 404 });
    }

    const updated = await prisma.workflowDefinition.update({
      where: { id },
      data: {
        enabled: parsed.data.enabled
      },
      select: {
        id: true,
        enabled: true,
        name: true,
        description: true,
        updatedAt: true
      }
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    logApiError("PATCH automation workflow error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
