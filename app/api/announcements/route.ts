/**
 * Announcements API Routes
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notifyNewAnnouncement } from "@/lib/notifications/send";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get("isActive");
    const priority = searchParams.get("priority");

    const where: any = {};
    
    if (tenantId) {
      where.tenantId = tenantId;
    }
    
    if (isActive !== null) {
      where.isActive = isActive === "true";
    }
    
    if (priority) {
      where.priority = priority;
    }

    const announcements = await prisma.announcement.findMany({
      where,
      orderBy: [
        { priority: "desc" },
        { publishedAt: "desc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json({ data: announcements });
  } catch (error) {
    console.error("Error fetching announcements:", error);
    return NextResponse.json(
      { error: "Failed to fetch announcements" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    const userId = session.user.id;
    
    if (!tenantId) {
      return NextResponse.json({ error: "Tenant required" }, { status: 400 });
    }

    const body = await request.json();

    const announcement = await prisma.announcement.create({
      data: {
        tenantId,
        authorId: userId,
        title: body.title,
        titleAr: body.titleAr,
        content: body.content,
        contentAr: body.contentAr,
        type: body.type || "INFO",
        priority: body.priority || "NORMAL",
        targetAll: body.targetAll !== false,
        targetDeptIds: body.targetDeptIds || [],
        publishedAt: new Date(),
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
        isActive: true,
      },
    });

    // Fire bulk notifications (non-blocking)
    (async () => {
      try {
        const userWhere: any = {
          tenantId,
          status: "ACTIVE",
          id: { not: userId },
        };
        // If targeting specific departments, filter by employee departmentId
        if (!body.targetAll && body.targetDeptIds?.length > 0) {
          userWhere.employee = {
            departmentId: { in: body.targetDeptIds },
          };
        }
        const targetUsers = await prisma.user.findMany({
          where: userWhere,
          select: { id: true },
        });
        const targetUserIds = targetUsers.map((u: { id: string }) => u.id);
        if (targetUserIds.length > 0) {
          await notifyNewAnnouncement({
            tenantId,
            targetUserIds,
            announcementTitle: body.titleAr || body.title,
            announcementId: announcement.id,
          });
        }
      } catch (err) {
        console.error("Failed to send announcement notifications:", err);
      }
    })();

    return NextResponse.json({ data: announcement }, { status: 201 });
  } catch (error) {
    console.error("Error creating announcement:", error);
    return NextResponse.json(
      { error: "Failed to create announcement" },
      { status: 500 }
    );
  }
}
