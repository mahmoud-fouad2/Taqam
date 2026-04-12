import { logApiError } from "@/lib/api/route-helper";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

type RouteContext = { params: Promise<{ id: string }> };

function parseOptionalDate(value: unknown): Date | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

const updateCourseSchema = z
  .object({
    title: z.string().trim().min(1).optional(),
    titleEn: z.string().trim().optional().nullable(),
    description: z.string().trim().min(1).optional(),
    descriptionEn: z.string().trim().optional().nullable(),
    category: z
      .enum([
        "technical",
        "soft-skills",
        "leadership",
        "compliance",
        "safety",
        "onboarding",
        "other"
      ])
      .optional(),
    type: z
      .enum(["in-person", "online", "hybrid", "self-paced", "workshop", "conference"])
      .optional(),
    status: z.enum(["draft", "scheduled", "ongoing", "completed", "cancelled"]).optional(),
    duration: z.number().int().min(1).optional(),
    maxParticipants: z.number().int().positive().optional().nullable(),
    startDate: z.string().optional().nullable(),
    endDate: z.string().optional().nullable(),
    instructorName: z.string().trim().optional().nullable(),
    provider: z.string().trim().optional().nullable(),
    location: z.string().trim().optional().nullable(),
    meetingLink: z.string().trim().url().optional().nullable(),
    objectives: z.array(z.string().trim()).optional(),
    prerequisites: z.array(z.string().trim()).optional(),
    cost: z.number().nonnegative().optional().nullable(),
    currency: z.string().trim().min(1).optional().nullable(),
    isMandatory: z.boolean().optional(),
    targetDepartments: z.array(z.string().trim()).optional(),
    targetRoles: z.array(z.string().trim()).optional()
  })
  .strict();

export async function DELETE(_request: NextRequest, context: RouteContext) {
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

    const existing = await prisma.trainingCourse.findFirst({
      where: { id, tenantId },
      select: { id: true }
    });

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.trainingCourse.delete({ where: { id } });

    return NextResponse.json({ data: null });
  } catch (error) {
    logApiError("Error deleting training course", error);
    return NextResponse.json({ error: "Failed to delete training course" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
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

    const existing = await prisma.trainingCourse.findFirst({
      where: { id, tenantId },
      select: { id: true }
    });

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const raw = await request.json();
    const parsed = updateCourseSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const input = parsed.data;

    await prisma.trainingCourse.update({
      where: { id },
      data: {
        title: input.title,
        titleEn: input.titleEn === undefined ? undefined : input.titleEn,
        description: input.description,
        descriptionEn: input.descriptionEn === undefined ? undefined : input.descriptionEn,
        category: input.category
          ? (input.category.toUpperCase().replace("-", "_") as any)
          : undefined,
        type: input.type ? (input.type.toUpperCase().replace("-", "_") as any) : undefined,
        status: input.status ? (input.status.toUpperCase().replace("-", "_") as any) : undefined,
        durationHours: input.duration,
        maxParticipants: input.maxParticipants === undefined ? undefined : input.maxParticipants,
        startDate: input.startDate === undefined ? undefined : parseOptionalDate(input.startDate),
        endDate: input.endDate === undefined ? undefined : parseOptionalDate(input.endDate),
        instructorName: input.instructorName === undefined ? undefined : input.instructorName,
        provider: input.provider === undefined ? undefined : input.provider,
        location: input.location === undefined ? undefined : input.location,
        meetingLink: input.meetingLink === undefined ? undefined : input.meetingLink,
        objectives: input.objectives,
        prerequisites: input.prerequisites,
        cost: input.cost === undefined ? undefined : input.cost,
        currency: input.currency ?? undefined,
        isMandatory: input.isMandatory,
        targetDepartments: input.targetDepartments,
        targetRoles: input.targetRoles
      },
      select: { id: true }
    });

    return NextResponse.json({ data: { id } });
  } catch (error) {
    logApiError("Error updating training course", error);
    return NextResponse.json({ error: "Failed to update training course" }, { status: 500 });
  }
}
