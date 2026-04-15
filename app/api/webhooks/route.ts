/**
 * GET  /api/webhooks   — list tenant webhooks
 * POST /api/webhooks   — register a new webhook endpoint
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireTenantSession, logApiError } from "@/lib/api/route-helper";
import { checkRateLimit, withRateLimitHeaders } from "@/lib/rate-limit";
import prisma from "@/lib/db";
import { WEBHOOK_EVENTS, generateWebhookSecret, hashSecret } from "@/lib/webhooks";

const createWebhookSchema = z.object({
  url: z.string().url().startsWith("https://", { message: "يجب أن يكون URL بروتوكول HTTPS" }),
  description: z.string().max(200).optional(),
  events: z.array(z.enum(WEBHOOK_EVENTS)).default([])
  // empty array = subscribe to ALL events
});

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const auth = await requireTenantSession(req);
  if (!auth.ok) return auth.response;

  try {
    const webhooks = await prisma.webhook.findMany({
      where: { tenantId: auth.tenantId },
      select: {
        id: true,
        url: true,
        description: true,
        events: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { deliveries: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ data: webhooks });
  } catch (err) {
    logApiError("GET /api/webhooks", err);
    return NextResponse.json({ error: "حدث خطأ في جلب webhooks" }, { status: 500 });
  }
}

// ── POST ──────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const auth = await requireTenantSession(req);
  if (!auth.ok) return auth.response;

  const rateLimit = await checkRateLimit(req, {
    keyPrefix: `webhooks:${auth.tenantId}`,
    limit: 10,
    windowMs: 60_000
  });
  if (!rateLimit.allowed) {
    return withRateLimitHeaders(
      NextResponse.json({ error: "طلبات كثيرة، حاول لاحقاً" }, { status: 429 }),
      rateLimit
    );
  }

  try {
    const body = await req.json();
    const parsed = createWebhookSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "بيانات غير صالحة", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Enforce max 20 webhooks per tenant
    const existing = await prisma.webhook.count({ where: { tenantId: auth.tenantId } });
    if (existing >= 20) {
      return NextResponse.json(
        { error: "لا يمكن تسجيل أكثر من 20 webhook لكل مستأجر" },
        { status: 400 }
      );
    }

    const rawSecret = generateWebhookSecret();
    const webhook = await prisma.webhook.create({
      data: {
        tenantId: auth.tenantId,
        url: parsed.data.url,
        description: parsed.data.description,
        events: parsed.data.events,
        secretHash: hashSecret(rawSecret)
      },
      select: {
        id: true,
        url: true,
        description: true,
        events: true,
        isActive: true,
        createdAt: true
      }
    });

    // Return the raw secret exactly once — it cannot be retrieved again
    return withRateLimitHeaders(
      NextResponse.json({ data: webhook, secret: rawSecret }, { status: 201 }),
      rateLimit
    );
  } catch (err) {
    logApiError("POST /api/webhooks", err);
    return NextResponse.json({ error: "حدث خطأ في إنشاء webhook" }, { status: 500 });
  }
}
