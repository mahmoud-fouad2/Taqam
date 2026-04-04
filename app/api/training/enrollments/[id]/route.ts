import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import {
  notifyTrainingEnrollmentApproved,
  notifyTrainingEnrollmentRejected,
  notifyTrainingCompleted,
} from "@/lib/notifications/send";

type RouteContext = { params: Promise<{ id: string }> };

const patchSchema = z
  .object({
    status: z
      .enum([
        "pending",
        "approved",
        "rejected",
        "enrolled",
        "in-progress",
        "completed",
        "failed",
        "withdrawn",
      ])
      .optional(),
    progress: z.number().int().min(0).max(100).optional(),
    score: z.number().min(0).max(100).optional().nullable(),
    feedback: z.string().trim().optional().nullable(),
  })
  .strict();

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

    const existing = await prisma.trainingEnrollment.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        status: true,
        employee: { select: { userId: true } },
        course: { select: { title: true } },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const raw = await request.json();
    const parsed = patchSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const input = parsed.data;

    const updated = await prisma.trainingEnrollment.update({
      where: { id },
      data: {
        status: input.status
          ? (input.status.toUpperCase().replace("-", "_") as any)
          : undefined,
        progress: input.progress,
        score: input.score === undefined ? undefined : input.score,
        feedback: input.feedback === undefined ? undefined : input.feedback,
        approvedAt: input.status === "approved" ? new Date() : undefined,
        completedAt: input.status === "completed" ? new Date() : undefined,
      },
      select: { id: true, status: true, progress: true, score: true, feedback: true },
    });

    const responseData = {
      data: {
        id: updated.id,
        status: updated.status,
        progress: updated.progress,
        score: updated.score ? Number(updated.score.toString()) : null,
        feedback: updated.feedback,
      },
    };

    // Fire notifications (non-blocking)
    const employeeUserId = existing.employee.userId;
    if (employeeUserId && input.status) {
      const courseTitle = existing.course.title;
      const notifyMap: Record<string, () => void> = {
        approved: () =>
          notifyTrainingEnrollmentApproved({ tenantId, employeeUserId, courseTitle, enrollmentId: id }).catch(console.error),
        rejected: () =>
          notifyTrainingEnrollmentRejected({ tenantId, employeeUserId, courseTitle, enrollmentId: id }).catch(console.error),
        completed: () =>
          notifyTrainingCompleted({
            tenantId,
            employeeUserId,
            courseTitle,
            score: input.score ?? undefined,
            enrollmentId: id,
          }).catch(console.error),
      };
      notifyMap[input.status]?.();
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error updating training enrollment:", error);
    return NextResponse.json({ error: "Failed to update training enrollment" }, { status: 500 });
  }
}
