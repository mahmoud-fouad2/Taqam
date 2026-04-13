import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { logCommercialAuditEntry } from "@/lib/marketing/commercial-audit";
import {
  getPricingMarketingContent,
  getPricingMarketingContentAdminState,
  publishPricingMarketingContent
} from "@/lib/marketing/pricing";

export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const previousPublished = await getPricingMarketingContent("published");
  const published = await publishPricingMarketingContent();
  const state = await getPricingMarketingContentAdminState();

  await logCommercialAuditEntry({
    userId: session.user.id,
    action: "COMMERCIAL_PRICING_MARKETING_PUBLISHED",
    entity: "PricingMarketingContent",
    entityId: "pricing-marketing-content",
    oldData: previousPublished,
    newData: published
  });

  return NextResponse.json({
    data: state.draft,
    published: state.published,
    hasUnpublishedChanges: state.hasUnpublishedChanges,
    lastDraftSavedAt: state.lastDraftSavedAt,
    lastPublishedAt: state.lastPublishedAt
  });
}