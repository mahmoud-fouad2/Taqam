/**
 * Job Offer (single) API Routes
 * /api/recruitment/job-offers/:id
 */

import { logApiError } from "@/lib/api/route-helper";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { JobType, OfferStatus, Prisma } from "@prisma/client";
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

const updateOfferSchema = z.object({
  applicantId: z.string().min(1).optional(),
  jobPostingId: z.string().min(1).optional(),
  departmentId: z.string().nullable().optional(),
  offeredSalary: z.number().nonnegative().nullable().optional(),
  currency: z.string().min(1).nullable().optional(),
  jobType: z.string().nullable().optional(),
  startDate: z.string().nullable().optional(),
  probationPeriod: z.number().int().min(0).nullable().optional(),
  benefits: z.array(offerBenefitSchema).nullable().optional(),
  termsAndConditions: z.string().nullable().optional(),
  status: z.string().optional(),
  validUntil: z.string().nullable().optional(),
  approvers: z.array(offerApproverSchema).nullable().optional(),
  sentAt: z.string().nullable().optional(),
  respondedAt: z.string().nullable().optional(),
  declineReason: z.string().nullable().optional()
});

function mapStatus(status: string): string {
  return status.toLowerCase().replace(/_/g, "-");
}

function mapJobType(type: string | null | undefined): string | null {
  if (!type) return null;
  return type.toLowerCase().replace(/_/g, "-");
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

type JobOfferRecord = Prisma.JobOfferGetPayload<{
  include: {
    applicant: { select: { id: true; firstName: true; lastName: true; email: true } };
    jobPosting: { select: { id: true; title: true } };
    department: { select: { id: true; name: true } };
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
    benefits: Array.isArray(offer.benefits) ? offer.benefits : [],
    termsAndConditions: offer.termsAndConditions ?? undefined,
    status: mapStatus(offer.status),
    validUntil: offer.validUntil?.toISOString() ?? new Date().toISOString(),
    approvers: Array.isArray(offer.approvers) ? offer.approvers : [],
    sentAt: offer.sentAt?.toISOString() ?? undefined,
    respondedAt: offer.respondedAt?.toISOString() ?? undefined,
    declineReason: offer.declineReason ?? undefined,
    createdBy: offer.createdById,
    createdAt: offer.createdAt.toISOString(),
    updatedAt: offer.updatedAt.toISOString()
  };
}

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) {
      return NextResponse.json({ success: false, error: "No tenant" }, { status: 400 });
    }

    const { id } = await context.params;

    const offer = await prisma.jobOffer.findFirst({
      where: { id, tenantId },
      include: {
        applicant: { select: { id: true, firstName: true, lastName: true, email: true } },
        jobPosting: { select: { id: true, title: true } },
        department: { select: { id: true, name: true } }
      }
    });

    if (!offer) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: mapOffer(offer) });
  } catch (error) {
    logApiError("Error fetching job offer", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch job offer" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) {
      return NextResponse.json({ success: false, error: "No tenant" }, { status: 400 });
    }

    const { id } = await context.params;
    const body = updateOfferSchema.parse(await request.json());

    const existing = await prisma.jobOffer.findFirst({
      where: { id, tenantId }
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    if (body.applicantId) {
      const applicant = await prisma.applicant.findFirst({
        where: { id: body.applicantId, tenantId }
      });
      if (!applicant) {
        return NextResponse.json({ success: false, error: "Applicant not found" }, { status: 400 });
      }
    }

    if (body.jobPostingId) {
      const jobPosting = await prisma.jobPosting.findFirst({
        where: { id: body.jobPostingId, tenantId }
      });
      if (!jobPosting) {
        return NextResponse.json(
          { success: false, error: "Job posting not found" },
          { status: 400 }
        );
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

    const parsedJobType =
      body.jobType === null ? null : body.jobType ? parseJobType(body.jobType) : undefined;
    if (body.jobType && !parsedJobType) {
      return NextResponse.json({ success: false, error: "Invalid job type" }, { status: 400 });
    }

    const parsedStatus = body.status ? parseOfferStatus(body.status) : undefined;
    if (body.status && !parsedStatus) {
      return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 });
    }

    const updateData: Prisma.JobOfferUncheckedUpdateInput = {};

    if (body.applicantId !== undefined) updateData.applicantId = body.applicantId;
    if (body.jobPostingId !== undefined) updateData.jobPostingId = body.jobPostingId;
    if (body.departmentId !== undefined) updateData.departmentId = body.departmentId;
    if (body.offeredSalary !== undefined) updateData.offeredSalary = body.offeredSalary;
    if (body.currency !== undefined) updateData.currency = body.currency;
    if (body.jobType !== undefined) updateData.jobType = parsedJobType;
    if (body.startDate !== undefined)
      updateData.startDate = body.startDate ? new Date(body.startDate) : null;
    if (body.probationPeriod !== undefined) updateData.probationPeriod = body.probationPeriod;
    if (body.benefits !== undefined) updateData.benefits = body.benefits ?? Prisma.JsonNull;
    if (body.termsAndConditions !== undefined)
      updateData.termsAndConditions = body.termsAndConditions;
    if (parsedStatus !== undefined) updateData.status = parsedStatus;
    if (body.validUntil !== undefined)
      updateData.validUntil = body.validUntil ? new Date(body.validUntil) : null;
    if (body.approvers !== undefined) updateData.approvers = body.approvers ?? Prisma.JsonNull;
    if (body.declineReason !== undefined) updateData.declineReason = body.declineReason;

    if (body.sentAt !== undefined) {
      updateData.sentAt = body.sentAt ? new Date(body.sentAt) : null;
    } else if (parsedStatus === OfferStatus.DRAFT) {
      updateData.sentAt = null;
    } else if (
      (parsedStatus === OfferStatus.SENT ||
        parsedStatus === OfferStatus.ACCEPTED ||
        parsedStatus === OfferStatus.DECLINED) &&
      !existing.sentAt
    ) {
      updateData.sentAt = new Date();
    }

    if (body.respondedAt !== undefined) {
      updateData.respondedAt = body.respondedAt ? new Date(body.respondedAt) : null;
    } else if (parsedStatus === OfferStatus.DRAFT || parsedStatus === OfferStatus.SENT) {
      updateData.respondedAt = null;
    } else if (
      (parsedStatus === OfferStatus.ACCEPTED || parsedStatus === OfferStatus.DECLINED) &&
      !existing.respondedAt
    ) {
      updateData.respondedAt = new Date();
    }

    if (body.declineReason === undefined && parsedStatus && parsedStatus !== OfferStatus.DECLINED) {
      updateData.declineReason = null;
    }

    const updated = await prisma.jobOffer.update({
      where: { id },
      data: updateData,
      include: {
        applicant: { select: { id: true, firstName: true, lastName: true, email: true } },
        jobPosting: { select: { id: true, title: true } },
        department: { select: { id: true, name: true } }
      }
    });

    return NextResponse.json({ success: true, data: mapOffer(updated) });
  } catch (error) {
    logApiError("Error updating job offer", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: "Invalid payload" }, { status: 400 });
    }

    return NextResponse.json(
      { success: false, error: "Failed to update job offer" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) {
      return NextResponse.json({ success: false, error: "No tenant" }, { status: 400 });
    }

    const { id } = await context.params;

    await prisma.jobOffer.deleteMany({ where: { id, tenantId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    logApiError("Error deleting job offer", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete job offer" },
      { status: 500 }
    );
  }
}
