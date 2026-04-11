/**
 * Notification Preferences API
 * GET /api/notifications/preferences
 * PUT /api/notifications/preferences
 */

import { NextRequest, NextResponse } from "next/server";
import { dataResponse, errorResponse, logApiError, requireSession } from "@/lib/api/route-helper";
import prisma from "@/lib/db";

function defaultByType() {
  return {
    "request-status": { email: true, push: true, sms: false },
    "approval-needed": { email: true, push: true, sms: false },
    reminder: { email: true, push: true, sms: false },
    announcement: { email: true, push: true, sms: false },
    payslip: { email: true, push: true, sms: false },
    "document-expiry": { email: true, push: true, sms: false },
    training: { email: true, push: true, sms: false },
    system: { email: true, push: true, sms: false }
  };
}

export async function GET() {
  try {
    const auth = await requireSession();
    if (!auth.ok) return auth.response;
    const { session } = auth;

    const userId = session.user.id;

    const pref = await prisma.notificationPreference.findUnique({
      where: { userId }
    });

    if (!pref) {
      const created = await prisma.notificationPreference.create({
        data: {
          userId,
          email: true,
          push: true,
          sms: false,
          byType: defaultByType()
        }
      });

      return dataResponse({
        email: created.email,
        push: created.push,
        sms: created.sms,
        byType: created.byType ?? defaultByType()
      });
    }

    return dataResponse({
      email: pref.email,
      push: pref.push,
      sms: pref.sms,
      byType: pref.byType ?? defaultByType()
    });
  } catch (error) {
    logApiError("Error fetching notification preferences", error);
    return errorResponse("Failed to fetch notification preferences");
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireSession(request);
    if (!auth.ok) return auth.response;
    const { session } = auth;

    const userId = session.user.id;
    const body = await request.json();

    const updated = await prisma.notificationPreference.upsert({
      where: { userId },
      create: {
        userId,
        email: body.email ?? true,
        push: body.push ?? true,
        sms: body.sms ?? false,
        byType: body.byType ?? defaultByType()
      },
      update: {
        ...(body.email !== undefined ? { email: Boolean(body.email) } : {}),
        ...(body.push !== undefined ? { push: Boolean(body.push) } : {}),
        ...(body.sms !== undefined ? { sms: Boolean(body.sms) } : {}),
        ...(body.byType !== undefined ? { byType: body.byType } : {})
      }
    });

    return dataResponse({
      email: updated.email,
      push: updated.push,
      sms: updated.sms,
      byType: updated.byType ?? defaultByType()
    });
  } catch (error) {
    logApiError("Error updating notification preferences", error);
    return errorResponse("Failed to update notification preferences");
  }
}
