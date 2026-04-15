/**
 * Applicants API Routes
 * /api/recruitment/applicants
 */

import { logApiError } from "@/lib/api/route-helper";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ApplicationStatus, Prisma } from "@prisma/client";
import { z } from "zod";

function mapStatus(status: string): string {
  return status.toLowerCase().replace(/_/g, "-");
}

function parseApplicationStatus(value: unknown): ApplicationStatus | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.toUpperCase().replace(/-/g, "_");
  return normalized in ApplicationStatus ? (normalized as ApplicationStatus) : undefined;
}

const applicantCreateSchema = z
  .object({
    jobPostingId: z.string().min(1),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().optional().nullable(),
    resumeUrl: z.string().url().optional().nullable(),
    coverLetter: z.string().optional().nullable(),
    status: z.string().optional(),
    source: z.string().optional().default("career-portal"),
    rating: z.number().int().min(1).max(5).optional().nullable(),
    notes: z.string().optional().nullable()
  })
  .strict();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) {
      return NextResponse.json({ success: false, error: "No tenant" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const jobPostingId = searchParams.get("jobPostingId");
    const status = searchParams.get("status");

    const where: Prisma.ApplicantWhereInput = { tenantId };

    if (jobPostingId) {
      where.jobPostingId = jobPostingId;
    }

    if (status) {
      const parsed = parseApplicationStatus(status);
      if (!parsed) {
        return NextResponse.json(
          { success: false, error: `Invalid status: ${status}` },
          { status: 400 }
        );
      }
      where.status = parsed;
    }

    const applicants = await prisma.applicant.findMany({
      where,
      include: {
        jobPosting: {
          select: {
            id: true,
            title: true,
            titleAr: true
          }
        },
        _count: {
          select: {
            interviews: true
          }
        }
      },
      orderBy: { appliedAt: "desc" }
    });

    const result = applicants.map((a) => ({
      id: a.id,
      jobPostingId: a.jobPostingId,
      jobTitle: a.jobPosting.title,
      firstName: a.firstName,
      lastName: a.lastName,
      email: a.email,
      phone: a.phone,
      resumeUrl: a.resumeUrl ? `/api/recruitment/applicants/${a.id}/resume` : null,
      coverLetter: a.coverLetter,
      status: mapStatus(a.status),
      source: a.source,
      rating: a.rating,
      notes: a.notes,
      appliedAt: a.appliedAt.toISOString(),
      interviewsCount: a._count.interviews,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString()
    }));

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    logApiError("Error fetching applicants", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch applicants" },
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

    const parsedBody = applicantCreateSchema.safeParse(await request.json());
    if (!parsedBody.success) {
      return NextResponse.json(
        { success: false, error: "Invalid request body", details: parsedBody.error.flatten() },
        { status: 400 }
      );
    }

    const body = parsedBody.data;
    let status: ApplicationStatus = ApplicationStatus.NEW;
    if (body.status) {
      const parsed = parseApplicationStatus(body.status);
      if (!parsed) {
        return NextResponse.json(
          { success: false, error: `Invalid status: ${body.status}` },
          { status: 400 }
        );
      }
      status = parsed;
    }

    const applicant = await prisma.applicant.create({
      data: {
        tenantId,
        jobPostingId: body.jobPostingId,
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone,
        resumeUrl: body.resumeUrl,
        coverLetter: body.coverLetter,
        status,
        source: body.source,
        rating: body.rating ?? undefined,
        notes: body.notes
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: applicant.id,
        firstName: applicant.firstName,
        lastName: applicant.lastName,
        status: mapStatus(applicant.status),
        createdAt: applicant.createdAt.toISOString()
      }
    });
  } catch (error) {
    logApiError("Error creating applicant", error);
    return NextResponse.json(
      { success: false, error: "Failed to create applicant" },
      { status: 500 }
    );
  }
}
