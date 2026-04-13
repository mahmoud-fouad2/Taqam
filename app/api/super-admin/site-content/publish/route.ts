import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { logCommercialAuditEntry } from "@/lib/marketing/commercial-audit";
import {
  getPlatformSiteContentAdminState,
  getPlatformSiteContentVersion,
  publishPlatformSiteContent
} from "@/lib/marketing/site-content";

export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const previousPublished = await getPlatformSiteContentVersion("published");
  const published = await publishPlatformSiteContent();
  const state = await getPlatformSiteContentAdminState();

  await logCommercialAuditEntry({
    userId: session.user.id,
    action: "COMMERCIAL_SITE_CONTENT_PUBLISHED",
    entity: "PlatformSiteContent",
    entityId: "platform-site-content",
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