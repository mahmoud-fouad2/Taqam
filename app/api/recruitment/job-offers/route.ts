/**
 * Job Offers API Routes
 * /api/recruitment/job-offers
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { JobType, OfferStatus, Prisma } from "@prisma/client";

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

    const result = offers.map((o) => ({
      id: o.id,
      applicantId: o.applicantId,
      applicantName: `${o.applicant.firstName} ${o.applicant.lastName}`,
      applicantEmail: o.applicant.email,
      jobPostingId: o.jobPostingId,
      jobTitle: o.jobPosting.title,
      departmentId: o.departmentId ?? "",
      departmentName: o.department?.name ?? "",
      offeredSalary: o.offeredSalary ? Number(o.offeredSalary) : 0,
      currency: o.currency ?? "SAR",
      jobType: mapJobType(o.jobType) ?? "full-time",
      startDate: o.startDate?.toISOString() ?? new Date().toISOString(),
      probationPeriod: o.probationPeriod ?? undefined,
      benefits: (o.benefits as any) ?? [],
      termsAndConditions: o.termsAndConditions ?? undefined,
      status: mapStatus(o.status),
      validUntil: o.validUntil?.toISOString() ?? new Date().toISOString(),
      approvers: (o.approvers as any) ?? [],
      sentAt: o.sentAt?.toISOString() ?? undefined,
      respondedAt: o.respondedAt?.toISOString() ?? undefined,
      declineReason: o.declineReason ?? undefined,
      createdBy: o.createdById,
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString()
    }));

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Error fetching job offers:", error);
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

    const body = await request.json();

    if (!body.applicantId || !body.jobPostingId) {
      return NextResponse.json(
        { success: false, error: "Missing applicantId/jobPostingId" },
        { status: 400 }
      );
    }

    const jobType = parseJobType(body.jobType);
    const status = parseOfferStatus(body.status) ?? OfferStatus.DRAFT;

    const created = await prisma.jobOffer.create({
      data: {
        tenantId,
        applicantId: body.applicantId,
        jobPostingId: body.jobPostingId,
        departmentId: body.departmentId ?? null,
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
        jobPosting: { select: { id: true, title: true } },
        department: { select: { id: true, name: true } }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: created.id,
        applicantId: created.applicantId,
        applicantName: `${created.applicant.firstName} ${created.applicant.lastName}`,
        applicantEmail: created.applicant.email,
        jobPostingId: created.jobPostingId,
        jobTitle: created.jobPosting.title,
        departmentId: created.departmentId ?? "",
        departmentName: created.department?.name ?? "",
        offeredSalary: created.offeredSalary ? Number(created.offeredSalary) : 0,
        currency: created.currency ?? "SAR",
        jobType: mapJobType(created.jobType) ?? "full-time",
        startDate: created.startDate?.toISOString() ?? new Date().toISOString(),
        probationPeriod: created.probationPeriod ?? undefined,
        benefits: (created.benefits as any) ?? [],
        termsAndConditions: created.termsAndConditions ?? undefined,
        status: mapStatus(created.status),
        validUntil: created.validUntil?.toISOString() ?? new Date().toISOString(),
        approvers: (created.approvers as any) ?? [],
        sentAt: created.sentAt?.toISOString() ?? undefined,
        respondedAt: created.respondedAt?.toISOString() ?? undefined,
        declineReason: created.declineReason ?? undefined,
        createdBy: created.createdById,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString()
      }
    });
  } catch (error) {
    console.error("Error creating job offer:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create job offer" },
      { status: 500 }
    );
  }
}
