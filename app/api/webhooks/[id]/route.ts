/**
 * GET    /api/webhooks/[id]   — get webhook details + recent deliveries
 * PATCH  /api/webhooks/[id]   — update url / events / active status
 * DELETE /api/webhooks/[id]   — remove webhook
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireTenantSession, logApiError } from "@/lib/api/route-helper";
import prisma from "@/lib/db";
import { WEBHOOK_EVENTS } from "@/lib/webhooks";

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireTenantSession(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const webhook = await prisma.webhook.findFirst({
      where: { id, tenantId: auth.tenantId },
      select: {
        id: true,
        url: true,
        description: true,
        events: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        deliveries: {
          orderBy: { sentAt: "desc" },
          take: 20,
          select: {
            id: true,
            event: true,
            status: true,
            statusCode: true,
            attempt: true,
            sentAt: true,
            deliveredAt: true
          }
        }
      }
    });

    if (!webhook) {
      return NextResponse.json({ error: "Webhook غير موجود" }, { status: 404 });
    }

    return NextResponse.json({ data: webhook });
  } catch (err) {
    logApiError("GET /api/webhooks/[id]", err);
    return NextResponse.json({ error: "حدث خطأ في جلب webhook" }, { status: 500 });
  }
}

// ── PATCH ─────────────────────────────────────────────────────────────────────

const patchSchema = z.object({
  url: z.string().url().startsWith("https://").optional(),
  description: z.string().max(200).nullable().optional(),
  events: z.array(z.enum(WEBHOOK_EVENTS)).optional(),
  isActive: z.boolean().optional()
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireTenantSession(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const existing = await prisma.webhook.findFirst({
      where: { id, tenantId: auth.tenantId },
      select: { id: true }
    });
    if (!existing) {
      return NextResponse.json({ error: "Webhook غير موجود" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "بيانات غير صالحة", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updated = await prisma.webhook.update({
      where: { id },
      data: {
        ...(parsed.data.url !== undefined && { url: parsed.data.url }),
        ...(parsed.data.description !== undefined && { description: parsed.data.description }),
        ...(parsed.data.events !== undefined && { events: parsed.data.events }),
        ...(parsed.data.isActive !== undefined && { isActive: parsed.data.isActive })
      },
      select: {
        id: true,
        url: true,
        description: true,
        events: true,
        isActive: true,
        updatedAt: true
      }
    });

    return NextResponse.json({ data: updated });
  } catch (err) {
    logApiError("PATCH /api/webhooks/[id]", err);
    return NextResponse.json({ error: "حدث خطأ في تعديل webhook" }, { status: 500 });
  }
}

// ── DELETE ────────────────────────────────────────────────────────────────────

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireTenantSession(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const existing = await prisma.webhook.findFirst({
      where: { id, tenantId: auth.tenantId },
      select: { id: true }
    });
    if (!existing) {
      return NextResponse.json({ error: "Webhook غير موجود" }, { status: 404 });
    }

    await prisma.webhook.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    logApiError("DELETE /api/webhooks/[id]", err);
    return NextResponse.json({ error: "حدث خطأ في حذف webhook" }, { status: 500 });
  }
}
