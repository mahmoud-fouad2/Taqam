import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { logger } from "@/lib/logger";

/**
 * Rate Limiting Utility
 *
 * Production uses Upstash Redis when configured.
 * Local development and CI fall back to in-process memory so the app keeps working
 * without external infrastructure.
 */

type RateLimitOptions = {
  limit: number;
  windowMs: number;
  keyPrefix: string;
  identifier?: string;
};

type RateLimitMode = "memory" | "distributed";

type Bucket = {
  resetAt: number;
  count: number;
};

const buckets = new Map<string, Bucket>();
const limiterCache = new Map<string, Ratelimit>();
const ephemeralCache = new Map<string, number>();

let redisClient: Redis | null | undefined;
let warnedAboutRateLimitFallback = false;

// Periodically clean expired buckets to prevent memory leaks
if (typeof setInterval !== "undefined") {
  setInterval(
    () => {
      const t = Date.now();
      for (const [key, bucket] of buckets.entries()) {
        if (bucket.resetAt <= t) buckets.delete(key);
      }
    },
    5 * 60 * 1000
  );
}

function now() {
  return Date.now();
}

function getRedisClient() {
  if (redisClient !== undefined) {
    return redisClient;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    redisClient = null;
    return redisClient;
  }

  redisClient = new Redis({ url, token });
  return redisClient;
}

function windowToDuration(windowMs: number): Parameters<typeof Ratelimit.fixedWindow>[1] {
  const seconds = Math.max(1, Math.ceil(windowMs / 1000));
  return `${seconds} s` as Parameters<typeof Ratelimit.fixedWindow>[1];
}

function getDistributedLimiter(options: RateLimitOptions) {
  const redis = getRedisClient();
  if (!redis) {
    return null;
  }

  const cacheKey = `${options.keyPrefix}:${options.limit}:${options.windowMs}`;
  const existing = limiterCache.get(cacheKey);
  if (existing) {
    return existing;
  }

  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.fixedWindow(options.limit, windowToDuration(options.windowMs)),
    prefix: options.keyPrefix,
    analytics: false,
    ephemeralCache
  });

  limiterCache.set(cacheKey, limiter);
  return limiter;
}

function warnAboutRateLimitFallback(error: unknown) {
  if (warnedAboutRateLimitFallback || process.env.NODE_ENV === "test") {
    return;
  }

  warnedAboutRateLimitFallback = true;
  logger.warn("[rate-limit] Falling back to in-memory limiter", {
    error: error instanceof Error ? error.message : String(error)
  });
}

function resolveIdentifier(req: Request, options: RateLimitOptions) {
  return options.identifier?.trim() || getClientIp(req);
}

function logRateLimitExceeded(identifier: string, options: RateLimitOptions, mode: RateLimitMode) {
  if (process.env.NODE_ENV === "test") {
    return;
  }

  logger.security("rate_limit_exceeded", {
    keyPrefix: options.keyPrefix,
    identifier,
    mode,
    limit: options.limit,
    windowMs: options.windowMs
  });
}

export function getClientIp(req: Request): string {
  // Prefer x-forwarded-for (Render / proxies)
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;

  return "unknown";
}

function checkRateLimitInMemory(
  req: Request,
  options: RateLimitOptions
): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  identifier: string;
  limit: number;
  mode: RateLimitMode;
} {
  const identifier = resolveIdentifier(req, options);
  const key = `${options.keyPrefix}:${identifier}`;

  const t = now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= t) {
    const resetAt = t + options.windowMs;
    buckets.set(key, { resetAt, count: 1 });
    return {
      allowed: true,
      remaining: Math.max(0, options.limit - 1),
      resetAt,
      identifier,
      limit: options.limit,
      mode: "memory"
    };
  }

  if (existing.count >= options.limit) {
    logRateLimitExceeded(identifier, options, "memory");
    return {
      allowed: false,
      remaining: 0,
      resetAt: existing.resetAt,
      identifier,
      limit: options.limit,
      mode: "memory"
    };
  }

  existing.count += 1;
  buckets.set(key, existing);
  return {
    allowed: true,
    remaining: Math.max(0, options.limit - existing.count),
    resetAt: existing.resetAt,
    identifier,
    limit: options.limit,
    mode: "memory"
  };
}

export async function checkRateLimit(
  req: Request,
  options: RateLimitOptions
): Promise<{
  allowed: boolean;
  remaining: number;
  resetAt: number;
  identifier: string;
  limit: number;
  mode: RateLimitMode;
}> {
  const identifier = resolveIdentifier(req, options);
  const distributedLimiter = getDistributedLimiter(options);

  if (!distributedLimiter) {
    return checkRateLimitInMemory(req, options);
  }

  try {
    const result = await distributedLimiter.limit(identifier);
    if (!result.success) {
      logRateLimitExceeded(identifier, options, "distributed");
    }

    return {
      allowed: result.success,
      remaining: result.remaining,
      resetAt: result.reset,
      identifier,
      limit: options.limit,
      mode: "distributed"
    };
  } catch (error) {
    warnAboutRateLimitFallback(error);
    return checkRateLimitInMemory(req, options);
  }
}

export function withRateLimitHeaders<T extends Response>(
  res: T,
  info: { remaining: number; resetAt: number; limit: number }
): T {
  res.headers.set("X-RateLimit-Limit", String(info.limit));
  res.headers.set("X-RateLimit-Remaining", String(info.remaining));
  res.headers.set("X-RateLimit-Reset", String(Math.floor(info.resetAt / 1000)));

  const retryAfterSeconds = Math.max(0, Math.ceil((info.resetAt - Date.now()) / 1000));
  if (retryAfterSeconds > 0) {
    res.headers.set("Retry-After", String(retryAfterSeconds));
  }

  return res;
}
