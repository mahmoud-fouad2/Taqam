import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { logCommercialAuditEntry } from "@/lib/marketing/commercial-audit";
import { platformSiteContentSchema } from "@/lib/marketing/site-content-schema";
import {
  getPlatformSiteContentAdminState,
  getPlatformSiteContentVersion,
  savePlatformSiteContentDraft
} from "@/lib/marketing/site-content";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const state = await getPlatformSiteContentAdminState();
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
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = platformSiteContentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid site content payload",
        issues: parsed.error.flatten()
      },
      { status: 400 }
    );
  }

  const previousDraft = await getPlatformSiteContentVersion("draft");
  const data = await savePlatformSiteContentDraft(parsed.data);
  const state = await getPlatformSiteContentAdminState();

  await logCommercialAuditEntry({
    userId: session.user.id,
    action: "COMMERCIAL_SITE_CONTENT_DRAFT_SAVED",
    entity: "PlatformSiteContent",
    entityId: "platform-site-content-draft",
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
