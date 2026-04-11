import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { checkRateLimit, withRateLimitHeaders } from "@/lib/rate-limit";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    nextauth?: string | string[];
  }>;
};

async function getNextAuthSegments(ctx: RouteContext | undefined) {
  if (!ctx) return [];
  const params = await ctx.params;
  const raw = params?.nextauth;
  if (!raw) return [];
  return Array.isArray(raw) ? raw : [raw];
}

async function isCredentialsRequest(ctx: RouteContext | undefined) {
  const segments = await getNextAuthSegments(ctx);
  return (
    (segments[0] === "callback" && segments[1] === "credentials") ||
    (segments[0] === "signin" && segments[1] === "credentials")
  );
}

export async function GET(req: Request, ctx: RouteContext) {
  return (
    NextAuth as unknown as (
      req: Request,
      ctx: RouteContext,
      options: typeof authOptions
    ) => Promise<Response>
  )(req, ctx, authOptions);
}

export async function POST(req: Request, ctx: RouteContext) {
  if (!(await isCredentialsRequest(ctx))) {
    return (
      NextAuth as unknown as (
        req: Request,
        ctx: RouteContext,
        options: typeof authOptions
      ) => Promise<Response>
    )(req, ctx, authOptions);
  }

  const limit = 10;
  const limitInfo = await checkRateLimit(req, {
    keyPrefix: "web:auth:credentials",
    limit,
    windowMs: 5 * 60 * 1000
  });

  if (!limitInfo.allowed) {
    return withRateLimitHeaders(
      NextResponse.json({ error: "Too many requests" }, { status: 429 }),
      { limit, remaining: limitInfo.remaining, resetAt: limitInfo.resetAt }
    );
  }

  const res = await (
    NextAuth as unknown as (
      req: Request,
      ctx: RouteContext,
      options: typeof authOptions
    ) => Promise<Response>
  )(req, ctx, authOptions);
  return withRateLimitHeaders(res, {
    limit,
    remaining: limitInfo.remaining,
    resetAt: limitInfo.resetAt
  });
}
