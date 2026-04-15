import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { logCommercialAuditEntry } from "@/lib/marketing/commercial-audit";
import { pricingMarketingContentSchema } from "@/lib/marketing/pricing-marketing-schema";
import {
  getPricingMarketingContent,
  getPricingMarketingContentAdminState,
  savePricingMarketingContentDraft
} from "@/lib/marketing/pricing";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return unauthorized();
  }

  const state = await getPricingMarketingContentAdminState();
  return NextResponse.json({
    data: state.draft,
    published: state.published,
    hasUnpublishedChanges: state.hasUnpublishedChanges,
    lastDraftSavedAt: state.lastDraftSavedAt,
    lastPublishedAt: state.lastPublishedAt
  });
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return unauthorized();
  }

  const body = await request.json();
  const parsed = pricingMarketingContentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid pricing marketing payload",
        issues: parsed.error.flatten()
      },
      { status: 400 }
    );
  }

  const previousDraft = await getPricingMarketingContent("draft");
  const data = await savePricingMarketingContentDraft(parsed.data);
  const state = await getPricingMarketingContentAdminState();

  await logCommercialAuditEntry({
    userId: session.user.id,
    action: "COMMERCIAL_PRICING_MARKETING_DRAFT_SAVED",
    entity: "PricingMarketingContent",
    entityId: "pricing-marketing-content-draft",
    oldData: previousDraft,
    newData: data
  });

  return NextResponse.json({
    data: state.draft,
    published: state.published,
    hasUnpublishedChanges: state.hasUnpublishedChanges,
    lastDraftSavedAt: state.lastDraftSavedAt,
    lastPublishedAt: state.lastPublishedAt
  });
}
