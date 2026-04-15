/**
 * Job Offers API Routes
 * /api/recruitment/job-offers
 */

import { logApiError } from "@/lib/api/route-helper";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ApplicationStatus, JobType, OfferStatus, Prisma } from "@prisma/client";
import { z } from "zod";

const offerBenefitSchema = z.object({
  name: z.string().min(1),
  value: z.string().optional(),
  description: z.string().optional()
});

const offerApproverSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  status: z.enum(["pending", "approved", "rejected"]),
  comments: z.string().optional(),
  actionAt: z.string().optional()
});

const manualCandidateSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional()
});

const createOfferSchema = z
  .object({
    applicantId: z.string().min(1).optional(),
    manualCandidate: manualCandidateSchema.optional(),
    jobPostingId: z.string().min(1),
    departmentId: z.string().nullable().optional(),
    offeredSalary: z.number().nonnegative().nullable().optional(),
    currency: z.string().min(1).optional(),
    jobType: z.string().optional(),
    startDate: z.string().nullable().optional(),
    probationPeriod: z.number().int().min(0).nullable().optional(),
    benefits: z.array(offerBenefitSchema).optional(),
    termsAndConditions: z.string().nullable().optional(),
    status: z.string().optional(),
    validUntil: z.string().nullable().optional(),
    approvers: z.array(offerApproverSchema).optional(),
    sentAt: z.string().nullable().optional(),
    respondedAt: z.string().nullable().optional(),
    declineReason: z.string().nullable().optional()
  })
  .superRefine((value, ctx) => {
    if (!value.applicantId && !value.manualCandidate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["applicantId"],
        message: "Either applicantId or manualCandidate is required"
      });
    }
  });

function mapStatus(status: string): string {
  return status.toLowerCase().replace(/_/g, "-");
}

function parseJobType(value: unknown): JobType | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.toUpperCase().replace(/-/g, "_");
  return normalized in JobType ? (normalized as JobType) : undefined;
}

function parseOfferStatus(value: unknown): OfferStatus | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.toUpperCase().replace(/-/g, "_");
  return normalized in OfferStatus ? (normalized as OfferStatus) : undefined;
}

function mapJobType(type: string | null | undefined): string | null {
  if (!type) return null;
  return type.toLowerCase().replace(/_/g, "-");
}

type JobOfferRecord = Prisma.JobOfferGetPayload<{
  include: {
    applicant: { select: { id: true; firstName: true; lastName: true; email: true } };
    jobPosting: { select: { id: true; title: true; titleAr: true } };
    department: { select: { id: true; name: true; nameAr: true } };
  };
}>;

function mapOffer(offer: JobOfferRecord) {
  return {
    id: offer.id,
    applicantId: offer.applicantId,
    applicantName: `${offer.applicant.firstName} ${offer.applicant.lastName}`,
    applicantEmail: offer.applicant.email,
    jobPostingId: offer.jobPostingId,
    jobTitle: offer.jobPosting.title,
    departmentId: offer.departmentId ?? "",
    departmentName: offer.department?.name ?? "",
    offeredSalary: offer.offeredSalary ? Number(offer.offeredSalary) : 0,
    currency: offer.currency ?? "SAR",
    jobType: mapJobType(offer.jobType) ?? "full-time",
    startDate: offer.startDate?.toISOString() ?? new Date().toISOString(),
    probationPeriod: offer.probationPeriod ?? undefined,
    benefits: (offer.benefits as any) ?? [],
    termsAndConditions: offer.termsAndConditions ?? undefined,
    status: mapStatus(offer.status),
    validUntil: offer.validUntil?.toISOString() ?? new Date().toISOString(),
    approvers: (offer.approvers as any) ?? [],
    sentAt: offer.sentAt?.toISOString() ?? undefined,
    respondedAt: offer.respondedAt?.toISOString() ?? undefined,
    declineReason: offer.declineReason ?? undefined,
    createdBy: offer.createdById,
    createdAt: offer.createdAt.toISOString(),
    updatedAt: offer.updatedAt.toISOString()
  };
}

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
    const statusParam = searchParams.get("status");

    const where: Prisma.JobOfferWhereInput = { tenantId };
    if (statusParam) {
      const raw = statusParam
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const statuses: OfferStatus[] = [];
      const invalid: string[] = [];
      for (const value of raw) {
        const parsed = parseOfferStatus(value);
        if (!parsed) invalid.push(value);
        else statuses.push(parsed);
      }

      if (invalid.length > 0) {
        return NextResponse.json(
          { success: false, error: `Invalid status: ${invalid.join(", ")}` },
          { status: 400 }
        );
      }

      if (statuses.length === 1) where.status = statuses[0];
      else if (statuses.length > 1) where.status = { in: statuses };
    }

    const offers = await prisma.jobOffer.findMany({
      where,
      include: {
        applicant: { select: { id: true, firstName: true, lastName: true, email: true } },
        jobPosting: { select: { id: true, title: true, titleAr: true } },
        department: { select: { id: true, name: true, nameAr: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ success: true, data: offers.map(mapOffer) });
  } catch (error) {
    logApiError("Error fetching job offers", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch job offers" },
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

    const body = createOfferSchema.parse(await request.json());

    const jobPosting = await prisma.jobPosting.findFirst({
      where: { id: body.jobPostingId, tenantId },
      select: { id: true, departmentId: true }
    });

    if (!jobPosting) {
      return NextResponse.json({ success: false, error: "Job posting not found" }, { status: 400 });
    }

    if (body.applicantId) {
      const applicant = await prisma.applicant.findFirst({
        where: { id: body.applicantId, tenantId }
      });
      if (!applicant) {
        return NextResponse.json({ success: false, error: "Applicant not found" }, { status: 400 });
      }
    }

    if (body.departmentId) {
      const department = await prisma.department.findFirst({
        where: { id: body.departmentId, tenantId }
      });
      if (!department) {
        return NextResponse.json(
          { success: false, error: "Department not found" },
          { status: 400 }
        );
      }
    }

    const jobType = body.jobType ? parseJobType(body.jobType) : undefined;
    if (body.jobType && !jobType) {
      return NextResponse.json({ success: false, error: "Invalid job type" }, { status: 400 });
    }

    const status = body.status ? parseOfferStatus(body.status) : OfferStatus.DRAFT;
    if (body.status && !status) {
      return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 });
    }

    const created = await prisma.$transaction(async (tx) => {
      let applicantId = body.applicantId;

      if (!applicantId && body.manualCandidate) {
        const newApplicant = await tx.applicant.create({
          data: {
            tenantId,
            jobPostingId: body.jobPostingId,
            firstName: body.manualCandidate.firstName.trim(),
            lastName: body.manualCandidate.lastName.trim(),
            email: body.manualCandidate.email.trim().toLowerCase(),
            phone: body.manualCandidate.phone?.trim() || null,
            status: ApplicationStatus.OFFER,
            source: "direct",
            notes: "Created from direct offer workflow"
          }
        });

        applicantId = newApplicant.id;
      }

      return tx.jobOffer.create({
        data: {
          tenantId,
          applicantId: applicantId!,
          jobPostingId: body.jobPostingId,
          departmentId: body.departmentId ?? jobPosting.departmentId ?? null,
          offeredSalary: body.offeredSalary ?? null,
          currency: body.currency ?? "SAR",
          jobType,
          startDate: body.startDate ? new Date(body.startDate) : null,
          probationPeriod: body.probationPeriod ?? null,
          benefits: body.benefits ?? [],
          termsAndConditions: body.termsAndConditions ?? null,
          status,
          validUntil: body.validUntil ? new Date(body.validUntil) : null,
          approvers: body.approvers ?? [],
          sentAt: body.sentAt ? new Date(body.sentAt) : null,
          respondedAt: body.respondedAt ? new Date(body.respondedAt) : null,
          declineReason: body.declineReason ?? null,
          createdById: session.user.id
        },
        include: {
          applicant: { select: { id: true, firstName: true, lastName: true, email: true } },
          jobPosting: { select: { id: true, title: true, titleAr: true } },
          department: { select: { id: true, name: true, nameAr: true } }
        }
      });
    });

    return NextResponse.json({ success: true, data: mapOffer(created) });
  } catch (error) {
    logApiError("Error creating job offer", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: "Invalid payload" }, { status: 400 });
    }

    return NextResponse.json(
      { success: false, error: "Failed to create job offer" },
      { status: 500 }
    );
  }
}
