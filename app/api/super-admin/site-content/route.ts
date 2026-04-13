import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { platformSiteContentSchema } from "@/lib/marketing/site-content-schema";
import { getPlatformSiteContent, savePlatformSiteContent } from "@/lib/marketing/site-content";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await getPlatformSiteContent();
  return NextResponse.json({ data });
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

  const data = await savePlatformSiteContent(parsed.data);

  return NextResponse.json({ data });
}