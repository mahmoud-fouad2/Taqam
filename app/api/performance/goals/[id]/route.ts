import { logApiError } from "@/lib/api/route-helper";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant required" }, { status: 400 });
    }

    const { id } = await context.params;
    const body = await request.json();

    const existing = await prisma.performanceGoal.findFirst({
      where: { id, tenantId }
    });

    if (!existing) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    const updated = await prisma.performanceGoal.update({
      where: { id },
      data: {
        status: body.status ? body.status.toUpperCase().replace(/-/g, "_") : undefined,
        progress: body.progress !== undefined ? body.progress : undefined,
        currentValue: body.currentValue !== undefined ? body.currentValue : undefined,
        completedAt: body.status === "completed" && !existing.completedAt ? new Date() : undefined,
        notes: body.notes !== undefined ? body.notes : undefined
      }
    });

    return NextResponse.json({ data: { id: updated.id } });
  } catch (error) {
    logApiError("Error updating goal", error);
    return NextResponse.json({ error: "Failed to update goal" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant required" }, { status: 400 });
    }

    const { id } = await context.params;

    const existing = await prisma.performanceGoal.findFirst({
      where: { id, tenantId }
    });

    if (!existing) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    await prisma.performanceGoal.delete({ where: { id } });

    return NextResponse.json({ data: null });
  } catch (error) {
    logApiError("Error deleting goal", error);
    return NextResponse.json({ error: "Failed to delete goal" }, { status: 500 });
  }
}
