import { logApiError } from "@/lib/api/route-helper";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

function mapCourseStatus(value: string): string {
  switch (value) {
    case "DRAFT":
      return "draft";
    case "SCHEDULED":
      return "scheduled";
    case "ONGOING":
      return "ongoing";
    case "COMPLETED":
      return "completed";
    case "CANCELLED":
      return "cancelled";
    default:
      return "draft";
  }
}

function mapCourseType(value: string): string {
  switch (value) {
    case "IN_PERSON":
      return "in-person";
    case "ONLINE":
      return "online";
    case "HYBRID":
      return "hybrid";
    case "SELF_PACED":
      return "self-paced";
    case "WORKSHOP":
      return "workshop";
    case "CONFERENCE":
      return "conference";
    default:
      return "in-person";
  }
}

function mapCourseCategory(value: string): string {
  switch (value) {
    case "TECHNICAL":
      return "technical";
    case "SOFT_SKILLS":
      return "soft-skills";
    case "LEADERSHIP":
      return "leadership";
    case "COMPLIANCE":
      return "compliance";
    case "SAFETY":
      return "safety";
    case "ONBOARDING":
      return "onboarding";
    case "OTHER":
    default:
      return "other";
  }
}

function ensureStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v) => typeof v === "string");
}

function parseOptionalDate(value: unknown): Date | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

const createCourseSchema = z.object({
  title: z.string().trim().min(1),
  titleEn: z.string().trim().min(1).optional().or(z.literal("")),
  description: z.string().trim().min(1),
  descriptionEn: z.string().trim().min(1).optional().or(z.literal("")),
  category: z.enum([
    "technical",
    "soft-skills",
    "leadership",
    "compliance",
    "safety",
    "onboarding",
    "other"
  ]),
  type: z.enum(["in-person", "online", "hybrid", "self-paced", "workshop", "conference"]),
  status: z.enum(["draft", "scheduled", "ongoing", "completed", "cancelled"]),
  duration: z.number().int().min(1),
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
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant required" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim();

    const where: any = { tenantId };
    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { titleEn: { contains: q, mode: "insensitive" } }
      ];
    }

    const courses = await prisma.trainingCourse.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      include: {
        _count: { select: { enrollments: true } }
      }
    });

    return NextResponse.json({
      data: {
        courses: courses.map((c) => ({
          id: c.id,
          title: c.title,
          titleEn: c.titleEn ?? undefined,
          description: c.description,
          descriptionEn: c.descriptionEn ?? undefined,
          category: mapCourseCategory(c.category),
          type: mapCourseType(c.type),
          status: mapCourseStatus(c.status),
          instructor: c.instructorName
            ? {
                id: "external",
                name: c.instructorName,
                isExternal: true
              }
            : undefined,
          provider: c.provider ?? undefined,
          duration: c.durationHours,
          maxParticipants: c.maxParticipants ?? undefined,
          currentParticipants: c._count.enrollments,
          startDate: c.startDate ? c.startDate.toISOString() : undefined,
          endDate: c.endDate ? c.endDate.toISOString() : undefined,
          location: c.location ?? undefined,
          meetingLink: c.meetingLink ?? undefined,
          objectives: ensureStringArray(c.objectives),
          prerequisites: ensureStringArray(c.prerequisites),
          materials: [],
          cost: c.cost ? Number(c.cost.toString()) : undefined,
          currency: c.currency,
          isMandatory: c.isMandatory,
          targetDepartments: c.targetDepartments,
          targetRoles: c.targetRoles,
          certificate: undefined,
          rating: undefined,
          createdBy: c.createdByUserId ?? "system",
          createdAt: c.createdAt.toISOString(),
          updatedAt: c.updatedAt.toISOString()
        }))
      }
    });
  } catch (error) {
    logApiError("Error fetching training courses", error);
    return NextResponse.json({ error: "Failed to fetch training courses" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant required" }, { status: 400 });
    }

    const raw = await request.json();
    const parsed = createCourseSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const input = parsed.data;

    const created = await prisma.trainingCourse.create({
      data: {
        tenantId,
        title: input.title,
        titleEn: input.titleEn || null,
        description: input.description,
        descriptionEn: input.descriptionEn || null,
        category: input.category.toUpperCase().replace("-", "_") as any,
        type: input.type.toUpperCase().replace("-", "_") as any,
        status: input.status.toUpperCase().replace("-", "_") as any,
        durationHours: input.duration,
        maxParticipants: input.maxParticipants ?? null,
        startDate: parseOptionalDate(input.startDate),
        endDate: parseOptionalDate(input.endDate),
        instructorName: input.instructorName ?? null,
        provider: input.provider ?? null,
        location: input.location ?? null,
        meetingLink: input.meetingLink ?? null,
        objectives: input.objectives ?? [],
        prerequisites: input.prerequisites ?? [],
        cost: input.cost ?? null,
        currency: input.currency ?? undefined,
        isMandatory: input.isMandatory ?? false,
        targetDepartments: input.targetDepartments ?? [],
        targetRoles: input.targetRoles ?? [],
        createdByUserId: session.user.id ?? null
      },
      include: { _count: { select: { enrollments: true } } }
    });

    return NextResponse.json({
      data: {
        id: created.id
      }
    });
  } catch (error) {
    logApiError("Error creating training course", error);
    return NextResponse.json({ error: "Failed to create training course" }, { status: 500 });
  }
}
