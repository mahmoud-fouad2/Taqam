/**
 * Platform Settings API (Super Admin Only)
 * GET  - Get platform settings
 * PUT  - Update platform settings
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET platform settings
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get or create default settings
    let settings = await prisma.platformSettings.findFirst();
    
    if (!settings) {
      settings = await prisma.platformSettings.create({
        data: {
          platformName: "طاقم",
          platformNameEn: "Taqam",
          supportEmail: "support@taqam.com",
          trialDays: 14,
          trialMaxEmployees: 10,
          primaryColor: "#0284c7",
        },
      });
    }

    return NextResponse.json({ data: settings });
  } catch (error) {
    console.error("GET platform settings error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT update platform settings
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    
    // Get existing or create
    let settings = await prisma.platformSettings.findFirst();
    
    if (!settings) {
      settings = await prisma.platformSettings.create({
        data: {
          ...body,
        },
      });
    } else {
      settings = await prisma.platformSettings.update({
        where: { id: settings.id },
        data: {
          platformName: body.platformName,
          platformNameEn: body.platformNameEn,
          supportEmail: body.supportEmail,
          supportPhone: body.supportPhone,
          trialDays: body.trialDays,
          trialMaxEmployees: body.trialMaxEmployees,
          primaryColor: body.primaryColor,
          logoUrl: body.logoUrl,
          faviconUrl: body.faviconUrl,
          twitterUrl: body.twitterUrl,
          linkedinUrl: body.linkedinUrl,
          facebookUrl: body.facebookUrl,
          termsUrl: body.termsUrl,
          privacyUrl: body.privacyUrl,
          maintenanceMode: body.maintenanceMode,
          maintenanceMsg: body.maintenanceMsg,
        },
      });
    }

    return NextResponse.json({ data: settings });
  } catch (error) {
    console.error("PUT platform settings error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
