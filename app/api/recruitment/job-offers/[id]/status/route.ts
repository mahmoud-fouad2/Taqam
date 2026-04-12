/**
 * Job Offer status update
 * PATCH /api/recruitment/job-offers/:id/status
 */

import { logApiError } from "@/lib/api/route-helper";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { OfferStatus } from "@prisma/client";

function mapStatus(status: string): string {
  return status.toLowerCase().replace(/_/g, "-");
}

function parseOfferStatus(value: unknown): OfferStatus | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.toUpperCase().replace(/-/g, "_");
  return normalized in OfferStatus ? (normalized as OfferStatus) : undefined;
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
    const body = await request.json();

    if (!body.status) {
      return NextResponse.json({ success: false, error: "Missing status" }, { status: 400 });
    }

    const nextStatus = parseOfferStatus(body.status);
    if (!nextStatus) {
      return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 });
    }

    const updateResult = await prisma.jobOffer.updateMany({
      where: { id, tenantId },
      data: { status: nextStatus }
    });

    if (updateResult.count === 0) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

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

    return NextResponse.json({
      success: true,
      data: {
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
        jobType: offer.jobType ? offer.jobType.toLowerCase().replace(/_/g, "-") : "full-time",
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
      }
    });
  } catch (error) {
    logApiError("Error updating offer status", error);
    return NextResponse.json(
      { success: false, error: "Failed to update offer status" },
      { status: 500 }
    );
  }
}
