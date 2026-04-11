import { NextRequest, NextResponse } from "next/server";

import { getPublicJobPostingById } from "@/lib/recruitment/public";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const tenantSlug = searchParams.get("tenantSlug") ?? undefined;

    const job = await getPublicJobPostingById(id, tenantSlug);
    if (!job) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ data: job });
  } catch (error) {
    console.error("GET public job posting error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
