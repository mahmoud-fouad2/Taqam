/**
 * Job Postings API Routes
 * /api/recruitment/job-postings
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { ExperienceLevel, JobPostingStatus, JobType, Prisma } from "@prisma/client";
import { z } from "zod";
import { requireRole } from "@/lib/api/route-helper";

const RECRUITMENT_ALLOWED_ROLES = ["TENANT_ADMIN", "HR_MANAGER"];

// Map DB status to kebab-case
function mapStatus(status: string): string {
  return status.toLowerCase().replace(/_/g, "-");
}

// Map DB enum values to kebab-case
function mapJobType(type: string): string {
  return type.toLowerCase().replace(/_/g, "-");
}

function mapExperienceLevel(level: string): string {
  return level.toLowerCase();
}

function parseJobPostingStatus(value: unknown): JobPostingStatus | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.toUpperCase().replace(/-/g, "_");
  return normalized in JobPostingStatus ? (normalized as JobPostingStatus) : undefined;
}

function parseJobType(value: unknown): JobType | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.toUpperCase().replace(/-/g, "_");
  return normalized in JobType ? (normalized as JobType) : undefined;
}

function parseExperienceLevel(value: unknown): ExperienceLevel | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.toUpperCase();
  return normalized in ExperienceLevel ? (normalized as ExperienceLevel) : undefined;
}

function isValidDate(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const d = new Date(value);
  return !Number.isNaN(d.getTime());
}

const jobPostingCreateSchema = z
  .object({
    title: z.string().min(2),
    titleAr: z.string().min(2).optional().nullable(),
    description: z.string().min(5),
    requirements: z.string().optional().nullable(),
    responsibilities: z.string().optional().nullable(),
    benefits: z.string().optional().nullable(),
    departmentId: z.string().optional().nullable(),
    jobTitleId: z.string().optional().nullable(),
    status: z.string().optional(),
    jobType: z.string().optional(),
    experienceLevel: z.string().optional(),
    positions: z.number().int().positive().optional().default(1),
    location: z.string().optional().nullable(),
    salaryMin: z.union([z.string(), z.number()]).optional().nullable(),
    salaryMax: z.union([z.string(), z.number()]).optional().nullable(),
    salaryCurrency: z.string().min(1).optional().default("SAR"),
    postedAt: z.string().refine(isValidDate, "Invalid postedAt").optional().nullable(),
    expiresAt: z.string().refine(isValidDate, "Invalid expiresAt").optional().nullable()
  })
  .strict();

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, RECRUITMENT_ALLOWED_ROLES);
    if (!auth.ok) return auth.response;
    const { tenantId } = auth;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const departmentId = searchParams.get("departmentId");

    const where: Prisma.JobPostingWhereInput = { tenantId };

    if (status) {
      const parsed = parseJobPostingStatus(status);
      if (!parsed) {
        return NextResponse.json(
          { success: false, error: `Invalid status: ${status}` },
          { status: 400 }
        );
      }
      where.status = parsed;
    }

    if (departmentId) {
      where.departmentId = departmentId;
    }

    const jobPostings = await prisma.jobPosting.findMany({
      where,
      include: {
        department: true,
        jobTitle: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        _count: {
          select: {
            applicants: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    const result = jobPostings.map((jp) => ({
      id: jp.id,
      title: jp.title,
      titleAr: jp.titleAr,
      description: jp.description,
      requirements: jp.requirements,
      responsibilities: jp.responsibilities,
      benefits: jp.benefits,
      departmentId: jp.departmentId,
      departmentName: jp.department?.name,
      jobTitleId: jp.jobTitleId,
      jobTitleName: jp.jobTitle?.name,
      status: mapStatus(jp.status),
      jobType: mapJobType(jp.jobType),
      experienceLevel: mapExperienceLevel(jp.experienceLevel),
      positions: jp.positions,
      location: jp.location,
      salaryMin: jp.salaryMin ? parseFloat(jp.salaryMin.toString()) : null,
      salaryMax: jp.salaryMax ? parseFloat(jp.salaryMax.toString()) : null,
      salaryCurrency: jp.salaryCurrency,
      postedAt: jp.postedAt?.toISOString(),
      closedAt: jp.closedAt?.toISOString(),
      expiresAt: jp.expiresAt?.toISOString(),
      createdBy: {
        id: jp.createdBy.id,
        name: `${jp.createdBy.firstName} ${jp.createdBy.lastName}`
      },
      applicantsCount: jp._count.applicants,
      createdAt: jp.createdAt.toISOString(),
      updatedAt: jp.updatedAt.toISOString()
    }));

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Error fetching job postings:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch job postings" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, RECRUITMENT_ALLOWED_ROLES);
    if (!auth.ok) return auth.response;
    const { tenantId, session } = auth;

    const parsedBody = jobPostingCreateSchema.safeParse(await request.json());
    if (!parsedBody.success) {
      return NextResponse.json(
        { success: false, error: "Invalid request body", details: parsedBody.error.flatten() },
        { status: 400 }
      );
    }

    const body = parsedBody.data;

    const status = body.status
      ? (parseJobPostingStatus(body.status) ?? JobPostingStatus.DRAFT)
      : JobPostingStatus.DRAFT;
    if (
      body.status &&
      status === JobPostingStatus.DRAFT &&
      !body.status.toUpperCase().includes("DRAFT")
    ) {
      return NextResponse.json(
        { success: false, error: `Invalid status: ${body.status}` },
        { status: 400 }
      );
    }

    const jobType = body.jobType
      ? (parseJobType(body.jobType) ?? JobType.FULL_TIME)
      : JobType.FULL_TIME;
    if (
      body.jobType &&
      jobType === JobType.FULL_TIME &&
      !body.jobType.toUpperCase().includes("FULL_TIME")
    ) {
      return NextResponse.json(
        { success: false, error: `Invalid jobType: ${body.jobType}` },
        { status: 400 }
      );
    }

    const experienceLevel = body.experienceLevel
      ? (parseExperienceLevel(body.experienceLevel) ?? ExperienceLevel.MID)
      : ExperienceLevel.MID;
    if (
      body.experienceLevel &&
      experienceLevel === ExperienceLevel.MID &&
      !body.experienceLevel.toUpperCase().includes("MID")
    ) {
      return NextResponse.json(
        { success: false, error: `Invalid experienceLevel: ${body.experienceLevel}` },
        { status: 400 }
      );
    }

    const jobPosting = await prisma.jobPosting.create({
      data: {
        tenantId,
        title: body.title,
        titleAr: body.titleAr,
        description: body.description,
        requirements: body.requirements,
        responsibilities: body.responsibilities,
        benefits: body.benefits,
        departmentId: body.departmentId,
        jobTitleId: body.jobTitleId,
        status,
        jobType,
        experienceLevel,
        positions: body.positions,
        location: body.location,
        salaryMin: body.salaryMin,
        salaryMax: body.salaryMax,
        salaryCurrency: body.salaryCurrency,
        postedAt: body.postedAt ? new Date(body.postedAt) : null,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        createdById: session.user.id
      },
      include: {
        department: true,
        jobTitle: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: jobPosting.id,
        title: jobPosting.title,
        status: mapStatus(jobPosting.status),
        createdAt: jobPosting.createdAt.toISOString()
      }
    });
  } catch (error) {
    console.error("Error creating job posting:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create job posting" },
      { status: 500 }
    );
  }
}
