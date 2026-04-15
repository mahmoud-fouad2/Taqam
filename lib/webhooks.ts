/**
 * Webhook Delivery Utility
 *
 * Delivers signed webhook payloads to registered tenant endpoints.
 * Each delivery includes an HMAC-SHA256 signature in the `X-Jisr-Signature` header
 * so the recipient can verify authenticity.
 *
 * Signature format: sha256=<hex>
 * Signed string:    `${timestamp}.${JSON.stringify(payload)}`
 */
import { createHash, createHmac, randomBytes } from "crypto";
import prisma from "@/lib/db";

/** Supported webhook event types */
export const WEBHOOK_EVENTS = [
  "employee.created",
  "employee.updated",
  "employee.terminated",
  "leave.requested",
  "leave.approved",
  "leave.rejected",
  "attendance.checkin",
  "attendance.checkout",
  "payroll.processed",
  "document.uploaded",
  "document.expiring"
] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

/** Hash a raw secret for storage (one-way) */
export function hashSecret(secret: string): string {
  return createHash("sha256").update(secret).digest("hex");
}

/** Generate a new random webhook secret (hex, 32 bytes) */
export function generateWebhookSecret(): string {
  return randomBytes(32).toString("hex");
}

/** Compute the HMAC-SHA256 signature for a payload */
function computeSignature(secret: string, timestamp: number, body: string): string {
  const signingInput = `${timestamp}.${body}`;
  return "sha256=" + createHmac("sha256", secret).update(signingInput).digest("hex");
}

/**
 * Deliver a webhook event to all active registered endpoints for the tenant.
 * Fire-and-forget: never throws. Logs delivery result to WebhookDelivery table.
 */
export async function deliverWebhookEvent(
  tenantId: string,
  event: WebhookEvent,
  payload: Record<string, unknown>
): Promise<void> {
  // Find all active webhooks subscribed to this event
  const webhooks = await prisma.webhook.findMany({
    where: { tenantId, isActive: true },
    select: { id: true, url: true, secretHash: true, events: true }
  });

  const subscribed = webhooks.filter((w) => w.events.length === 0 || w.events.includes(event));

  if (subscribed.length === 0) return;

  const timestamp = Math.floor(Date.now() / 1000);
  const body = JSON.stringify({ event, timestamp, data: payload });

  await Promise.allSettled(
    subscribed.map(async (webhook) => {
      const signature = computeSignature(webhook.secretHash, timestamp, body);

      let statusCode: number | null = null;
      let responseText: string | null = null;
      let status: "success" | "failed" = "failed";

      try {
        const res = await fetch(webhook.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Jisr-Signature": signature,
            "X-Jisr-Event": event,
            "X-Jisr-Timestamp": String(timestamp)
          },
          body,
          signal: AbortSignal.timeout(10_000) // 10 s timeout
        });
        statusCode = res.status;
        const text = await res.text().catch(() => "");
        responseText = text.slice(0, 500); // Store up to 500 chars
        status = res.ok ? "success" : "failed";
      } catch {
        // Network error, timeout, etc.
        status = "failed";
      }

      await prisma.webhookDelivery.create({
        data: {
          webhookId: webhook.id,
          event,
          payload: payload as object,
          status,
          statusCode,
          response: responseText,
          deliveredAt: status === "success" ? new Date() : null
        }
      });
    })
  );
}
