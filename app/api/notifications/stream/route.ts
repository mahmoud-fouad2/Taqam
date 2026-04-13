/**
 * Notification Stream — SSE
 * GET /api/notifications/stream
 *
 * Delivers server-sent events with the current unread count.
 * Polls the DB every 15 seconds. Clients can listen and update their badge.
 * Falls back gracefully; clients should still poll /api/notifications on demand.
 */

import { NextRequest } from "next/server";
import { requireSession } from "@/lib/api/route-helper";
import prisma from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireSession(req);
  if (!auth.ok) {
    return new Response("Unauthorized", { status: 401 });
  }
  const { session } = auth;
  const userId = session.user.id;
  const tenantId = session.user.tenantId ?? null;

  let closed = false;
  req.signal.addEventListener("abort", () => { closed = true; });

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          closed = true;
        }
      };

      // Send initial count immediately
      try {
        const count = await prisma.notification.count({
          where: { userId, ...(tenantId ? { tenantId } : {}), isRead: false }
        });
        send({ type: "unread_count", count });
      } catch {
        send({ type: "unread_count", count: 0 });
      }

      // Poll every 15 s
      const interval = setInterval(async () => {
        if (closed) {
          clearInterval(interval);
          try { controller.close(); } catch { /* already closed */ }
          return;
        }
        try {
          const count = await prisma.notification.count({
            where: { userId, ...(tenantId ? { tenantId } : {}), isRead: false }
          });
          send({ type: "unread_count", count });
        } catch {
          // silently skip on error; client will retry on disconnect
        }
      }, 15_000);

      // Heartbeat every 25 s to keep connection alive through proxies
      const heartbeat = setInterval(() => {
        if (closed) { clearInterval(heartbeat); return; }
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          closed = true;
          clearInterval(heartbeat);
        }
      }, 25_000);
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no"
    }
  });
}
