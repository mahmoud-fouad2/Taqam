import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  let dbStatus = "unknown";

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = "connected";
  } catch {
    dbStatus = "error";
  }

  const isHealthy = dbStatus === "connected";

  return NextResponse.json(
    {
      status: isHealthy ? "ok" : "error",
      timestamp: new Date().toISOString(),
      database: { status: dbStatus }
    },
    { status: isHealthy ? 200 : 503 }
  );
}
