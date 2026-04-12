/**
 * Interviews API Routes
 * /api/recruitment/interviews
 */

import { logApiError } from "@/lib/api/route-helper";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { InterviewStatus, Prisma } from "@prisma/client";
import { InterviewType } from "@prisma/client";
import { z } from "zod";

function mapStatus(status: string): string {
  return status.toLowerCase().replace(/_/g, "-");
}

function mapType(type: string): string {
  return type.toLowerCase().replace(/_/g, "-");
}

function parseInterviewStatus(value: unknown): InterviewStatus | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.toUpperCase().replace(/-/g, "_");
  return normalized in InterviewStatus ? (normalized as InterviewStatus) : undefined;
}

function parseInterviewType(value: unknown): InterviewType | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.toUpperCase().replace(/-/g, "_");
  return normalized in InterviewType ? (normalized as InterviewType) : undefined;
}

function isValidDate(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const d = new Date(value);
  return !Number.isNaN(d.getTime());
}

const interviewCreateSchema = z
  .object({
    applicantId: z.string().min(1),
    jobPostingId: z.string().min(1),
    type: z.string().optional(),
    status: z.string().optional(),
    scheduledAt: z.string().refine(isValidDate, "Invalid scheduledAt"),
    duration: z.number().int().positive().optional().default(60),
    location: z.string().optional().nullable(),
    meetingLink: z.string().url().optional().nullable(),
    interviewerId: z.string().optional().nullable()
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
    const applicantId = searchParams.get("applicantId");
    const jobPostingId = searchParams.get("jobPostingId");
    const status = searchParams.get("status");

    const where: Prisma.InterviewWhereInput = { tenantId };

    if (applicantId) {
      where.applicantId = applicantId;
    }

    if (jobPostingId) {
      where.jobPostingId = jobPostingId;
    }

    if (status) {
      const parsed = parseInterviewStatus(status);
      if (!parsed) {
        return NextResponse.json(
          { success: false, error: `Invalid status: ${status}` },
          { status: 400 }
        );
      }
      where.status = parsed;
    }

    const interviews = await prisma.interview.findMany({
      where,
      include: {
        applicant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        jobPosting: {
          select: {
            id: true,
            title: true,
            titleAr: true
          }
        },
        interviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            firstNameAr: true,
            lastNameAr: true
          }
        }
      },
      orderBy: { scheduledAt: "desc" }
    });

    const result = interviews.map((i) => ({
      id: i.id,
      applicantId: i.applicantId,
      applicantName: `${i.applicant.firstName} ${i.applicant.lastName}`,
      applicantEmail: i.applicant.email,
      jobPostingId: i.jobPostingId,
      jobTitle: i.jobPosting.title,
      type: mapType(i.type),
      status: mapStatus(i.status),
      scheduledAt: i.scheduledAt.toISOString(),
      duration: i.duration,
      location: i.location,
      meetingLink: i.meetingLink,
      interviewerId: i.interviewerId,
      interviewerName: i.interviewer
        ? `${i.interviewer.firstNameAr || i.interviewer.firstName} ${i.interviewer.lastNameAr || i.interviewer.lastName}`
        : null,
      feedback: i.feedback,
      rating: i.rating,
      createdAt: i.createdAt.toISOString(),
      updatedAt: i.updatedAt.toISOString()
    }));

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    logApiError("Error fetching interviews", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch interviews" },
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

    const parsedBody = interviewCreateSchema.safeParse(await request.json());
    if (!parsedBody.success) {
      return NextResponse.json(
        { success: false, error: "Invalid request body", details: parsedBody.error.flatten() },
        { status: 400 }
      );
    }

    const body = parsedBody.data;
    const type = body.type ? parseInterviewType(body.type) : InterviewType.HR;
    if (body.type && !type) {
      return NextResponse.json(
        { success: false, error: `Invalid type: ${body.type}` },
        { status: 400 }
      );
    }

    const status = body.status ? parseInterviewStatus(body.status) : InterviewStatus.SCHEDULED;
    if (body.status && !status) {
      return NextResponse.json(
        { success: false, error: `Invalid status: ${body.status}` },
        { status: 400 }
      );
    }

    const interview = await prisma.interview.create({
      data: {
        tenantId,
        applicantId: body.applicantId,
        jobPostingId: body.jobPostingId,
        type,
        status,
        scheduledAt: new Date(body.scheduledAt),
        duration: body.duration,
        location: body.location,
        meetingLink: body.meetingLink,
        interviewerId: body.interviewerId
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: interview.id,
        type: mapType(interview.type),
        status: mapStatus(interview.status),
        scheduledAt: interview.scheduledAt.toISOString(),
        createdAt: interview.createdAt.toISOString()
      }
    });
  } catch (error) {
    logApiError("Error creating interview", error);
    return NextResponse.json(
      { success: false, error: "Failed to create interview" },
      { status: 500 }
    );
  }
}
