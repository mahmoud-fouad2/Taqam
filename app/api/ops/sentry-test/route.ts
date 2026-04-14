import * as Sentry from "@sentry/nextjs";
import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function readSecret(): string | undefined {
  const raw = process.env.SENTRY_TEST_SECRET;
  const value = typeof raw === "string" ? raw.trim() : "";
  return value.length > 0 ? value : undefined;
}

function secretsMatch(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  return timingSafeEqual(aBuffer, bBuffer);
}

function getProvidedSecret(req: Request): string | undefined {
  const header = req.headers.get("x-sentry-test-secret");
  const value = typeof header === "string" ? header.trim() : "";
  return value.length > 0 ? value : undefined;
}

export async function POST(req: Request) {
  const secret = readSecret();

  if (!secret) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const provided = getProvidedSecret(req);
  if (!provided || !secretsMatch(provided, secret)) {
    return new NextResponse("Unauthorized", {
      status: 401,
      headers: {
        "Cache-Control": "no-store, max-age=0"
      }
    });
  }

  const message = `Sentry controlled test event (${new Date().toISOString()})`;
  const eventId = Sentry.captureMessage(message, "info");

  await Sentry.flush(2_000);

  return NextResponse.json(
    {
      ok: true,
      message,
      eventId
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0"
      }
    }
  );
}
