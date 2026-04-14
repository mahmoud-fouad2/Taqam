import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { deriveSystemHealthSnapshot, toPublicSystemHealthSnapshot } from "@/lib/health";
import { getRuntimeIntegrationReport } from "@/lib/runtime-integrations";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  let dbStatus: "connected" | "error" | "unknown" = "unknown";

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = "connected";
  } catch {
    dbStatus = "error";
  }

  const snapshot = deriveSystemHealthSnapshot({
    databaseStatus: dbStatus,
    runtimeReport: getRuntimeIntegrationReport()
  });
  const publicSnapshot = toPublicSystemHealthSnapshot(snapshot);

  return NextResponse.json(publicSnapshot, {
    status: publicSnapshot.httpStatus,
    headers: {
      "Cache-Control": "no-store, max-age=0"
    }
  });
}
