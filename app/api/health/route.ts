import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getRuntimeIntegrationReport } from "@/lib/runtime-integrations";

export async function GET() {
  let dbStatus = "unknown";
  let dbError = null;
  let userCount = 0;
  const runtimeIntegrations = getRuntimeIntegrationReport();

  try {
    // Test database connection
    userCount = await prisma.user.count();
    dbStatus = "connected";
  } catch (error: unknown) {
    dbStatus = "error";
    dbError = error instanceof Error ? error.message : "Unknown error";
  }

  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: {
      status: dbStatus,
      userCount,
      error: dbError
    },
    env: {
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasSuperAdminEmail: !!process.env.SUPER_ADMIN_EMAIL,
      hasSupportEmail: !!process.env.NEXT_PUBLIC_SUPPORT_EMAIL
    },
    integrations: runtimeIntegrations.items.map((item) => ({
      id: item.id,
      name: item.name,
      configured: item.configured,
      mode: item.mode
    }))
  });
}
