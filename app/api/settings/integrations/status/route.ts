import { NextRequest, NextResponse } from "next/server";

import { requireSession } from "@/lib/api/route-helper";
import { getRuntimeIntegrationReport } from "@/lib/runtime-integrations";

export async function GET(request: NextRequest) {
  const auth = await requireSession(request);
  if (!auth.ok) {
    return auth.response;
  }

  return NextResponse.json({ data: getRuntimeIntegrationReport() });
}
