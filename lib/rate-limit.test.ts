import { describe, expect, it, vi, afterEach } from "vitest";
import type { NextRequest } from "next/server";

import { checkRateLimit } from "@/lib/rate-limit";

function makeReq(ip: string): NextRequest {
  return { headers: new Headers({ "x-forwarded-for": ip }) } as unknown as NextRequest;
}

describe("checkRateLimit", () => {
  afterEach(() => {
    vi.useRealTimers();
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  it("allows up to the limit and then blocks", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-01T00:00:00Z"));

    const req = makeReq("1.2.3.4");

    const limit = 3;
    const windowMs = 1000;

    expect((await checkRateLimit(req, { keyPrefix: "t", limit, windowMs })).allowed).toBe(true);
    expect((await checkRateLimit(req, { keyPrefix: "t", limit, windowMs })).allowed).toBe(true);
    expect((await checkRateLimit(req, { keyPrefix: "t", limit, windowMs })).allowed).toBe(true);

    const blocked = await checkRateLimit(req, { keyPrefix: "t", limit, windowMs });
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("resets after the window", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-01T00:00:00Z"));

    const req = makeReq("5.6.7.8");

    const limit = 1;
    const windowMs = 1000;

    expect((await checkRateLimit(req, { keyPrefix: "t2", limit, windowMs })).allowed).toBe(true);
    expect((await checkRateLimit(req, { keyPrefix: "t2", limit, windowMs })).allowed).toBe(false);

    vi.setSystemTime(new Date("2025-01-01T00:00:02Z"));

    expect((await checkRateLimit(req, { keyPrefix: "t2", limit, windowMs })).allowed).toBe(true);
  });
});
